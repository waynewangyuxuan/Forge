# IPC Layer

> **核心思想**：前后端通过类型安全的 IPC 通信，Invoke 用于请求响应，Events 用于推送

---

## 一、IPC 概述

### 1.1 两种通信模式

| 模式 | 方向 | 用途 | Electron API |
|------|------|------|--------------|
| **Invoke** | Renderer → Main → Renderer | 请求-响应 | `ipcRenderer.invoke` / `ipcMain.handle` |
| **Event** | Main → Renderer | 推送通知 | `webContents.send` / `ipcRenderer.on` |

### 1.2 命名规范

```
domain:action

domain = project | version | spec | review | execution | runtime | ...
action = list | get | create | update | delete | ...
```

### 1.3 类型定义位置

```
src/shared/types/
└── ipc.types.ts      # 所有 IPC 通道的类型定义
```

前后端共享同一份类型，保证类型安全。

---

## 二、Invoke 通道

### 2.1 Project

| 通道 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `project:list` | `{ includeArchived?: boolean }` | `Project[]` | 获取项目列表 |
| `project:create` | `{ name }` | `Project` | 创建项目（自动创建 GitHub 仓库） |
| `project:get` | `{ id }` | `Project \| null` | 获取项目详情 |
| `project:archive` | `{ id }` | `void` | 归档项目 |
| `project:delete` | `{ id }` | `void` | 删除项目（可选删除 GitHub 仓库） |

### 2.2 Version

| 通道 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `version:list` | `{ projectId }` | `Version[]` | 获取项目的所有版本 |
| `version:get` | `{ id }` | `Version \| null` | 获取版本详情（含状态） |
| `version:create` | `{ projectId, versionName, branchName }` | `Version` | 创建新版本（Iterate 时） |
| `version:setActive` | `{ id }` | `void` | 设置活跃版本（用于 Runtime） |

### 2.3 Spec

| 通道 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `spec:read` | `{ versionId, file }` | `string` | 读取 Spec 文件内容 |
| `spec:save` | `{ versionId, file, content }` | `void` | 保存 Spec 文件 |
| `spec:generateScaffold` | `{ versionId }` | `void` | 触发 Scaffold 生成（异步，通过 Event 返回进度） |

`file` 可选值：`'PRODUCT.md' | 'TECHNICAL.md' | 'REGULATION.md'`

### 2.4 Review

| 通道 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `review:getTodo` | `{ versionId }` | `ExecutionPlan` | 获取解析后的 TODO 结构 |
| `review:readTodoRaw` | `{ versionId }` | `string` | 获取 TODO.md 原始文本 |
| `review:saveTodoRaw` | `{ versionId, content }` | `void` | 保存 TODO.md 原始文本 |
| `review:addFeedback` | `{ versionId, feedback }` | `void` | 添加整体 comment（MVP） |
| `review:clearFeedback` | `{ versionId }` | `void` | 清除所有 feedback |
| `review:regenerate` | `{ versionId }` | `void` | 基于 feedback 重新生成 |
| `review:approve` | `{ versionId }` | `void` | 确认通过，进入 Ready 状态 |

### 2.5 Execution

| 通道 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `execution:start` | `{ versionId, options? }` | `Execution` | 开始执行 |
| `execution:pause` | `{ executionId }` | `void` | 暂停 |
| `execution:resume` | `{ executionId }` | `void` | 恢复 |
| `execution:abort` | `{ executionId }` | `void` | 中止 |
| `execution:retry` | `{ executionId, taskId }` | `void` | 重试失败的任务 |
| `execution:skip` | `{ executionId, taskId }` | `void` | 跳过当前任务 |
| `execution:getStatus` | `{ executionId }` | `ExecutionStatus` | 获取执行状态和进度 |

`options` 可包含：`{ commitStrategy, openInEditor }`

### 2.6 Runtime

| 通道 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `runtime:configure` | `{ versionId, config }` | `void` | 配置运行方式 |
| `runtime:getConfig` | `{ versionId }` | `RuntimeConfig \| null` | 获取运行配置 |
| `runtime:trigger` | `{ versionId }` | `Run` | 手动触发运行 |
| `runtime:stop` | `{ versionId }` | `void` | 停止运行（always-running） |
| `runtime:getStatus` | `{ versionId }` | `RuntimeStatus` | 获取运行状态 |
| `runtime:getHistory` | `{ versionId, limit? }` | `Run[]` | 获取运行历史 |
| `runtime:getLogs` | `{ runId }` | `string` | 获取日志内容 |

