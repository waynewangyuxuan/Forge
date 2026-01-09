# Frontend Architecture

> **核心思想**：简洁优先，状态按性质分层，URL 即上下文

---

## 一、设计原则

### 1.1 背景

Forge 是一个本地 Electron 应用，前后端在同一个 Repo。不需要考虑：

- 多用户并发
- 离线同步
- 复杂的缓存失效策略

所以我们选择**最简洁的方案**，够用就好。

### 1.2 原则

| 原则 | 说明 |
|------|------|
| **简洁优先** | 不过度设计，本地小工具够用就行 |
| **按性质分层** | 不同性质的状态用不同的管理方式 |
| **URL 即上下文** | 当前在看哪个项目/版本，由路由决定 |
| **Store 管订阅** | 实时推送在 Store 层统一处理，组件只读数据 |

---

## 二、状态分类

### 2.1 三类状态

| 类型 | 来源 | 特点 | 管理方式 |
|------|------|------|---------|
| **Server Data** | IPC 请求 | 需要加载、可能过期 | Zustand Store |
| **Realtime** | IPC 事件推送 | 持续更新、需要订阅 | Zustand Store |
| **UI State** | 用户交互 | 临时、不持久化 | Zustand Store 或 useState |

### 2.2 为什么按性质切分？

**按领域切分**（projectStore、executionStore）的问题：

```
❌ projectStore 里既有服务端数据，又有 UI 状态
❌ executionStore 里既有配置，又有实时进度
❌ 边界模糊，状态散落各处
```

**按性质切分**的好处：

```
✅ 服务端数据统一管理，缓存策略一致
✅ 实时推送统一订阅，清理逻辑集中
✅ UI 状态独立，不污染业务数据
```

---

## 三、Store 结构

```
src/renderer/stores/
├── server.store.ts      # 服务端数据
├── realtime.store.ts    # 实时推送
└── ui.store.ts          # UI 状态
```

### 3.1 Server Store

**职责**：管理所有通过 IPC 请求获取的数据

**包含**：
- 项目列表
- 版本列表
- 凭证列表
- 全局设置
- 各类加载状态

**缓存策略**：
- 有数据就先渲染
- 进入页面时后台刷新
- 不做复杂的过期判断

**完整结构**：

```typescript
interface ServerStore {
  // ========== 数据 ==========

  // Project
  projects: Project[]

  // Version
  versions: Record<string, Version[]>          // projectId -> versions
  currentVersionId: Record<string, string>     // projectId -> versionId

  // Runtime
  runtimeConfigs: Record<string, RuntimeConfig>  // versionId -> config
  runHistory: Record<string, Run[]>              // versionId -> runs

  // Dashboard
  dashboardMetrics: Record<string, MetricValues> // versionId -> metrics

  // Credentials & Settings
  credentials: Credential[]
  settings: Settings | null

  // 加载状态
  loading: {
    projects: boolean
    versions: boolean
    runtime: boolean
    credentials: boolean
    settings: boolean
  }

  // ========== Actions ==========

  // Project
  fetchProjects: () => Promise<void>
  createProject: (input: CreateProjectInput) => Promise<Project>
  archiveProject: (id: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  // Version
  fetchVersions: (projectId: string) => Promise<void>
  setCurrentVersion: (projectId: string, versionId: string) => void
  createVersion: (projectId: string, input: CreateVersionInput) => Promise<Version>

  // Runtime
  fetchRuntimeConfig: (versionId: string) => Promise<void>
  saveRuntimeConfig: (versionId: string, config: RuntimeConfigInput) => Promise<void>
  fetchRunHistory: (versionId: string, limit?: number) => Promise<void>
  triggerRun: (versionId: string) => Promise<Run>

  // Dashboard
  fetchDashboardMetrics: (versionId: string) => Promise<void>

  // Credentials
  fetchCredentials: () => Promise<void>
  addCredential: (input: AddCredentialInput) => Promise<Credential>
  updateCredential: (id: string, value: string) => Promise<void>
  deleteCredential: (id: string) => Promise<void>

  // Settings
  fetchSettings: () => Promise<void>
  updateSettings: (updates: Partial<Settings>) => Promise<Settings>
}
```

**使用方式**：

```typescript
// 组件中
const projects = useServerStore(s => s.projects)
const loading = useServerStore(s => s.loading.projects)
const fetchProjects = useServerStore(s => s.fetchProjects)

useEffect(() => {
  fetchProjects()
}, [])
```

### 3.2 Realtime Store

**职责**：管理所有 IPC 事件推送的实时数据

**包含**：
- 执行进度（executionId → 状态）
- 运行状态（runId → 状态）
- 实时日志

**关键设计**：Store 层统一订阅，组件只读

