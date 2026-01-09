# File Structure

> **Single Source of Truth** — 所有文档中涉及文件结构的描述都应该引用本文档

---

## 一、Forge 应用代码结构

```
forge/
│
├── config/                           # 配置文件 (YAML) - 外部化数据
│   ├── state-machines/
│   │   ├── dev-flow.yaml             # 开发流状态机
│   │   └── runtime-flow.yaml         # 运行流状态机
│   ├── prompts/
│   │   ├── scaffold-generator.yaml   # Spec → TODO.md
│   │   ├── code-executor.yaml        # 单任务执行
│   │   └── dashboard-generator.yaml  # 生成 Dashboard
│   └── execution.yaml                # 全局执行配置
│
├── src/
│   │
│   ├── main/                         # 后端 (Electron Main Process)
│   │   │
│   │   ├── domain/                   # Domain Layer - 纯业务逻辑
│   │   │   ├── models/               # 数据模型 (Entities)
│   │   │   │   ├── project.ts
│   │   │   │   ├── version.ts
│   │   │   │   ├── execution-plan.ts
│   │   │   │   └── task.ts
│   │   │   │
│   │   │   ├── engines/              # 逻辑引擎 (纯函数)
│   │   │   │   ├── state-machine.ts
│   │   │   │   ├── prompt-renderer.ts
│   │   │   │   ├── todo-parser.ts
│   │   │   │   ├── log-parser.ts
│   │   │   │   └── plan-calculator.ts
│   │   │   │
│   │   │   └── events.ts             # 领域事件定义
│   │   │
│   │   ├── application/              # Application Layer - Use Cases
│   │   │   ├── use-cases/            # 按 domain 组织的用例
│   │   │   │   ├── project/
│   │   │   │   │   ├── create-project.ts
│   │   │   │   │   ├── list-projects.ts
│   │   │   │   │   ├── get-project.ts
│   │   │   │   │   ├── archive-project.ts
│   │   │   │   │   └── delete-project.ts
│   │   │   │   ├── version/
│   │   │   │   │   ├── create-version.ts
│   │   │   │   │   ├── list-versions.ts
│   │   │   │   │   ├── get-version.ts
│   │   │   │   │   └── set-active-version.ts
│   │   │   │   ├── spec/
│   │   │   │   │   ├── read-spec.ts
│   │   │   │   │   └── save-spec.ts
│   │   │   │   ├── scaffold/
│   │   │   │   │   ├── generate-scaffold.ts
│   │   │   │   │   └── regenerate-scaffold.ts
│   │   │   │   ├── review/
│   │   │   │   │   ├── get-todo.ts
│   │   │   │   │   ├── read-todo-raw.ts
│   │   │   │   │   ├── save-todo-raw.ts
│   │   │   │   │   ├── add-feedback.ts
│   │   │   │   │   ├── clear-feedback.ts
│   │   │   │   │   └── approve-review.ts
│   │   │   │   ├── execution/
│   │   │   │   │   ├── start-execution.ts
│   │   │   │   │   ├── pause-execution.ts
│   │   │   │   │   ├── resume-execution.ts
│   │   │   │   │   ├── abort-execution.ts
│   │   │   │   │   ├── retry-task.ts
│   │   │   │   │   ├── skip-task.ts
│   │   │   │   │   └── get-execution-status.ts
│   │   │   │   ├── runtime/
│   │   │   │   │   ├── configure-runtime.ts
│   │   │   │   │   ├── get-runtime-config.ts
│   │   │   │   │   ├── trigger-run.ts
│   │   │   │   │   ├── stop-run.ts
│   │   │   │   │   ├── get-runtime-status.ts
│   │   │   │   │   ├── get-run-history.ts
│   │   │   │   │   └── get-run-logs.ts
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── get-dashboard-config.ts
│   │   │   │   │   └── get-dashboard-metrics.ts
│   │   │   │   ├── credentials/
│   │   │   │   │   ├── list-credentials.ts
│   │   │   │   │   ├── add-credential.ts
│   │   │   │   │   ├── update-credential.ts
│   │   │   │   │   └── delete-credential.ts
│   │   │   │   └── system/
│   │   │   │       ├── get-settings.ts
│   │   │   │       ├── update-settings.ts
│   │   │   │       ├── select-folder.ts
│   │   │   │       ├── check-claude.ts
│   │   │   │       └── get-app-info.ts
│   │   │   │
│   │   │   └── services/
│   │   │       ├── execution-orchestrator.ts
│   │   │       └── runtime-manager.ts
│   │   │
│   │   ├── infrastructure/           # Infrastructure Layer - 适配器
│   │   │   ├── adapters/
│   │   │   │   ├── claude-cli.adapter.ts
│   │   │   │   ├── file-system.adapter.ts
│   │   │   │   ├── scheduler.adapter.ts
│   │   │   │   └── keychain.adapter.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   ├── sqlite-project.repo.ts
│   │   │   │   ├── sqlite-version.repo.ts
│   │   │   │   ├── sqlite-execution.repo.ts
│   │   │   │   └── sqlite-run.repo.ts
│   │   │   │
│   │   │   ├── config-loader/
│   │   │   │   └── yaml-config-loader.ts
│   │   │   │
│   │   │   └── ipc/                  # IPC handlers
│   │   │       ├── index.ts          # 注册所有 handlers
│   │   │       ├── project.ipc.ts
│   │   │       ├── version.ipc.ts
│   │   │       ├── spec.ipc.ts
│   │   │       ├── review.ipc.ts
│   │   │       ├── execution.ipc.ts
│   │   │       ├── runtime.ipc.ts
│   │   │       ├── dashboard.ipc.ts
│   │   │       ├── credentials.ipc.ts
│   │   │       ├── shell.ipc.ts
│   │   │       └── system.ipc.ts
│   │   │
│   │   └── index.ts                  # Main process 入口
│   │
│   ├── renderer/                     # 前端 (React)
│   │   │
│   │   ├── stores/                   # 状态管理 (Zustand)
│   │   │   ├── server.store.ts       # 服务端数据
│   │   │   ├── realtime.store.ts     # 实时推送
│   │   │   └── ui.store.ts           # UI 状态
│   │   │
│   │   ├── pages/                    # 页面组件
│   │   │   ├── ProjectListPage/
│   │   │   ├── ProjectLayout/        # 包含 Sidebar 的布局
│   │   │   ├── OverviewPage/
│   │   │   ├── SpecPage/
│   │   │   ├── ReviewPage/
│   │   │   ├── ExecutePage/
│   │   │   ├── RuntimePage/
│   │   │   ├── DashboardPage/
│   │   │   └── SettingsPage/
│   │   │
│   │   ├── components/               # 通用组件
│   │   │   ├── primitives/           # 基础组件
│   │   │   │   ├── Button/
│   │   │   │   ├── Input/
│   │   │   │   ├── Card/
│   │   │   │   ├── Badge/
│   │   │   │   ├── Modal/
│   │   │   │   ├── ProgressBar/
│   │   │   │   ├── Spinner/
│   │   │   │   ├── Tabs/
│   │   │   │   └── StatusDot/
│   │   │   │
│   │   │   ├── composites/           # 组合组件
│   │   │   │   ├── ProjectCard/
│   │   │   │   ├── TaskItem/
│   │   │   │   ├── TaskList/
│   │   │   │   ├── StatCard/
│   │   │   │   └── LogViewer/
│   │   │   │
│   │   │   └── editors/              # 编辑器组件
│   │   │       ├── MarkdownEditor/
│   │   │       ├── MarkdownPreview/
│   │   │       └── FeedbackPanel/
│   │   │
│   │   ├── hooks/                    # 自定义 Hooks
│   │   │   ├── useProject.ts
│   │   │   ├── useExecution.ts
│   │   │   ├── useNavigation.ts
│   │   │   └── useUnsavedChanges.ts
│   │   │
│   │   ├── router.tsx                # 路由配置
│   │   ├── App.tsx                   # 根组件
│   │   └── index.tsx                 # 入口
│   │
│   ├── shared/                       # 前后端共享
│   │   │
│   │   ├── types/                    # 类型定义
│   │   │   ├── project.types.ts      # Project, Version 等实体类型
│   │   │   ├── execution.types.ts    # Execution, Task 等类型
│   │   │   ├── runtime.types.ts      # RuntimeConfig, Run 等类型
│   │   │   ├── credential.types.ts   # Credential 类型
│   │   │   └── ipc.types.ts          # IPC 通道输入输出类型
│   │   │
│   │   ├── interfaces/               # 接口定义 (后端用)
│   │   │   ├── repositories.ts       # IProjectRepository, IVersionRepository 等
│   │   │   ├── adapters.ts           # IClaudeAdapter, IFileSystemAdapter 等
│   │   │   └── index.ts
│   │   │
│   │   ├── errors.ts                 # 错误类型定义
│   │   └── constants.ts              # 常量
│   │
│   └── preload/                      # Electron Preload
│       └── index.ts                  # 暴露 window.api
│
├── tests/
│   └── main/                         # 后端测试
│       ├── domain/                   # Domain 单元测试
│       ├── application/              # Use Case 测试
│       └── integration/              # 集成测试
│
├── package.json
├── tsconfig.json
├── electron-builder.json
└── README.md
```