`config` 结构：`{ triggerType, cronExpression?, credentials }`

### 2.7 Dashboard

| 通道 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `dashboard:getConfig` | `{ versionId }` | `DashboardConfig \| null` | 获取 DASHBOARD.yaml 配置 |
| `dashboard:getMetrics` | `{ versionId }` | `MetricValues` | 获取解析后的指标数据 |

### 2.8 Credentials

| 通道 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `credentials:list` | `void` | `Credential[]` | 列出凭证（不含值） |
| `credentials:add` | `{ nickname, type, value }` | `Credential` | 添加凭证 |
| `credentials:update` | `{ id, value }` | `void` | 更新凭证值 |
| `credentials:delete` | `{ id }` | `void` | 删除凭证 |

### 2.9 Shell

| 通道 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `shell:openInEditor` | `{ path }` | `void` | 用 VSCode 打开项目 |
| `shell:openFolder` | `{ path }` | `void` | 用 Finder/Explorer 打开目录 |
| `shell:openExternal` | `{ url }` | `void` | 打开外部链接 |

### 2.10 System

| 通道 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `system:getSettings` | `void` | `Settings` | 获取全局设置 |
| `system:updateSettings` | `Partial<Settings>` | `Settings` | 更新全局设置 |
| `system:selectFolder` | `{ title?, defaultPath? }` | `string \| null` | 弹出目录选择对话框 |
| `system:checkClaude` | `void` | `{ available, version? }` | 检查 Claude CLI 是否可用 |
| `system:getAppInfo` | `void` | `{ version, dataPath }` | 获取应用信息 |

### 2.11 GitHub

| 通道 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `github:checkAuth` | `void` | `GitHubAuthStatus` | 检查 GitHub 认证状态 |
| `github:authenticate` | `void` | `GitHubUser` | 触发 GitHub OAuth 认证 |
| `github:getUser` | `void` | `GitHubUser \| null` | 获取当前认证用户 |
| `github:getCloneRoot` | `void` | `string` | 获取 clone 根目录 |
| `github:setCloneRoot` | `{ path }` | `void` | 设置 clone 根目录 |

`GitHubAuthStatus` 结构：`{ authenticated, user? }`

**注意**：`project:create` 会自动调用 GitHub API 创建仓库并 clone，无需单独调用 GitHub 通道。

---

## 三、Event 通道

### 3.1 Scaffold 生成

| 事件 | 数据 | 说明 |
|------|------|------|
| `scaffold:progress` | `{ versionId, message }` | 生成进度（AI 输出流） |
| `scaffold:completed` | `{ versionId }` | 生成完成 |
| `scaffold:error` | `{ versionId, error }` | 生成出错 |

### 3.2 Execution 执行

| 事件 | 数据 | 说明 |
|------|------|------|
| `execution:progress` | `{ executionId, completed, total, percent }` | 整体进度更新 |
| `execution:taskStart` | `{ executionId, taskId, description }` | 任务开始 |
| `execution:taskDone` | `{ executionId, taskId }` | 任务完成 |
| `execution:taskFailed` | `{ executionId, taskId, error }` | 任务失败 |
| `execution:paused` | `{ executionId }` | 已暂停 |
| `execution:resumed` | `{ executionId }` | 已恢复 |
| `execution:completed` | `{ executionId }` | 全部完成 |
| `execution:error` | `{ executionId, error }` | 执行出错 |

### 3.3 Runtime 运行

| 事件 | 数据 | 说明 |
|------|------|------|
| `runtime:started` | `{ runId, versionId }` | 运行开始 |
| `runtime:log` | `{ runId, line }` | 日志行输出（实时流） |
| `runtime:completed` | `{ runId, status, exitCode }` | 运行结束 |
| `runtime:healthUpdate` | `{ versionId, healthy, message? }` | 健康状态变化 |

### 3.4 File 文件监听

