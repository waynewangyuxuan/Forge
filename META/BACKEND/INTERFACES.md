# Interfaces

> **核心思想**：Application 层依赖接口，Infrastructure 层实现接口

---

## 一、为什么需要接口？

### 1.1 问题

如果 Application 直接依赖具体实现：

```
CreateProjectUseCase
    │
    ├── 直接 import SQLiteRepository
    ├── 直接 import fs
    └── 直接 import child_process
```

问题：
- 测试时必须有真实数据库、文件系统
- 换存储方案要改 Use Case 代码
- 业务逻辑和技术细节耦合

### 1.2 解决方案

Application 依赖**接口**，Infrastructure 提供**实现**：

```
CreateProjectUseCase
    │
    └── 依赖 IProjectRepository (接口)
                    ▲
                    │ 实现
                    │
        SQLiteProjectRepository
```

### 1.3 收益

| 收益 | 说明 |
|------|------|
| **可测试** | 测试时用 Mock 实现 |
| **可替换** | 换 PostgreSQL？只改 Infrastructure |
| **关注点分离** | Use Case 只关心"要什么"，不关心"怎么来" |
| **依赖倒置** | 高层不依赖低层，都依赖抽象 |

---

## 二、接口位置

> 完整目录结构详见 [FILE-STRUCTURE.md](../FILE-STRUCTURE.md)

```
src/shared/interfaces/              # ⭐ 接口定义在这里
├── repositories.ts                 # IProjectRepository, IVersionRepository 等
├── adapters.ts                     # IClaudeAdapter, IFileSystemAdapter 等
└── index.ts                        # 统一导出
```

**为什么接口在 shared/?**

- Application 和 Infrastructure 都需要 import
- 放 shared/ 两边都能访问
- 也方便前端知道后端能提供什么能力

---

## 三、Repository 接口

Repository 负责数据持久化，隔离存储细节。

### 3.1 IProjectRepository

```typescript
interface IProjectRepository {
  // 查询
  findById(id: string): Promise<Project | null>
  findByPath(path: string): Promise<Project | null>
  findAll(options?: { includeArchived?: boolean }): Promise<Project[]>
  
  // 写入
  create(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project>
  update(id: string, data: Partial<Project>): Promise<Project>
  archive(id: string): Promise<void>
  delete(id: string): Promise<void>
}
```

### 3.2 IVersionRepository

```typescript
interface IVersionRepository {
  findById(id: string): Promise<Version | null>
  findByProject(projectId: string): Promise<Version[]>
  findActiveByProject(projectId: string): Promise<Version | null>
  
  create(version: Omit<Version, 'id' | 'createdAt'>): Promise<Version>
  updateStatus(id: string, devStatus?: string, runtimeStatus?: string): Promise<void>
}
```

### 3.3 IExecutionRepository

```typescript
interface IExecutionRepository {
  findById(id: string): Promise<Execution | null>
  findByVersion(versionId: string): Promise<Execution[]>
  findRunning(): Promise<Execution[]>
  
  create(execution: Omit<Execution, 'id'>): Promise<Execution>
  updateProgress(id: string, completedTasks: number, currentTaskId?: string): Promise<void>
  complete(id: string, status: 'completed' | 'failed' | 'aborted'): Promise<void>
}
```

### 3.4 IRunRepository

```typescript
interface IRunRepository {
  findById(id: string): Promise<Run | null>
  findByVersion(versionId: string, limit?: number): Promise<Run[]>
  findRecent(limit: number): Promise<Run[]>
  
  create(run: Omit<Run, 'id'>): Promise<Run>
  complete(id: string, status: 'success' | 'failed', exitCode?: number): Promise<void>
}
```

### 3.5 设计原则

| 原则 | 说明 |
|------|------|
| 方法粒度适中 | 不要太细（每个字段一个方法），不要太粗（一个 save 包打天下） |
| 返回完整实体 | create/update 返回完整对象，方便调用方使用 |
| 查询方法返回 null | 找不到返回 null，不抛异常 |
| 批量操作独立方法 | findAll、findByXxx 等 |

---

## 四、Adapter 接口

Adapter 封装外部系统交互。

### 4.1 IClaudeAdapter

与 Claude Code CLI 交互。

```typescript
interface IClaudeAdapter {
  // 执行 Prompt，返回结果
  execute(options: ClaudeExecuteOptions): Promise<ClaudeResult>
  
  // 执行并流式返回输出
  executeStream(options: ClaudeExecuteOptions): AsyncIterable<ClaudeStreamChunk>
  
  // 检查 Claude CLI 是否可用
  isAvailable(): Promise<boolean>
  
  // 中断正在执行的任务
  abort(sessionId: string): Promise<void>
}

interface ClaudeExecuteOptions {
  prompt: string
  workingDirectory: string
  allowedTools?: string[]        // ['Read', 'Write', 'Bash']
  timeout?: number               // 秒
  sessionId?: string             // 用于追踪和中断
}

interface ClaudeResult {
  success: boolean
  output: string
  error?: string
  exitCode: number
}

interface ClaudeStreamChunk {
  type: 'stdout' | 'stderr' | 'status'
  content: string
}
```

### 4.2 IFileSystemAdapter

文件系统操作。

