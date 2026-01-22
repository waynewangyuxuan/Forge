# Domain Layer

> **核心思想**：纯业务逻辑，零外部依赖，100% 可测试

---

## 一、什么是 Domain Layer？

### 1.1 定义

Domain Layer 是**纯业务逻辑**，回答"业务规则是什么"：

- 状态 A 在事件 X 下应该转换到状态 B
- Prompt 模板 + 变量 = 最终 Prompt 字符串
- TODO.md 内容 → 结构化的任务列表
- 给定执行计划，下一个该执行的任务是哪个

### 1.2 不是什么

Domain Layer **不关心**：

| 不关心 | 那是谁的事？ |
|--------|------------|
| 配置从哪读（YAML？数据库？） | Infrastructure |
| 数据存哪（SQLite？文件？） | Infrastructure |
| 怎么调用 Claude | Infrastructure |
| 怎么和前端通信 | IPC Layer |

### 1.3 为什么要分离？

| 收益 | 说明 |
|------|------|
| **可测试** | 纯函数，输入输出确定，不需要 mock 任何东西 |
| **可复用** | 换成 CLI 版、Web 版，Domain 代码一行不改 |
| **可理解** | 业务逻辑集中，不和技术细节混在一起 |
| **可维护** | 改业务规则不担心影响数据库，改数据库不担心影响业务 |

---

## 二、Domain 的组成

```
src/main/domain/
│
├── models/          # 数据模型（实体）
├── engines/         # 逻辑引擎（纯函数）
└── schemas/         # 验证规则（Zod）
```

### 2.1 Models vs Engines

| 概念 | 职责 | 例子 |
|------|------|------|
| **Model** | 定义数据长什么样 | Project、Version、Task |
| **Engine** | 定义如何处理数据 | StateMachine、TodoParser |

Model 是名词，Engine 是动词。

---

## 三、核心 Engines

### 3.1 StateMachine Engine

**职责**：管理状态转换

**输入**：
- 状态机定义（从配置来）
- 当前状态
- 触发事件

**输出**：
- 下一个状态
- 或者 null（非法转换）

**核心方法**：

| 方法 | 作用 |
|------|------|
| `transition(current, event)` | 执行转换，返回新状态 |
| `canTransition(current, event)` | 检查转换是否合法 |
| `getAvailableEvents(current)` | 获取当前状态可用的事件 |

**示例**：

```
transition('drafting', 'GENERATE_SCAFFOLD') → 'scaffolding'
transition('drafting', 'START') → null (非法)

canTransition('executing', 'PAUSE') → true
canTransition('completed', 'PAUSE') → false

getAvailableEvents('reviewing') → ['REGENERATE', 'APPROVE', 'EDIT_SPEC']
```

**实现要点**：
- 构造时建立 `(from, event) → to` 的查找表
- 所有方法都是 O(1) 查找
- 不存储任何状态，每次调用都是独立的

### 3.2 PromptRenderer Engine

**职责**：模板 + 变量 → 最终 Prompt

**输入**：
- Prompt 定义（模板 + 变量声明）
- 变量值

**输出**：
- 渲染后的 Prompt 字符串

**核心逻辑**：

1. 检查必填变量是否提供
2. 用默认值填充可选变量
3. 替换 `{{variable}}` 占位符
4. 处理条件块 `{{#if variable}}...{{/if}}`

**示例**：

```
模板: "Hello {{name}}, you are {{age}} years old."
变量: { name: "Wayne", age: "25" }
输出: "Hello Wayne, you are 25 years old."
```

**实现要点**：
- 简单场景用正则替换
- 复杂场景（条件、循环）可以用 Handlebars
- 变量缺失时抛出明确错误

### 3.3 ScaffoldValidator Engine

**职责**：验证 AI 生成的 Scaffold JSON

**输入**：
- ScaffoldOutput JSON

**输出**：
- ScaffoldValidationResult { valid, errors }

**验证规则**：

| 规则 | 说明 |
|------|------|
| 结构验证 | 必填字段存在 |
| 任务 ID 唯一性 | 没有重复的任务 ID |
| 依赖有效性 | depends 引用的任务存在 |
| 循环依赖检测 | 没有 A→B→C→A 的依赖链 |

**核心方法**：

| 方法 | 作用 |
|------|------|
| `validateScaffold(scaffold)` | 完整验证 |
| `parseScaffoldJson(input)` | 从字符串解析 JSON |

