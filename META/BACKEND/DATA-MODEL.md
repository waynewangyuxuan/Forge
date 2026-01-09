# Data Model

> **核心思想**：三类数据分开存储 — Config 随代码、State 存数据库、Content 在文件系统

---

## 一、数据分类

### 1.1 三类数据

| 类型 | 存储 | 特点 | 例子 |
|------|------|------|------|
| **Config** | `config/*.yaml` | 静态、版本控制 | 状态机、Prompts |
| **State** | SQLite | 动态、需要查询 | 项目列表、执行状态 |
| **Content** | File System | 用户内容 | Spec、代码、日志 |

### 1.2 为什么分开？

| 如果混在一起 | 问题 |
|-------------|------|
| Config 存数据库 | 难以版本控制、Code Review |
| State 存文件 | 查询困难、并发问题 |
| Content 存数据库 | 用户无法直接编辑、Git 管理 |

### 1.3 存储位置

```
Forge App
│
├── config/                    # Config — 随代码分发
│   ├── state-machines/
│   └── prompts/
│
├── {app-data}/                # State — 系统 App 数据目录
│   └── forge.db               # macOS: ~/Library/Application Support/Forge/
│                              # Windows: %APPDATA%/Forge/
│                              # Linux: ~/.config/Forge/
│
└── ~/Projects/                # Content — 用户指定的项目目录
    └── {project}/
        ├── META/
        │   ├── PRODUCT.md
        │   └── TODO.md
        └── src/
```

---

## 二、State 数据模型

### 2.1 实体关系

```
┌─────────────┐
│   Project   │
│─────────────│
│ id          │
│ name        │
│ path        │
└──────┬──────┘
       │ 1:N
       ▼
┌─────────────┐       ┌─────────────────┐
│   Version   │       │  RuntimeConfig  │
│─────────────│       │─────────────────│
│ id          │◄──────│ version_id (1:1)│
│ project_id  │       │ trigger_type    │
│ version     │       │ cron            │
│ branch      │       └─────────────────┘
│ dev_status  │
│ runtime_status│
└──────┬──────┘
       │ 1:N
       ▼
┌─────────────┐
│  Execution  │
│─────────────│
│ id          │
│ version_id  │
│ status      │
│ progress    │
└──────┬──────┘
       │ 1:N
       ▼
┌─────────────┐
│ TaskAttempt │
│─────────────│
│ id          │
│ execution_id│
│ task_id     │
│ status      │
└─────────────┘


┌─────────────┐       ┌─────────────┐
│     Run     │       │ Credential  │
│─────────────│       │─────────────│
│ id          │       │ id          │
│ version_id  │       │ nickname    │
│ triggered_at│       │ type        │
│ status      │       │ (value 在   │
└─────────────┘       │  Keychain)  │
                      └─────────────┘
```

### 2.2 核心概念

| 概念 | 说明 |
|------|------|
| **Project** | 一个项目，绑定 GitHub 仓库 |
| **Version** | 项目的一个版本，对应一个 Git branch |
| **Execution** | 一次开发流执行（生成代码的过程） |
| **TaskAttempt** | 单个任务的一次尝试 |
| **Run** | 一次运行流执行（运行 run.sh） |
| **RuntimeConfig** | 版本的运行配置 |
| **Credential** | 全局凭证（API Key 等） |

### 2.3 状态字段

**DevStatus**（开发流状态）:
```
drafting → scaffolding → reviewing → ready → executing → completed
                                        ↓         ↓
                                      paused    error
```

**RuntimeStatus**（运行流状态）:
```
not_configured → idle → running → success/failed
```

---

## 三、SQLite Schema

### 3.1 projects

项目表。每个项目必须绑定 GitHub 仓库。

```sql
CREATE TABLE projects (
  id            TEXT PRIMARY KEY,      -- UUID
  name          TEXT NOT NULL,         -- 显示名称
  github_repo   TEXT NOT NULL,         -- GitHub 仓库名 (e.g., "kindle-anki")
  github_owner  TEXT NOT NULL,         -- GitHub 用户名 (e.g., "waynewang")
  path          TEXT NOT NULL UNIQUE,  -- 本地路径（由 clone location + repo name 派生）
  created_at    TEXT NOT NULL,         -- ISO 8601
  archived_at   TEXT                   -- 归档时间，NULL 表示未归档
);

CREATE INDEX idx_projects_archived ON projects(archived_at);
CREATE UNIQUE INDEX idx_projects_github ON projects(github_owner, github_repo);
```

