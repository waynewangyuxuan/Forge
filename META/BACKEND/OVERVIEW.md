# Forge Architecture Overview

> **设计原则**：Business Logic 与 Infrastructure 分离，配置驱动，数据外部化

---

## 〇、文档范围

本文档描述 Forge 的**后端架构** (Electron Main Process)。

Forge 是一个 Electron 应用，前后端在同一个 Repo：

```
forge/
├── src/
│   ├── main/          ← 后端 (本文档重点)
│   ├── renderer/      ← 前端 (React，另行设计)
│   ├── shared/        ← 共享类型
│   └── preload/       ← Electron preload
└── config/            ← 配置文件
```

**本文档 Focus**：`src/main/` 下的架构设计

---

## 一、核心功能

Forge 的核心功能可以抽象为五个模块：

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Forge Core Functions                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Project Lifecycle Management                                    │
│     • 创建 / 删除 / 归档项目                                          │
│     • 版本管理（基于 Git branch）                                     │
│                                                                     │
│  2. Spec → Scaffold 转换                                            │
│     • 输入: PRODUCT.md + TECHNICAL.md                               │
│     • 输出: TODO.md, CLAUDE.md, REGULATION.md                       │
│                                                                     │
│  3. Code Generation                                                 │
│     • 输入: META/ 目录                                               │
│     • 过程: 按 TODO.md 逐任务执行，调用 Claude                        │
│     • 输出: 完整项目代码                                              │
│                                                                     │
│  4. Runtime Management                                              │
│     • 触发执行 (manual / scheduled / always-on)                     │
│     • 健康检查                                                       │
│                                                                     │
│  5. Observability                                                   │
│     • 日志收集                                                       │
│     • 指标提取 (日志 → Dashboard)                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 二、分层架构 (后端)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                      IPC Layer (边界)                               │
│                      ───────────────                                │
│                      暴露给前端的接口                                 │
│                                                                     │
│                      • project.ipc.ts                               │
│                      • execution.ipc.ts                             │
│                      • runtime.ipc.ts                               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                      Application Layer                              │
│                      ─────────────────                              │
│                      Use Cases / Commands / Queries                 │
│                                                                     │
│                      • CreateProject                                │
│                      • GenerateScaffold                             │
│                      • StartExecution                               │
│                      • ConfigureRuntime                             │
│                      • TriggerRun                                   │
│                                                                     │
│                      职责:                                           │
│                      • 编排 Domain 逻辑 + Infrastructure 适配器      │
│                      • 处理事务边界                                   │
│                      • 发布领域事件                                   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                      Domain Layer                                   │
│                      ────────────                                   │
│                      Pure Business Logic                            │
│                                                                     │
│                      • StateMachine Engine                          │
│                      • PromptRenderer                               │
│                      • TodoParser                                   │
│                      • PlanCalculator                               │
│                      • LogParser                                    │
│                                                                     │
│                      原则:                                           │
│                      • 纯函数 / 纯类，无副作用                         │
│                      • 零外部依赖 (no fs, no child_process)          │
│                      • 输入输出都是数据                               │
│                      • 100% 可单元测试                               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                      Infrastructure Layer                           │
│                      ────────────────────                           │
│                      Adapters (让代码能跑起来)                        │
│                                                                     │
│                      • ClaudeCliAdapter     - Claude 进程管理       │
│                      • FileSystemAdapter    - 文件读写              │
│                      • SQLiteRepository     - 数据持久化            │
│                      • SchedulerAdapter     - 定时任务              │
│                      • KeychainAdapter      - 密钥存储              │
│                      • ConfigLoader         - 加载 YAML 配置        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 依赖方向

```
    IPC (边界)
        │
        │ 调用
        ▼
    Application  ───────►  Domain
        │                     ▲
        │ 使用                │ 不依赖任何层
        ▼                     │
    Infrastructure ───────────┘
        (实现接口)
```

- **Domain 不依赖任何层** - 核心业务逻辑完全独立
- **Application 依赖 Domain** - 编排业务逻辑
- **Application 依赖 Infrastructure 接口** - 通过接口使用适配器
- **Infrastructure 实现接口** - 具体技术实现
- **IPC 是边界** - 前端只能通过 IPC 调用后端