### 3.4 ScaffoldWriter Engine

**职责**：将 ScaffoldOutput JSON 转换为文件内容

**输入**：
- ScaffoldOutput
- 选项（项目名等）

**输出**：
- 文件数组 `{ path, content }[]`

**生成文件**：

| 文件 | 内容 |
|------|------|
| META/TODO.md | 任务索引，轻量级 |
| META/MILESTONES/M1-*.md | 每个 Milestone 的详细任务 |
| META/CONTEXT/architecture.md | 架构决策 |
| META/CONTEXT/conventions.md | 代码规范 |

**核心方法**：

| 方法 | 作用 |
|------|------|
| `generateScaffoldFiles(scaffold, options)` | 生成所有文件 |
| `generateClaudeMd(template, scaffold, projectName)` | 生成 CLAUDE.md |

### 3.5 TodoParser Engine (M5+)

**职责**：解析 TODO.md + MILESTONES/*.md → 结构化执行计划

**输入**：
- TODO.md 内容（轻量索引）
- MILESTONES/*.md 内容数组（详细任务信息）

**两层文件结构**：

Forge 的 scaffold 采用两层结构：
- `META/TODO.md`：轻量索引，只包含任务 ID、标题和完成状态
- `META/MILESTONES/M{N}-*.md`：每个 milestone 的详细任务描述

**TODO.md 格式**：

```markdown
# TODO

> Project: my-project
> Generated: 2024-01-01T00:00:00.000Z

## M1: Setup                        → milestone.id = "M1", milestone.name = "Setup"
- [ ] 001. Initialize project       → task.id = "001", task.status = "pending"
- [x] 002. Add dependencies         → task.id = "002", task.status = "completed"

## M2: Features
- [ ] 003. Implement feature
```

**MILESTONES/M1-setup.md 格式**：

```markdown
# M1: Setup

> Milestone description             → milestone.description

## Tasks

### 001. Task Title                 → 匹配 task.id

**Description:**                    → task.description
Detailed description text

**Verification:**                   → task.verification
How to verify completion

**Depends:** 001, 002               → task.depends = ["001", "002"]

---
```

**核心方法**：

| 方法 | 作用 |
|------|------|
| `parseTodoIndex(content)` | 解析 TODO.md，返回任务 ID 列表和完成状态 |
| `parseMilestoneDetail(content)` | 解析 MILESTONES/*.md，返回任务详情 |
| `buildExecutionPlan(index, details)` | 组合成完整 ExecutionPlan |
| `parseExecutionPlan(todo, milestones)` | 便捷方法，组合以上步骤 |

**输出结构**：

```
ExecutionPlan {
  milestones: [
    Milestone {
      id: "M1"
      name: "Setup"
      description: "Milestone description"
      tasks: [
        Task { id: "001", title: "Initialize project", status: "pending", depends: [] },
        Task { id: "002", title: "Add dependencies", status: "completed", depends: ["001"] }
      ]
    }
  ]
  totalTasks: 2
  completedTasks: 1
}
```

**实现要点**：
- TODO.md 按行解析：`## M{N}: Name` 识别 milestone，`- [ ] {id}. Title` 识别 task
- MILESTONES/*.md 解析：`### {id}. Title` 识别 task section，提取 Description/Verification/Depends
- `- [ ]` = pending，`- [x]` = completed
- 容错：缺少详情的 task 仍然可以显示（只是没有 description/verification）

### 3.4 PlanCalculator Engine

**职责**：计算执行计划的状态

**输入**：
- ExecutionPlan

**输出**：
- 下一个可执行的任务
- 整体进度
- 是否全部完成

**核心方法**：

| 方法 | 作用 |
|------|------|
| `getNextTask(plan)` | 找到下一个可执行任务 |
| `getProgress(plan)` | 计算完成进度 |
| `isAllCompleted(plan)` | 检查是否全部完成 |
| `getBlockedTasks(plan)` | 找出被阻塞的任务 |

**getNextTask 逻辑**：

```
遍历所有 Milestone:
  遍历所有 Task:
    如果 status != 'pending': 跳过
    如果 所有 depends 都是 'completed':
      返回这个 Task
返回 null (没有可执行任务)
```

**示例**：

```
Tasks:
  001 (pending, depends: none)     ← 返回这个
  002 (pending, depends: 001)
  003 (completed, depends: none)

getNextTask() → Task 001
```

### 3.5 LogParser Engine

**职责**：日志内容 → 指标数据

**输入**：
- 日志文本
- Dashboard 配置（提取规则）

**输出**：
- 提取的指标值

**配置示例**：

```yaml
metrics:
  - name: cards_generated
    extract: 'Generated (\d+) cards'    # 正则，捕获组
    type: counter
```

**日志**：

```
09:00:15 Generated 42 cards
09:00:16 Completed successfully
```

**输出**：

```
{ cards_generated: 42 }
```

**实现要点**：
- 逐行匹配正则
- 支持累加（counter）和最新值（gauge）
- 容错：匹配失败不崩溃

---

## 四、核心 Models

### 4.1 Project

```
Project {
  id: string
  name: string
  path: string          # 本地目录路径
  createdAt: Date
  archivedAt: Date?
}
```

### 4.2 Version

```
Version {
  id: string
  projectId: string
  versionName: string   # "v1.0"
  branchName: string    # Git branch
  devStatus: string     # 状态机状态
  runtimeStatus: string
  createdAt: Date
}
```

### 4.3 ExecutionPlan

```
ExecutionPlan {
  milestones: Milestone[]
}

Milestone {
  name: string
  description: string?
  tasks: Task[]
}

Task {
  id: string            # "001"
  description: string
  verification: string
  depends: string[]     # ["001", "002"]
  status: 'pending' | 'completed' | 'failed' | 'skipped'
}
```

### 4.4 RuntimeConfig

```
RuntimeConfig {
  versionId: string
  triggerType: 'manual' | 'schedule' | 'always_running'
  cronExpression?: string       # triggerType='schedule' 时必填
  credentials: Record<string, CredentialRef>
}

CredentialRef =
  | { type: 'global'; nickname: string }   # 引用全局凭证
  | { type: 'project'; value: string }     # 项目级直接值
```

---

## 五、Domain 的边界

### 5.1 Domain 做什么

| ✅ Domain 做 | 例子 |
|-------------|------|
| 状态转换计算 | `transition('drafting', 'START')` |
| 数据结构转换 | `parseMarkdown(content) → Plan` |
| 业务规则验证 | "任务依赖必须存在" |
| 纯计算逻辑 | `getProgress(plan) → 45%` |

### 5.2 Domain 不做什么

| ❌ Domain 不做 | 谁做 |
|---------------|------|
| 读写文件 | FileSystemAdapter |
| 数据库操作 | Repository |
| 调用 Claude | ClaudeAdapter |
| 发送事件 | EventBus（Application 层） |
| 定时调度 | SchedulerAdapter |

### 5.3 依赖方向

```
Application Layer
      │
      │ 调用
      ▼
Domain Layer  ←── 零外部依赖
      ▲
      │
      │ 不知道 Domain 的存在
      │
Infrastructure Layer
```

Application 调用 Domain，Domain 不调用任何人。

---

## 六、测试策略

### 6.1 为什么好测试

Domain 是纯函数，测试只需要：

1. 构造输入数据
2. 调用方法
3. 断言输出

不需要：
- Mock 文件系统
- Mock 数据库
- Mock 网络
- 启动 Electron

### 6.2 测试示例

**StateMachine**：
```
输入: definition, current='drafting', event='GENERATE_SCAFFOLD'
期望: 'scaffolding'

输入: definition, current='completed', event='START'
期望: null (非法转换)
```

**TodoParser**：
```
输入: "## Milestone 1\n- [ ] 001. Task one\n  - Depends: none"
期望: { milestones: [{ name: "Milestone 1", tasks: [...] }] }
```

**PlanCalculator**：
```
输入: plan with tasks 001(done), 002(pending, depends 001)
期望: getNextTask() → task 002
```

### 6.3 边界情况

| Engine | 边界情况 |
|--------|---------|
| StateMachine | 未知事件、未知状态 |
| PromptRenderer | 缺少必填变量、变量值为空 |
| TodoParser | 格式不规范、空文件、只有 Milestone 没有 Task |
| PlanCalculator | 循环依赖、所有任务已完成、依赖不存在的任务 |

---

## 七、Checklist

| 检查项 | 说明 |
|--------|------|
| 无 import fs/path/child_process | 确保零 I/O 依赖 |
| 无 import electron | 确保不依赖运行环境 |
| 所有方法有明确输入输出 | 方便测试和理解 |
| 错误情况返回值而非抛异常 | 除非真的是异常情况 |
| 每个 Engine 有对应测试文件 | 覆盖正常和边界情况 |