**说明**：
- `github_owner + github_repo` 唯一，同一仓库不能创建多个项目
- `path` 由系统设置的 clone location + repo name 派生
- `archived_at` 软删除，不物理删除

### 3.2 versions

版本表。一个项目可以有多个版本。

```sql
CREATE TABLE versions (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id),
  version_name    TEXT NOT NULL,       -- e.g., "v1.0", "v2.0"
  branch_name     TEXT NOT NULL,       -- Git branch
  dev_status      TEXT NOT NULL,       -- 开发流状态
  runtime_status  TEXT NOT NULL,       -- 运行流状态
  created_at      TEXT NOT NULL,
  
  UNIQUE(project_id, version_name)
);

CREATE INDEX idx_versions_project ON versions(project_id);
```

**说明**：
- 同一项目下版本名唯一
- `dev_status` 和 `runtime_status` 存状态机的当前状态字符串

### 3.3 executions

执行记录。记录一次开发流执行。

```sql
CREATE TABLE executions (
  id              TEXT PRIMARY KEY,
  version_id      TEXT NOT NULL REFERENCES versions(id),
  started_at      TEXT NOT NULL,
  completed_at    TEXT,                -- NULL 表示进行中
  status          TEXT NOT NULL,       -- running | completed | failed | aborted
  total_tasks     INTEGER NOT NULL,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  current_task_id TEXT                 -- 当前执行的任务 ID
);

CREATE INDEX idx_executions_version ON executions(version_id);
```

**说明**：
- 一个 Version 可以有多次执行（失败后重试）
- `current_task_id` 对应 TODO.md 里的任务编号（如 "001"）

### 3.4 task_attempts

任务尝试记录。

```sql
CREATE TABLE task_attempts (
  id              TEXT PRIMARY KEY,
  execution_id    TEXT NOT NULL REFERENCES executions(id),
  task_id         TEXT NOT NULL,       -- TODO.md 中的任务 ID
  attempt_number  INTEGER NOT NULL,    -- 第几次尝试
  started_at      TEXT NOT NULL,
  completed_at    TEXT,
  status          TEXT NOT NULL,       -- running | completed | failed | skipped
  error_message   TEXT,                -- 失败时的错误信息
  
  UNIQUE(execution_id, task_id, attempt_number)
);

CREATE INDEX idx_task_attempts_execution ON task_attempts(execution_id);
```

**说明**：
- 同一任务可能尝试多次（重试）
- `error_message` 记录失败原因，方便排查

### 3.5 runtime_configs

运行配置。每个 Version 一份。

```sql
CREATE TABLE runtime_configs (
  version_id      TEXT PRIMARY KEY REFERENCES versions(id),
  trigger_type    TEXT NOT NULL,       -- manual | schedule | always_running
  cron_expression TEXT,                -- schedule 模式下的 cron
  credentials     TEXT,                -- JSON: {"ENV_NAME": {"type": "global", "nickname": "my-key"}}
  updated_at      TEXT NOT NULL
);
```

**说明**：
- 1:1 关系，用 `version_id` 做主键
- `credentials` 存 JSON，记录环境变量到凭证的映射

**Credentials 解析流程**：

Run 触发时，Forge 会：
1. 读取 `runtime_configs.credentials` 映射
2. 解析每个 CredentialRef：
   - `{ type: 'global', nickname }` → 从系统 Keychain 获取实际值
   - `{ type: 'project', value }` → 直接使用存储的值（允许明文存 SQLite）
3. 生成/覆盖项目目录下的 `.env.local` 文件
4. `run.sh` 通过 `source .env.local` 加载环境变量

### 3.6 runs

运行记录。记录一次运行流执行。

```sql
CREATE TABLE runs (
  id              TEXT PRIMARY KEY,
  version_id      TEXT NOT NULL REFERENCES versions(id),
  triggered_at    TEXT NOT NULL,
  triggered_by    TEXT NOT NULL,       -- manual | schedule | startup
  completed_at    TEXT,
  status          TEXT NOT NULL,       -- running | success | failed
  exit_code       INTEGER,
  log_path        TEXT                 -- 日志文件路径
);

CREATE INDEX idx_runs_version ON runs(version_id);
CREATE INDEX idx_runs_triggered ON runs(triggered_at);
```

**说明**：
- 每次运行 `run.sh` 记录一条
- `log_path` 指向项目目录下的日志文件

### 3.7 credentials

全局凭证表。实际密钥存系统 Keychain。

