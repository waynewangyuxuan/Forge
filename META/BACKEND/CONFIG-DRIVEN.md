# Config-Driven Design

> **核心思想**：状态机、Prompts、执行配置全部外部化为 YAML，代码只负责加载和执行

---

## 一、为什么配置驱动？

### 1.1 问题

如果把状态机、Prompt 都写在 TypeScript 里：

| 场景 | 痛点 |
|------|------|
| 改一个 Prompt 的措辞 | 改代码 → 编译 → 重启 |
| 测试不同的 Prompt 版本 | 需要代码分支或 feature flag |
| 回顾历史版本的 Prompt | 在代码 commit 里翻 |
| 让非工程师参与优化 Prompt | 不可能 |

### 1.2 解决方案

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   YAML (What)                      TypeScript (How)              │
│   ───────────                      ────────────────              │
│                                                                  │
│   状态机定义                        状态机引擎                     │
│   • 有哪些状态                      • transition()                │
│   • 如何转换                        • canTransition()             │
│                                                                  │
│   Prompt 模板                       Prompt 渲染器                 │
│   • 模板内容                        • render()                    │
│   • 变量定义                        • 变量替换                     │
│                                                                  │
│   执行参数                          执行引擎                       │
│   • 超时时间                        • 任务调度                     │
│   • 重试次数                        • 错误处理                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**原则**：配置定义 What，代码实现 How

### 1.3 收益

| 收益 | 说明 |
|------|------|
| **快速迭代** | 改 YAML 重启即生效，不用编译 |
| **版本对比** | YAML diff 比代码 diff 清晰得多 |
| **A/B 测试** | 多套配置文件，切换即可 |
| **协作友好** | 非工程师也能参与 Prompt 优化 |
| **关注点分离** | 配置人员关注内容，开发人员关注引擎 |

---

## 二、配置目录结构

```
config/
├── state-machines/              # 状态机定义
│   ├── dev-flow.yaml            # 开发流
│   └── runtime-flow.yaml        # 运行流
│
├── prompts/                     # Prompt 模板
│   ├── scaffold-generator.yaml  # Spec → Scaffold
│   ├── code-executor.yaml       # 单任务执行
│   └── dashboard-generator.yaml # 生成 Dashboard
│
└── execution.yaml               # 全局执行配置
```

---

## 三、状态机配置

### 3.1 设计思路

状态机定义包含：

1. **States**: 所有可能的状态，每个状态有 label 和描述
2. **Transitions**: 状态转换规则 (from + event → to)
3. **Initial State**: 初始状态

引擎只做一件事：给定当前状态和事件，返回下一个状态。

```
StateMachine.transition('drafting', 'GENERATE_SCAFFOLD') → 'scaffolding'
```

### 3.2 开发流状态机

```yaml
# config/state-machines/dev-flow.yaml

id: dev_flow
version: "1.0.0"
initial_state: drafting

states:
  drafting:
    label: "编写 Spec"
  scaffolding:
    label: "生成 Scaffold"
  reviewing:
    label: "Review"
  ready:
    label: "待执行"
  executing:
    label: "执行中"
  paused:
    label: "已暂停"
  completed:
    label: "已完成"
  error:
    label: "出错"

transitions:
  # Drafting → Scaffolding
  - { from: drafting, event: GENERATE_SCAFFOLD, to: scaffolding }
  
  # Scaffolding 完成
  - { from: scaffolding, event: SUCCESS, to: reviewing }
  - { from: scaffolding, event: ERROR, to: error }
  
  # Review 阶段
  - { from: reviewing, event: REGENERATE, to: scaffolding }
  - { from: reviewing, event: APPROVE, to: ready }
  - { from: reviewing, event: EDIT_SPEC, to: drafting }
  
  # 执行
  - { from: ready, event: START, to: executing }
  - { from: executing, event: TASK_DONE, to: executing }
  - { from: executing, event: ALL_DONE, to: completed }
  - { from: executing, event: PAUSE, to: paused }
  - { from: executing, event: ERROR, to: error }
  
  # 暂停/恢复
  - { from: paused, event: RESUME, to: executing }
  - { from: paused, event: ABORT, to: error }
  
  # 错误恢复
  - { from: error, event: RETRY, to: executing }
  - { from: error, event: RESET, to: drafting }
  
  # 迭代
  - { from: completed, event: ITERATE, to: drafting }
```