---

## 二、数据存储位置

| 数据类型 | 存储位置 | 说明 |
|---------|---------|------|
| **Config** | `{app}/config/` | 随代码分发，版本控制 |
| **State** | `{app-data}/forge.db` | SQLite 数据库 |
| **Credentials** | System Keychain | 系统级安全存储 |
| **Content** | 用户项目目录 | 用户指定位置 |

### App Data 目录

| 平台 | 路径 |
|------|------|
| macOS | `~/Library/Application Support/Forge/` |
| Windows | `%APPDATA%/Forge/` |
| Linux | `~/.config/Forge/` |

---

## 三、用户项目目录结构 (约定)

每个 Forge 管理的项目遵循此结构：

```
~/Projects/{project-name}/
│
├── META/                             # 开发元数据
│   │
│   ├── CORE/                         # 核心 Spec (用户编写)
│   │   ├── PRODUCT.md                # What - 产品定义
│   │   ├── TECHNICAL.md              # How - 技术实现
│   │   └── REGULATION.md             # Rules - 开发规范
│   │
│   ├── CLAUDE.md                     # AI 执行入口 (AI 生成)
│   ├── TODO.md                       # 任务清单 (AI 生成)
│   ├── PROGRESS.md                   # 进度摘要 (AI 更新)
│   └── DASHBOARD.yaml                # Dashboard 配置 (AI 生成)
│
├── src/                              # 项目代码 (AI 生成)
│
├── logs/                             # 运行日志
│   └── {timestamp}.log
│
├── run.sh                            # 运行入口 (约定)
├── health.sh                         # 健康检查 (always_running 模式)
├── .env.local                        # 环境变量 (不进 Git)
│
├── .gitignore
└── .git/
```

### 文件职责

| 文件 | 创建者 | 更新者 | 职责 |
|------|--------|--------|------|
| `PRODUCT.md` | 用户 | 用户 | 定义做什么 |
| `TECHNICAL.md` | 用户 | 用户 | 定义怎么做 |
| `REGULATION.md` | 用户/AI | 用户/AI | 开发规范 |
| `CLAUDE.md` | AI | AI | Claude 执行入口指令 |
| `TODO.md` | AI | AI | 任务分解和状态 |
| `PROGRESS.md` | AI | AI | 已完成工作摘要 |
| `DASHBOARD.yaml` | AI | AI | Dashboard 指标配置 |
| `run.sh` | AI | 用户/AI | 项目运行脚本 |
| `health.sh` | AI | 用户/AI | 健康检查脚本 |

---

## 四、引用说明

其他文档中涉及文件结构时，应使用如下引用方式：

```markdown
> 详见 [FILE-STRUCTURE.md](FILE-STRUCTURE.md)
```

避免在各文档中重复定义完整结构，防止不一致。