```sql
CREATE TABLE credentials (
  id          TEXT PRIMARY KEY,
  nickname    TEXT NOT NULL UNIQUE,    -- 用户友好的名称
  type        TEXT NOT NULL,           -- NOTION_API | GITHUB_TOKEN | ...
  created_at  TEXT NOT NULL
);
```

**说明**：
- 只存元数据，密钥值通过 keytar 存系统 Keychain
- `nickname` 在配置中引用：`{"type": "global", "nickname": "my-notion-key"}`

---

## 四、Content 结构

> 用户项目目录的完整结构详见 [FILE-STRUCTURE.md](../FILE-STRUCTURE.md) 第三节。

### 4.1 项目目录约定

每个 Forge 管理的项目遵循统一的 META/ 结构，包含用户编写的 Spec（CORE/）和 AI 生成的执行文件（TODO.md、CLAUDE.md 等）。

### 4.2 文件职责

| 文件 | 创建者 | 职责 |
|------|--------|------|
| `PRODUCT.md` | 用户 | 定义做什么 |
| `TECHNICAL.md` | 用户 | 定义怎么做 |
| `REGULATION.md` | 用户/AI | 开发规范 |
| `TODO.md` | AI | 任务分解 |
| `PROGRESS.md` | AI | 已完成工作摘要 |
| `CLAUDE.md` | AI | Claude 执行入口 |
| `DASHBOARD.yaml` | AI | Dashboard 配置 |
| `run.sh` | AI | 项目运行脚本 |

### 4.3 状态同步

State（SQLite）和 Content（文件）之间需要同步：

| 场景 | 同步方向 |
|------|---------|
| 任务完成 | TODO.md → SQLite（更新进度） |
| 用户手动改 TODO | 文件监听 → SQLite |
| 执行暂停/恢复 | SQLite → 读取 TODO.md 继续 |

---

## 五、查询场景

### 5.1 常见查询

| 场景 | 查询 |
|------|------|
| 项目列表 | `SELECT * FROM projects WHERE archived_at IS NULL` |
| 项目的所有版本 | `SELECT * FROM versions WHERE project_id = ?` |
| 活跃执行 | `SELECT * FROM executions WHERE status = 'running'` |
| 版本的运行历史 | `SELECT * FROM runs WHERE version_id = ? ORDER BY triggered_at DESC` |
| 定时任务列表 | `SELECT * FROM runtime_configs WHERE trigger_type = 'schedule'` |

### 5.2 统计查询

| 场景 | 查询 |
|------|------|
| 今日运行次数 | `SELECT COUNT(*) FROM runs WHERE date(triggered_at) = date('now')` |
| 版本成功率 | `SELECT status, COUNT(*) FROM runs WHERE version_id = ? GROUP BY status` |
| 平均执行时长 | 计算 `completed_at - started_at` |

---

## 六、数据生命周期

### 6.1 创建流程

```
创建项目
  │
  ├── INSERT projects
  ├── INSERT versions (v1.0, main branch)
  └── 创建目录 + META/CORE/ 结构

生成 Scaffold
  │
  └── AI 生成 TODO.md, CLAUDE.md 等（文件系统）

开始执行
  │
  ├── INSERT executions
  └── 逐任务 INSERT task_attempts

配置运行
  │
  └── INSERT/UPDATE runtime_configs

执行运行
  │
  └── INSERT runs
```

### 6.2 删除/归档

| 操作 | 行为 |
|------|------|
| 归档项目 | 设置 `archived_at`，不删数据 |
| 删除项目 | 级联删除 versions → executions → task_attempts |
| 清理日志 | 定期删除超过 retention 的 runs + 日志文件 |

### 6.3 数据一致性

| 风险 | 缓解 |
|------|------|
| 目录被用户删除 | 启动时校验 `path` 存在，不存在则标记 |
| SQLite 和文件不同步 | 关键操作用事务，先写 SQLite 再写文件 |
| 执行中途崩溃 | 启动时检查 `status = 'running'` 的记录，标记为 aborted |

---

## 七、Checklist

| 检查项 | 说明 |
|--------|------|
| 所有表有主键 | 使用 UUID |
| 外键有索引 | 加速 JOIN 查询 |
| 时间用 ISO 8601 | 统一格式，时区安全 |
| 状态字段用字符串 | 可读、可扩展 |
| 软删除而非物理删除 | 数据可恢复 |
| 敏感数据不存数据库 | 密钥存 Keychain |