### 3.3 状态流转图

```
                    ┌──────────────────────────────────────────┐
                    │                                          │
                    ▼                                          │
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│ Drafting │───►│Scaffolding│───►│ Reviewing│───►│  Ready   │  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘  │
     ▲               │               │               │         │
     │               │               │               │         │
     │               ▼               │               ▼         │
     │          ┌──────────┐        │          ┌──────────┐   │
     │          │  Error   │◄───────┴──────────│ Executing│   │
     │          └──────────┘                   └──────────┘   │
     │               │                              │          │
     │               │                              ▼          │
     │               │                         ┌──────────┐   │
     └───────────────┴─────────────────────────│ Completed│───┘
                                               └──────────┘
```

### 3.4 运行流状态机

```yaml
# config/state-machines/runtime-flow.yaml

id: runtime_flow
version: "1.0.0"
initial_state: not_configured

states:
  not_configured:
    label: "未配置"
  idle:
    label: "空闲"
  running:
    label: "运行中"
  success:
    label: "成功"
  failed:
    label: "失败"

transitions:
  - { from: not_configured, event: CONFIGURE, to: idle }
  - { from: idle, event: TRIGGER, to: running }
  - { from: success, event: TRIGGER, to: running }
  - { from: failed, event: TRIGGER, to: running }
  - { from: running, event: SUCCESS, to: success }
  - { from: running, event: FAIL, to: failed }
```

---

## 四、Prompt 配置

### 4.1 设计思路

每个 Prompt 配置包含：

1. **Variables**: 模板中的变量列表，标注是否必填、默认值
2. **Template**: Prompt 模板，用 `{{variable}}` 占位
3. **Output**: 期望的输出格式（可选，用于验证）

渲染器做变量替换，输出最终 Prompt 字符串。

### 4.2 Scaffold Generator

这是最核心的 Prompt，负责把 Spec 转成 TODO.md。

```yaml
# config/prompts/scaffold-generator.yaml

id: scaffold_generator
version: "1.0.0"
description: "Spec → TODO.md"

variables:
  - name: project_name
    required: true
  - name: product_spec
    required: true
  - name: technical_spec
    required: true
  - name: max_tasks_per_milestone
    default: "15"

template: |
  <scaffold_generator>
  
  You are an expert software architect breaking down a project into tasks.
  
  ## Project: {{project_name}}
  
  <product_spec>
  {{product_spec}}
  </product_spec>
  
  <technical_spec>
  {{technical_spec}}
  </technical_spec>
  
  ## Task
  
  Generate TODO.md with:
  - 3-7 Milestones (logical groupings)
  - 5-{{max_tasks_per_milestone}} Tasks per milestone (atomic, 5-15 min each)
  
  ## Format
  
  ```markdown
  # TODO
  
  ## Milestone 1: [Name]
  
  - [ ] 001. [Task description]
    - Verify: [How to verify]
    - Depends: none
  ```
  
  ## Rules
  - Task IDs globally unique (001, 002, ...)
  - Dependencies reference task IDs
  - Output ONLY the TODO.md content
  
  </scaffold_generator>

output:
  format: markdown
```

### 4.3 Code Executor

执行单个任务的 Prompt。