为什么不在组件里订阅？

```typescript
// ❌ 组件里订阅 — 散乱、重复、难管理
useEffect(() => {
  const unsub = window.api.on('execution:progress', (data) => {
    setProgress(data)
  })
  return unsub
}, [])

// ✅ Store 层订阅 — 集中、可复用、自动清理
const execution = useRealtimeStore(s => s.executions[executionId])
```

**完整结构**：

```typescript
interface RealtimeStore {
  // ========== 状态数据 ==========

  // Scaffold 生成进度
  scaffolds: Record<string, ScaffoldState>    // versionId -> state

  // 执行状态
  executions: Record<string, ExecutionState>  // executionId -> state
  activeExecutionByVersion: Record<string, string>  // versionId -> executionId (当前活跃执行)

  // 运行状态
  runs: Record<string, RunState>              // runId -> state
  activeRunByVersion: Record<string, string>  // versionId -> runId (当前活跃运行)

  // ========== 订阅管理 ==========

  subscribeScaffold: (versionId: string) => () => void
  subscribeExecution: (versionId: string, executionId: string) => () => void  // 同时传入 versionId 用于映射
  subscribeRun: (versionId: string, runId: string) => () => void

  // ========== 清理 ==========

  clearScaffold: (versionId: string) => void
  clearExecution: (executionId: string) => void
  clearRun: (runId: string) => void

  // ========== 便捷方法 ==========

  getActiveExecution: (versionId: string) => ExecutionState | undefined
  getActiveRun: (versionId: string) => RunState | undefined
}

interface ScaffoldState {
  status: 'generating' | 'completed' | 'error'
  messages: string[]        // 进度消息流
  error?: string
}

interface ExecutionState {
  status: 'running' | 'paused' | 'completed' | 'error'
  progress: { completed: number; total: number; percent: number }
  currentTaskId?: string
  currentTaskDescription?: string
  error?: string
}

interface RunState {
  status: 'running' | 'success' | 'failed'
  logs: string[]            // 日志行
  exitCode?: number
}
```

**使用方式**：

```typescript
// 组件中
const { versionId } = useParams<{ versionId: string }>()
const execution = useRealtimeStore(s => s.getActiveExecution(versionId))
const subscribe = useRealtimeStore(s => s.subscribeExecution)

useEffect(() => {
  if (!executionId) return
  return subscribe(versionId, executionId)  // 传入 versionId 用于映射，返回的清理函数自动取消订阅
}, [versionId, executionId, subscribe])

// 渲染
if (!execution) return <Loading />
return <ProgressBar value={execution.progress.completed} max={execution.progress.total} />
```

### 3.3 UI Store

**职责**：管理纯 UI 状态，与业务数据无关

**包含**：
- Modal 开关状态
- 确认对话框状态
- 侧边栏折叠状态
- 等等

**示例结构**：

```typescript
interface UIStore {
  // Modal 状态
  modals: {
    createProject: boolean
    confirmDelete: { open: boolean; targetId?: string }
    runtimeConfig: boolean
  }
  
  // Actions
  openModal: (name: ModalName, data?: any) => void
  closeModal: (name: ModalName) => void
  
  // 其他 UI 状态
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}
```

**使用方式**：

```typescript
// 打开 Modal
const openModal = useUIStore(s => s.openModal)
<Button onClick={() => openModal('createProject')}>New Project</Button>

// Modal 组件内
const { open, targetId } = useUIStore(s => s.modals.confirmDelete)
const closeModal = useUIStore(s => s.closeModal)
```

---

## 四、当前上下文

### 4.1 URL 即真相

当前在看哪个项目、哪个版本，由 URL 决定：

```
/projects                           # 项目列表
/projects/:projectId                # 项目详情
/projects/:projectId/spec           # 编辑 Spec
/projects/:projectId/review         # Review TODO
/projects/:projectId/execute        # 执行进度
/projects/:projectId/runtime        # 运行管理
/settings                           # 全局设置
```

### 4.2 为什么用 URL？

| 方案 | 优点 | 缺点 |
|------|------|------|
| **URL 参数** | 可分享、刷新不丢失、浏览器前进后退 | 需要路由配置 |
| 全局 Store | 灵活 | 刷新丢失、需要手动同步 |
| React Context | 组件树传递方便 | 刷新丢失、嵌套复杂 |

对于本地应用，URL 参数最简单直接。

### 4.3 使用方式

```typescript
// 路由配置
<Route path="/projects/:projectId" element={<ProjectDetail />} />
<Route path="/projects/:projectId/spec" element={<SpecEditor />} />

// 组件中获取
import { useParams } from 'react-router-dom'

function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const project = useServerStore(s => s.projects.find(p => p.id === projectId))
  
  if (!project) return <NotFound />
  return <div>{project.name}</div>
}
```