| 事件 | 数据 | 说明 |
|------|------|------|
| `file:changed` | `{ versionId, file, changeType }` | META/ 下文件被外部修改 |

`changeType`: `'add' | 'change' | 'unlink'`

### 3.5 System 系统

| 事件 | 数据 | 说明 |
|------|------|------|
| `system:claudeStatus` | `{ available }` | Claude CLI 状态变化 |

---

## 四、返回格式约定

### 4.1 Invoke 返回

成功时直接返回数据：

```typescript
const projects = await ipcRenderer.invoke('project:list', {})
// projects: Project[]
```

失败时抛出错误：

```typescript
try {
  await ipcRenderer.invoke('project:create', { name: '', path: '' })
} catch (error) {
  // error.message: "Name is required"
  // error.code: "VALIDATION_ERROR"
}
```

### 4.2 错误序列化策略

Electron 的 IPC 错误序列化会丢失自定义属性（如 `code`）。后端需要显式处理：

```typescript
// 后端 IPC handler
ipcMain.handle('project:create', async (event, input) => {
  try {
    return await createProjectUseCase.execute(input)
  } catch (err) {
    // 将自定义错误转为可序列化对象后再 throw
    throw {
      message: err.message,
      code: err.code || 'INTERNAL_ERROR',
      details: err.details
    }
  }
})
```

前端接收到的 error 对象会包含这些属性：

```typescript
try {
  await window.api.invoke('project:create', input)
} catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
    // 显示验证错误
  } else if (error.code === 'DUPLICATE') {
    // 显示重复错误
  }
}
```

### 4.3 错误类型

| 错误码 | 说明 |
|--------|------|
| `VALIDATION_ERROR` | 输入验证失败 |
| `NOT_FOUND` | 资源不存在 |
| `DUPLICATE` | 唯一约束冲突 |
| `CLAUDE_UNAVAILABLE` | Claude CLI 不可用 |
| `CLAUDE_TIMEOUT` | Claude 执行超时 |
| `FILE_NOT_FOUND` | 文件不存在 |
| `INTERNAL_ERROR` | 内部错误 |

---

## 五、Preload 暴露

```typescript
// src/preload/index.ts

contextBridge.exposeInMainWorld('api', {
  // Invoke
  invoke: (channel: string, data?: any) => ipcRenderer.invoke(channel, data),
  
  // Event listeners
  on: (channel: string, callback: (data: any) => void) => {
    const subscription = (_event: IpcRendererEvent, data: any) => callback(data)
    ipcRenderer.on(channel, subscription)
    return () => ipcRenderer.removeListener(channel, subscription)
  },
  
  // One-time listener
  once: (channel: string, callback: (data: any) => void) => {
    ipcRenderer.once(channel, (_event, data) => callback(data))
  },
})
```

### 前端使用

```typescript
// Invoke
const projects = await window.api.invoke('project:list', { includeArchived: false })

// Event listener
const unsubscribe = window.api.on('execution:progress', (data) => {
  console.log(`Progress: ${data.percent}%`)
})

// Cleanup
unsubscribe()
```

---

## 六、后端 Handler 组织

```
src/main/infrastructure/ipc/
├── index.ts              # 注册所有 handlers
├── project.ipc.ts        # project:* handlers
├── version.ipc.ts        # version:* handlers
├── spec.ipc.ts           # spec:* handlers
├── review.ipc.ts         # review:* handlers
├── execution.ipc.ts      # execution:* handlers
├── runtime.ipc.ts        # runtime:* handlers
├── dashboard.ipc.ts      # dashboard:* handlers
├── credentials.ipc.ts    # credentials:* handlers
├── shell.ipc.ts          # shell:* handlers
└── system.ipc.ts         # system:* handlers
```

每个文件负责一个 domain 的 handlers，职责单一。

---

## 七、Checklist

| 检查项 | 说明 |
|--------|------|
| 所有通道都有类型定义 | 在 `shared/types/ipc.types.ts` |
| Invoke 通道用 `handle` 注册 | 不要用 `on` |
| Event 通道统一前缀 | 方便前端按类别订阅 |
| 错误有明确的 code | 前端可以据此处理 |
| Preload 只暴露必要的 API | 安全考虑 |
| 长时间操作用 Event 推送进度 | 不要让 Invoke 卡住 |