```typescript
interface IFileSystemAdapter {
  // 读取
  readFile(path: string): Promise<string>
  readDir(path: string): Promise<string[]>
  exists(path: string): Promise<boolean>
  isDirectory(path: string): Promise<boolean>
  
  // 写入
  writeFile(path: string, content: string): Promise<void>
  createDir(path: string, recursive?: boolean): Promise<void>
  copyDir(src: string, dest: string): Promise<void>
  
  // 删除
  remove(path: string): Promise<void>
  
  // 监听
  watch(path: string, callback: (event: FileChangeEvent) => void): WatchHandle
}

interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink'
  path: string
}

interface WatchHandle {
  stop(): void
}
```

### 4.3 ISchedulerAdapter

定时任务调度。

```typescript
interface ISchedulerAdapter {
  // 注册定时任务
  schedule(id: string, cron: string, callback: () => Promise<void>): void
  
  // 取消定时任务
  cancel(id: string): void
  
  // 获取所有已注册任务
  getScheduled(): ScheduledTask[]
  
  // 获取下次执行时间
  getNextRun(id: string): Date | null
}

interface ScheduledTask {
  id: string
  cron: string
  nextRun: Date
}
```

### 4.4 ICredentialStore

凭证存储（系统 Keychain）。

```typescript
interface ICredentialStore {
  // 存储
  set(nickname: string, value: string): Promise<void>
  
  // 读取
  get(nickname: string): Promise<string | null>
  
  // 删除
  delete(nickname: string): Promise<void>
  
  // 检查是否存在
  has(nickname: string): Promise<boolean>
}
```

### 4.5 IGitAdapter

Git 操作（可选，MVP 可以先用 shell 命令）。

```typescript
interface IGitAdapter {
  init(path: string): Promise<void>
  commit(path: string, message: string): Promise<void>
  createBranch(path: string, branch: string): Promise<void>
  checkout(path: string, branch: string): Promise<void>
  getCurrentBranch(path: string): Promise<string>
  push(path: string, remote?: string): Promise<void>
}
```

---

## 五、接口与实现的对应

| 接口 | 实现 | 依赖 |
|------|------|------|
| IProjectRepository | SQLiteProjectRepository | better-sqlite3 |
| IVersionRepository | SQLiteVersionRepository | better-sqlite3 |
| IExecutionRepository | SQLiteExecutionRepository | better-sqlite3 |
| IRunRepository | SQLiteRunRepository | better-sqlite3 |
| IClaudeAdapter | ClaudeCliAdapter | child_process |
| IFileSystemAdapter | NodeFileSystemAdapter | fs/promises |
| ISchedulerAdapter | NodeCronSchedulerAdapter | node-cron |
| ICredentialStore | KeytarCredentialStore | keytar |
| IGitAdapter | ShellGitAdapter | child_process |

---

## 六、Use Case 如何使用接口

### 6.1 依赖注入

Use Case 通过构造函数接收依赖：

```typescript
class CreateProjectUseCase {
  constructor(
    private projectRepo: IProjectRepository,
    private fs: IFileSystemAdapter,
  ) {}
  
  async execute(input: CreateProjectInput): Promise<Project> {
    // 使用 this.projectRepo 和 this.fs
    // 不知道具体是 SQLite 还是其他实现
  }
}
```

### 6.2 组装

在应用启动时组装依赖：

```typescript
// src/main/index.ts

const db = new Database('forge.db')
const projectRepo = new SQLiteProjectRepository(db)
const fs = new NodeFileSystemAdapter()

const createProject = new CreateProjectUseCase(projectRepo, fs)
```

### 6.3 测试时替换

测试时用 Mock：

```typescript
const mockRepo = {
  create: vi.fn().mockResolvedValue({ id: '123', name: 'test' }),
  findById: vi.fn(),
  // ...
}

const mockFs = {
  createDir: vi.fn().mockResolvedValue(undefined),
  // ...
}

const useCase = new CreateProjectUseCase(mockRepo, mockFs)
await useCase.execute({ name: 'test', path: '/tmp/test' })

expect(mockRepo.create).toHaveBeenCalled()
expect(mockFs.createDir).toHaveBeenCalledWith('/tmp/test', true)
```

---

## 七、错误处理约定

### 7.1 Repository 错误

| 情况 | 处理 |
|------|------|
| 记录不存在 | 返回 `null`，不抛异常 |
| 唯一约束冲突 | 抛 `DuplicateError` |
| 数据库错误 | 抛 `DatabaseError` |

### 7.2 Adapter 错误

| 情况 | 处理 |
|------|------|
| 文件不存在 | 抛 `FileNotFoundError` |
| Claude 超时 | 抛 `TimeoutError` |
| Claude 不可用 | 抛 `ClaudeUnavailableError` |
| 网络错误 | 抛 `NetworkError` |

### 7.3 自定义错误类型

```typescript
// shared/errors.ts

class ForgeError extends Error {
  constructor(message: string, public code: string) {
    super(message)
  }
}

class DuplicateError extends ForgeError {
  constructor(entity: string, field: string) {
    super(`${entity} with this ${field} already exists`, 'DUPLICATE')
  }
}

class FileNotFoundError extends ForgeError {
  constructor(path: string) {
    super(`File not found: ${path}`, 'FILE_NOT_FOUND')
  }
}
```

---

## 八、Checklist

| 检查项 | 说明 |
|--------|------|
| 接口只定义方法签名 | 不包含实现逻辑 |
| 接口在 shared/ | Application 和 Infrastructure 都能访问 |
| 每个外部依赖一个接口 | 数据库、文件、网络、定时器 |
| Use Case 通过构造函数接收依赖 | 方便测试时替换 |
| 错误类型明确 | 调用方知道如何处理 |