---

## 三、数据分类

系统中有三类数据，采用不同的存储策略：

| 类型 | 存储位置 | 特点 | 例子 |
|------|---------|------|------|
| **Config** | `config/*.yaml` | 静态、版本控制、影响系统行为 | 状态机、Prompts、执行配置 |
| **State** | SQLite | 动态、运行时产生、需要查询 | 项目列表、版本状态、执行历史 |
| **Content** | File System | 用户内容、项目代码 | PRODUCT.md、生成的代码、日志 |

### 存储位置映射

> 完整结构详见 [FILE-STRUCTURE.md](../FILE-STRUCTURE.md)

```
{app}/config/              → Config (YAML 配置)
{app-data}/forge.db        → State (SQLite 数据库)
~/Projects/{project}/      → Content (用户项目)
```

---

## 四、后端目录结构

> 完整目录结构详见 [FILE-STRUCTURE.md](../FILE-STRUCTURE.md)，此处仅列出后端重点部分。

```
src/main/                           # 后端 (Electron Main Process)
│
├── domain/                         # Domain Layer - 纯业务逻辑
│   ├── models/                     # 数据模型 (Entities)
│   ├── engines/                    # 逻辑引擎 (纯函数)
│   └── events.ts                   # 领域事件定义
│
├── application/                    # Application Layer - Use Cases
│   ├── use-cases/                  # 具体用例
│   └── services/                   # 编排服务
│
├── infrastructure/                 # Infrastructure Layer - 适配器
│   ├── adapters/                   # 外部系统适配器
│   ├── repositories/               # 数据持久化
│   ├── config-loader/              # YAML 配置加载
│   └── ipc/                        # IPC handlers
│
└── index.ts                        # Main process 入口

src/shared/                         # 前后端共享
├── types/                          # 类型定义
├── interfaces/                     # 接口定义 (Repository, Adapter)
├── errors.ts                       # 错误类型
└── constants.ts                    # 常量
```

### 后端模块依赖关系

```
src/main/
    │
    ├── domain/           ← 零依赖，纯逻辑
    │       ▲
    │       │ 依赖
    │       │
    ├── application/      ← 依赖 domain + 接口
    │       ▲
    │       │ 依赖
    │       │
    └── infrastructure/   ← 实现接口，依赖具体技术
            │
            │ 暴露
            ▼
        IPC Handlers      → 前端调用
```

### Use Cases 完整清单

```
application/use-cases/
│
├── project/
│   ├── create-project.ts         # 创建项目
│   ├── list-projects.ts          # 获取项目列表
│   ├── get-project.ts            # 获取项目详情
│   ├── archive-project.ts        # 归档项目
│   └── delete-project.ts         # 删除项目
│
├── version/
│   ├── create-version.ts         # 创建新版本 (Iterate)
│   ├── list-versions.ts          # 获取项目的所有版本
│   ├── get-version.ts            # 获取版本详情
│   └── set-active-version.ts     # 设置活跃版本
│
├── spec/
│   ├── read-spec.ts              # 读取 Spec 文件
│   └── save-spec.ts              # 保存 Spec 文件
│
├── scaffold/
│   ├── generate-scaffold.ts      # 生成 Scaffold
│   └── regenerate-scaffold.ts    # 基于 feedback 重新生成
│
├── review/
│   ├── get-todo.ts               # 获取解析后的 TODO (结构化)
│   ├── read-todo-raw.ts          # 读取 TODO.md 原始文本
│   ├── save-todo-raw.ts          # 保存 TODO.md 原始文本
│   ├── add-feedback.ts           # 添加 feedback
│   ├── clear-feedback.ts         # 清除 feedback
│   └── approve-review.ts         # 批准进入 Ready
│
├── execution/
│   ├── start-execution.ts        # 开始执行
│   ├── pause-execution.ts        # 暂停执行
│   ├── resume-execution.ts       # 恢复执行
│   ├── abort-execution.ts        # 中止执行
│   ├── retry-task.ts             # 重试任务
│   ├── skip-task.ts              # 跳过任务
│   └── get-execution-status.ts   # 获取执行状态
│
├── runtime/
│   ├── configure-runtime.ts      # 配置运行方式
│   ├── get-runtime-config.ts     # 获取运行配置
│   ├── trigger-run.ts            # 触发运行
│   ├── stop-run.ts               # 停止运行
│   ├── get-runtime-status.ts     # 获取运行状态
│   ├── get-run-history.ts        # 获取运行历史
│   └── get-run-logs.ts           # 获取日志内容
│
├── dashboard/
│   ├── get-dashboard-config.ts   # 获取 Dashboard 配置
│   └── get-dashboard-metrics.ts  # 获取指标数据
│
├── credentials/
│   ├── list-credentials.ts       # 列出凭证
│   ├── add-credential.ts         # 添加凭证
│   ├── update-credential.ts      # 更新凭证
│   └── delete-credential.ts      # 删除凭证
│
└── system/
    ├── get-settings.ts           # 获取设置
    ├── update-settings.ts        # 更新设置
    ├── select-folder.ts          # 选择目录对话框
    ├── check-claude.ts           # 检查 Claude CLI
    └── get-app-info.ts           # 获取应用信息
```