```yaml
# config/prompts/code-executor.yaml

id: code_executor
version: "1.0.0"

variables:
  - name: project_path
    required: true
  - name: task_id
    required: true
  - name: task_description
    required: true
  - name: verification
    required: true
  - name: context
    required: false
    default: ""

template: |
  <code_executor>
  
  Working Directory: {{project_path}}
  
  ## Task {{task_id}}
  {{task_description}}
  
  ## Verification
  {{verification}}
  
  {{#if context}}
  ## Context
  {{context}}
  {{/if}}
  
  ## Instructions
  1. Implement the task
  2. Verify against criteria
  3. Update TODO.md: `- [ ] {{task_id}}` → `- [x] {{task_id}}`
  4. Commit: "{{task_id}}: {{task_description}}"
  
  Complete THIS task only. Do not proceed to next.
  
  </code_executor>
```

### 4.4 Prompt 版本管理

每个 Prompt 有 `version` 字段。改动时：

1. 更新 version（语义化版本）
2. 在 Git commit message 里说明改动原因
3. 可以通过 Git history 回滚到任意版本

---

## 五、执行配置

全局配置，控制执行行为。

```yaml
# config/execution.yaml

version: "1.0.0"

claude:
  default_model: claude-sonnet-4
  allowed_tools: [Read, Write, Bash]
  timeout_seconds: 300

execution:
  commit_strategy: per_milestone   # per_task | per_milestone | manual
  auto_retry_on_error: false
  max_retries: 3

git:
  auto_init: true
  auto_push: false

runtime:
  log_retention_days: 30
  health_check_interval_seconds: 60
```

---

## 六、Config Registry

### 6.1 职责

Config Registry 是配置的统一入口：

| 方法 | 作用 |
|------|------|
| `loadAll()` | 启动时加载所有配置 |
| `getStateMachine(id)` | 获取状态机定义 |
| `getPrompt(id)` | 获取 Prompt 模板 |
| `getGlobalConfig()` | 获取全局配置 |

### 6.2 加载流程

```
启动
  │
  ├── 扫描 config/state-machines/*.yaml
  │   └── 每个文件 → YAML parse → Zod validate → 存入 Map
  │
  ├── 扫描 config/prompts/*.yaml
  │   └── 每个文件 → YAML parse → Zod validate → 存入 Map
  │
  └── 加载 config/execution.yaml
      └── YAML parse → Zod validate → 存入字段
```

### 6.3 验证

每个配置加载时用 Zod Schema 验证：

- 缺少必填字段 → 报错并指出字段
- 类型不对 → 报错并指出期望类型
- 验证通过 → 存入内存

**验证失败时应用不启动**，避免运行时错误。

### 6.4 热更新（可选）

用 chokidar 监听 config/ 目录：

```
文件变化 → 重新加载对应配置 → 发送事件通知
```

这样改 Prompt 不用重启应用。MVP 阶段可以先不做。

---

## 七、与 Domain 层的关系

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Config Registry (Infrastructure)                              │
│   ────────────────────────────────                              │
│   • 加载 YAML                                                   │
│   • 验证格式                                                    │
│   • 提供配置数据                                                 │
│                                                                 │
│                          │                                      │
│                          │ 提供数据                              │
│                          ▼                                      │
│                                                                 │
│   Domain Engines                                                │
│   ──────────────                                                │
│   • StateMachine: 接收定义，执行转换逻辑                          │
│   • PromptRenderer: 接收模板，执行变量替换                        │
│                                                                 │
│   这些引擎是纯函数，不关心配置从哪来                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**关键点**：Domain 引擎不知道 YAML 的存在，它只接收数据结构。

---

## 八、Checklist

| 检查项 | 说明 |
|--------|------|
| 每个配置有 `id` + `version` | 方便追踪和回滚 |
| 状态机所有状态都被 transitions 覆盖 | 避免死状态 |
| Prompt variables 和 template 占位符一致 | 避免渲染错误 |
| 启动时验证所有配置 | 尽早发现问题 |
| 配置变更有 Git 记录 | 可追溯 |