---

## 五、数据流

### 5.1 请求数据流

```
组件 Mount
    │
    │ useEffect
    ▼
ServerStore.fetchXxx()
    │
    │ window.api.invoke()
    ▼
IPC (Main Process)
    │
    │ 返回数据
    ▼
ServerStore 更新
    │
    │ Zustand 自动通知
    ▼
组件 Re-render
```

### 5.2 实时推送流

```
组件 Mount
    │
    │ useEffect → subscribe(id)
    ▼
RealtimeStore 注册监听
    │
    │ window.api.on(...)
    │
    ▼
Main Process 推送事件
    │
    │ IPC Event
    ▼
RealtimeStore 更新
    │
    │ Zustand 自动通知
    ▼
组件 Re-render
    │
    │
组件 Unmount
    │
    │ useEffect cleanup
    ▼
RealtimeStore 取消监听
```

### 5.3 用户操作流

```
用户点击按钮
    │
    ▼
组件调用 Store Action
    │
    │ e.g. createProject(data)
    ▼
Store 调用 IPC
    │
    │ window.api.invoke('project:create', data)
    ▼
Main Process 处理
    │
    │ 返回结果
    ▼
Store 更新本地状态
    │
    │ 添加到 projects 列表
    ▼
组件自动更新
```

---

## 六、文件结构

> 完整目录结构详见 [FILE-STRUCTURE.md](../FILE-STRUCTURE.md)，此处仅列出重点部分。

```
src/renderer/
├── stores/                   # 状态管理 (Zustand)
│   ├── server.store.ts       # 服务端数据
│   ├── realtime.store.ts     # 实时推送
│   └── ui.store.ts           # UI 状态
│
├── pages/                    # 页面组件
│   ├── ProjectListPage/
│   ├── ProjectLayout/        # 包含 Sidebar 的布局
│   ├── OverviewPage/
│   ├── SpecPage/
│   ├── ReviewPage/
│   ├── ExecutePage/
│   ├── RuntimePage/
│   ├── DashboardPage/
│   └── SettingsPage/
│
├── components/               # 通用组件
│   ├── primitives/           # 基础组件
│   ├── composites/           # 组合组件
│   └── editors/              # 编辑器组件
│
├── hooks/                    # 自定义 Hooks
├── router.tsx                # 路由配置
└── App.tsx                   # 根组件
```

---

## 七、最佳实践

### 7.1 Store 使用

```typescript
// ✅ 选择性订阅，避免不必要的 re-render
const projects = useServerStore(s => s.projects)

// ❌ 订阅整个 store
const store = useServerStore()
```

### 7.2 加载状态

```typescript
// ✅ 使用 Store 中的 loading 状态
const loading = useServerStore(s => s.loading.projects)
const projects = useServerStore(s => s.projects)

if (loading && projects.length === 0) return <Loading />
return <ProjectList projects={projects} />

// 这样可以实现：有缓存数据时先展示，后台静默刷新
```

### 7.3 实时订阅

```typescript
// ✅ 在 useEffect 中订阅，返回清理函数
useEffect(() => {
  if (!executionId) return
  return subscribeExecution(versionId, executionId)
}, [versionId, executionId])

// ❌ 忘记清理
useEffect(() => {
  subscribeExecution(versionId, executionId)
  // 没有 return，内存泄漏！
}, [versionId, executionId])
```

### 7.4 错误处理

```typescript
// Store Action 中统一处理
const createProject = async (input: CreateProjectInput) => {
  try {
    const project = await window.api.invoke('project:create', input)
    set(s => ({ projects: [...s.projects, project] }))
    return project
  } catch (error) {
    // 可以在这里统一处理错误，比如 toast 提示
    console.error('Failed to create project:', error)
    throw error  // 重新抛出，让组件知道失败了
  }
}
```

---

## 八、Checklist

| 检查项 | 说明 |
|--------|------|
| 状态放对地方 | 服务端数据 → server.store，实时数据 → realtime.store |
| 选择性订阅 | 使用 selector 避免不必要的 re-render |
| 清理订阅 | useEffect 返回 cleanup 函数 |
| URL 管理上下文 | 当前项目/版本从路由参数获取 |
| 统一错误处理 | Store Action 中 try/catch |

---

## 九、技术选型

| 模块 | 技术 | 理由 |
|------|------|------|
| 状态管理 | Zustand | 轻量、简洁、TypeScript 友好 |
| 路由 | React Router | 成熟稳定 |
| 样式 | Tailwind CSS | 快速开发、与 Design System 配合 |
| 组件 | 自建 | 按 Design System 规范实现 |