---

## 五、核心数据流

### 5.1 开发流 (Development Flow)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Development Flow                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   [用户]                                                             │
│     │                                                               │
│     │ 编写 PRODUCT.md + TECHNICAL.md                                │
│     ▼                                                               │
│   ┌─────────┐    GENERATE_SCAFFOLD    ┌─────────────┐              │
│   │ Drafting │ ─────────────────────► │ Scaffolding │              │
│   └─────────┘                         └──────┬──────┘              │
│        ▲                                     │                      │
│        │ EDIT_SPEC                           │ SUCCESS              │
│        │                                     ▼                      │
│   ┌─────────┐      REGENERATE         ┌───────────┐                │
│   │  Error  │ ◄─────────────────────  │ Reviewing │                │
│   └─────────┘                         └─────┬─────┘                │
│        │                                    │                       │
│        │ RETRY                              │ APPROVE               │
│        ▼                                    ▼                       │
│   ┌───────────┐    START            ┌─────────┐                    │
│   │ Executing │ ◄────────────────── │  Ready  │                    │
│   └─────┬─────┘                     └─────────┘                    │
│         │                                                           │
│         │ ALL_COMPLETE                                              │
│         ▼                                                           │
│   ┌───────────┐     ITERATE         ┌─────────┐                    │
│   │ Completed │ ──────────────────► │ Drafting │ (新版本)           │
│   └───────────┘                     └─────────┘                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 运行流 (Runtime Flow)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Runtime Flow                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   开发完成                                                           │
│     │                                                               │
│     │ 配置运行方式                                                   │
│     ▼                                                               │
│   ┌──────────────────┐                                              │
│   │  Runtime Config  │                                              │
│   │                  │                                              │
│   │  • Manual        │───► 用户手动触发                              │
│   │  • Scheduled     │───► Cron 定时触发                            │
│   │  • Always-on     │───► 启动后持续运行                            │
│   │                  │                                              │
│   └────────┬─────────┘                                              │
│            │                                                        │
│            │ Trigger                                                │
│            ▼                                                        │
│   ┌──────────────────┐         ┌──────────────────┐                │
│   │   Execute        │────────►│    Collect       │                │
│   │   run.sh         │         │    Logs          │                │
│   └──────────────────┘         └────────┬─────────┘                │
│                                         │                           │
│                                         │ Parse                     │
│                                         ▼                           │
│                                ┌──────────────────┐                 │
│                                │    Dashboard     │                 │
│                                │    (Metrics)     │                 │
│                                └──────────────────┘                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 后端数据流总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Backend Data Flow                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Config (YAML)              State (SQLite)         Content (FS)   │
│   ─────────────              ─────────────          ────────────   │
│   • state-machines/          • projects             • PRODUCT.md   │
│   • prompts/                 • versions             • TECHNICAL.md │
│   • execution.yaml           • executions           • TODO.md      │
│                              • runs                 • src/         │
│         │                         │                 • logs/        │
│         │                         │                      │         │
│         ▼                         ▼                      ▼         │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                      Config Registry                         │  │
│   │                  (infrastructure/config-loader)              │  │
│   │                                                             │  │
│   │   • loadStateMachine(id) → StateMachineDefinition           │  │
│   │   • loadPrompt(id) → PromptDefinition                       │  │
│   │   • getExecutionConfig() → ExecutionConfig                  │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                      Domain Engines                          │  │
│   │                      (domain/engines)                        │  │
│   │                                                             │  │
│   │   StateMachine.transition(state, event) → newState          │  │
│   │   PromptRenderer.render(promptId, vars) → string            │  │
│   │   TodoParser.parse(content) → ExecutionPlan                 │  │
│   │   PlanCalculator.getNextTask(plan) → Task                   │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                      Use Cases                               │  │
│   │                  (application/use-cases)                     │  │
│   │                                                             │  │
│   │   编排: Domain Engines + Infrastructure Adapters             │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                  Infrastructure Adapters                     │  │
│   │               (infrastructure/adapters + repos)              │  │
│   │                                                             │  │
│   │   ClaudeAdapter    FSAdapter    Repository    Scheduler     │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                      IPC Handlers                            │  │
│   │                   (infrastructure/ipc)                       │  │
│   │                                                             │  │
│   │   暴露给前端的接口，类型定义在 shared/types/ipc.types.ts       │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 六、后端技术选型

| 模块 | 技术 | 理由 |
|------|------|------|
| **运行时** | Electron Main Process (Node.js) | 访问文件系统、进程管理 |
| **语言** | TypeScript | 类型安全 |
| **配置格式** | YAML | 人类可读、AI 友好 |
| **配置验证** | Zod | Runtime 类型验证 |
| **数据库** | better-sqlite3 (或 sql.js) | 同步 API、嵌入式、无服务 |
| **AI 执行** | Claude Code CLI | 利用订阅额度、无需 API key |
| **定时任务** | node-cron | 简单可靠 |
| **密钥存储** | keytar | 系统级安全存储 (Keychain/Credential Manager) |
| **文件监听** | chokidar | 跨平台、稳定 |
| **YAML 解析** | yaml (npm) | 标准实现 |

---

## 七、设计决策

### 7.1 为什么 Business Logic 与 Infrastructure 分离？

| 好处 | 说明 |
|------|------|
| **可测试** | Domain 层可以纯单元测试，无需 mock Electron |
| **可复用** | 换成 CLI 或 Web 版，Domain 代码不用改 |
| **可维护** | 职责清晰，改动影响范围可控 |
| **可追踪** | 所有状态变化都是数据，方便 debug |

### 7.2 为什么配置驱动 (Data-Driven)？

| 好处 | 说明 |
|------|------|
| **热更新** | 改配置不需要重新编译 |
| **版本对比** | YAML diff 比代码 diff 更清晰 |
| **A/B 测试** | 可以轻松测试不同 Prompt 版本 |
| **一致性** | Prompts、状态机、配置用统一方式管理 |

### 7.3 为什么三类数据分开存？

| 数据类型 | 存储 | 理由 |
|---------|------|------|
| Config | YAML 文件 | 随代码版本控制，方便 review |
| State | SQLite | 需要查询、事务、持久化 |
| Content | 文件系统 | 用户可直接访问、编辑、Git 管理 |

---

## 八、相关文档

| 文档 | 内容 | 读者 |
|------|------|------|
| [DATA-MODEL.md](./DATA-MODEL.md) | 数据模型 + SQLite Schema | 实现 Repository |
| [CONFIG-DRIVEN.md](./CONFIG-DRIVEN.md) | 配置驱动设计 + YAML 格式 | 写配置、改 Prompt |
| [DOMAIN.md](./DOMAIN.md) | Domain 层详细设计 | 实现业务逻辑 |
| [INTERFACES.md](./INTERFACES.md) | 适配器接口定义 | 实现 Infrastructure |
