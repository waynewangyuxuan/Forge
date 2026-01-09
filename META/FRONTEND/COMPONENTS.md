# Components

> **核心思想**：基于 Design System，简洁实用，MVP 够用就好

---

## 〇、Design System - Warm Industrial

### 颜色系统

| 名称 | 色值 | 用途 |
|------|------|------|
| Background | `#faf9f7` | 页面背景（warm white） |
| Surface | `#ffffff` | 卡片、组件背景 |
| Muted | `#f5f5f4` | 次要背景、hover 状态 |
| Border | `#e5e5e5` | 边框 |
| Border Light | `#f0f0f0` | 分隔线 |
| Accent | amber-500 | 主色调（solid） |
| Success | `#16a34a` (green-600) | 成功状态 |
| Error | `#dc2626` (red-600) | 错误状态 |
| Text | `#1a1a1a` | 主要文字 |
| Text Secondary | `#525252` | 次要文字 |
| Text Muted | `#737373` | 辅助文字 |
| Text Placeholder | `#a3a3a3` | 占位符、标签 |

### 字体系统

**字体族**：DM Sans（Google Fonts），fallback: Inter, system-ui

**字重使用规范**：

| 使用场景 | 字重 | 额外样式 | 示例 |
|----------|------|----------|------|
| 页面标题 | `font-light` (300) | `tracking-tight` | "My Projects" |
| Modal/空状态标题 | `font-light` (300) | `tracking-tight` | "No projects yet" |
| 卡片标题 | `font-medium` (500) | - | Card header title |
| 项目名/版本名 | `font-medium` (500) | - | ProjectCard title |
| 正文 | `font-normal` (400) | - | 描述文字 |
| 标签/小标题 | `font-medium` (500) | `uppercase tracking-wider` 或 `tracking-[0.2em]` | "DEVELOPMENT" |
| 按钮文字 | `font-medium` (500) | - | "Create your first project" |

**关键原则**：
- 避免使用 `font-semibold` (600) 和 `font-bold` (700)，保持轻盈感
- 大标题使用 `font-light tracking-tight` 实现优雅的"气质感"
- 小标签使用 `uppercase tracking-wider` 增加层次感

### 圆角系统

| 组件 | 圆角 |
|------|------|
| 按钮 | `rounded-xl` (12px) |
| 输入框 | `rounded-xl` (12px) |
| 卡片 | `rounded-2xl` (16px) |
| Modal | `rounded-2xl` (16px) |
| Badge | `rounded-full` |
| Logo | `rounded-xl` (12px) |

### 阴影系统

| 使用场景 | 阴影 |
|----------|------|
| 卡片默认 | `shadow-sm` |
| 卡片 hover | `shadow-md` |
| Primary 按钮 | `shadow-sm` |
| Primary 按钮 hover | `shadow-md` |
| Logo | `shadow-lg shadow-amber-500/25` |
| Modal | `shadow-xl` |

### 样式参考文件

完整样式示例见：`META/FRONTEND/templates/demo.jsx`

---

## 一、组件分层

```
components/
├── primitives/          # 基础组件，纯 UI，无业务逻辑
│   ├── Button/
│   ├── Input/
│   ├── Select/
│   ├── RadioGroup/
│   ├── Card/
│   ├── Badge/
│   ├── Modal/
│   ├── ProgressBar/
│   ├── Spinner/
│   ├── Tabs/
│   └── StatusDot/
│
├── composites/          # 组合组件，由基础组件拼装
│   ├── ProjectCard/
│   ├── TaskItem/
│   ├── TaskList/
│   ├── StatCard/
│   ├── LogViewer/
│   └── RunHistoryList/
│
└── editors/             # 编辑器组件
    ├── MarkdownEditor/
    ├── MarkdownPreview/
    └── FeedbackPanel/
```

---

## 二、基础组件 (Primitives)

### 2.1 Button

四种变体，统一接口。

**变体**：

| 变体 | 用途 | 样式要点 |
|------|------|---------|
| `primary` | 主要操作 | 纯色 amber-500 背景 |
| `secondary` | 次要操作 | 灰色背景 |
| `ghost` | 轻量操作 | 透明背景、amber 文字 |
| `destructive` | 危险操作 | 红色背景 |

**Props**：

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode        // 左侧图标
  iconOnly?: boolean      // 纯图标按钮
  children?: ReactNode
  onClick?: () => void
}
```

**样式映射**（Tailwind）：

```typescript
const variants = {
  primary: 'bg-amber-500 text-white shadow-sm hover:bg-amber-600 hover:shadow-md active:bg-amber-700',
  secondary: 'bg-stone-100 text-stone-600 hover:bg-stone-200',
  ghost: 'bg-transparent text-amber-500 hover:bg-amber-50',
  destructive: 'bg-red-50 text-red-600 hover:bg-red-100',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}
```

---

### 2.2 Input

基础文本输入。

**Props**：

```typescript
interface InputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string          // 错误信息
  icon?: ReactNode        // 左侧图标
  type?: 'text' | 'password'
}
```

**样式要点**：
- 圆角 12px（rounded-xl）
- 边框 1px #e5e5e5
- Focus: amber 边框 + ring

---

### 2.3 Card

内容容器，可选 Header。

**Props**：

```typescript
interface CardProps {
  children: ReactNode
  header?: {
    title: string
    subtitle?: string
    actions?: ReactNode   // 右侧操作按钮
  }
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean         // hover 效果
  onClick?: () => void
}
```

**样式要点**：
- 圆角 16px（rounded-2xl）
- 背景 white
- 边框 1px #e5e5e5
- Header 有底边框和灰色背景

---

### 2.4 Badge

状态标签。

**Props**：

```typescript
interface BadgeProps {
  variant: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md'
  pill?: boolean          // 圆角 pill 还是方角
  children: ReactNode
}
```

**变体颜色**：

| 变体 | 背景 | 文字 | 用途 |
|------|------|------|------|
| `default` | stone-100 | stone-600 | 版本号 |
| `success` | green-50 | green-700 | completed |
| `warning` | amber-50 | amber-700 | executing |
| `error` | red-50 | red-700 | error |
| `info` | blue-50 | blue-700 | scheduled |

---

### 2.5 Modal

弹窗容器。

**Props**：

```typescript
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode      // 底部按钮区
  width?: 'sm' | 'md' | 'lg'  // 480px | 560px | 640px
}
```

**结构**：

```
┌─────────────────────────────────────┐
│  Title                         [×] │  ← Header
├─────────────────────────────────────┤
│                                     │
│  Content                            │  ← children
│                                     │
├─────────────────────────────────────┤
│                    [Cancel] [Save]  │  ← Footer
└─────────────────────────────────────┘
```

**样式要点**：
- 遮罩 black/20 + backdrop-blur
- 圆角 16px
- Header/Footer 有边框分隔

---

### 2.6 ProgressBar

进度条，支持动画。

**Props**：

```typescript
interface ProgressBarProps {
  value: number           // 当前值
  max: number             // 最大值
  showLabel?: boolean     // 显示百分比
  size?: 'sm' | 'md'      // 6px | 8px
  animated?: boolean      // shimmer 动画
}
```

**样式要点**：
- 轨道：stone-100，圆角 full
- 填充：amber 渐变，圆角 full
- 动画：shimmer 效果（执行中）

---

### 2.7 Spinner

加载指示器。

**Props**：

```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'   // 16px | 24px | 32px
  color?: 'amber' | 'white' | 'stone'
}
```

---

### 2.8 Tabs

切换面板。

**Props**：

```typescript
interface TabsProps {
  tabs: Array<{
    key: string
    label: string
    icon?: ReactNode
  }>
  activeKey: string
  onChange: (key: string) => void
}
```

**样式要点**：
- 底部边框指示当前 tab
- amber 色高亮

---

### 2.9 StatusDot

状态指示点。

**Props**：

```typescript
interface StatusDotProps {
  status: 'running' | 'success' | 'error' | 'idle' | 'paused'
  pulse?: boolean         // 脉冲动画
}
```

**颜色映射**：

| 状态 | 颜色 | 动画 |
|------|------|------|
| `running` | amber-500 | pulse |
| `success` | green-500 | 无 |
| `error` | red-500 | 无 |
| `idle` | stone-300 | 无 |
| `paused` | stone-400 | 无 |

---

### 2.10 Select

下拉选择器。

**Props**：

```typescript
interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  disabled?: boolean
}
```

**样式要点**：
- 圆角 12px（rounded-xl）
- 边框 1px #e5e5e5
- Focus: amber 边框 + ring
- 下拉面板有阴影

---

### 2.11 RadioGroup

单选组。

**Props**：

```typescript
interface RadioGroupProps {
  value: string
  onChange: (value: string) => void
  options: Array<{
    value: string
    label: string
    description?: string
  }>
  orientation?: 'horizontal' | 'vertical'
}
```

**样式要点**：
- 选中项 amber 圆点
- 可选的描述文字（text-muted）
- 垂直布局时每项有间距

---

## 三、组合组件 (Composites)

### 3.1 ProjectCard

项目列表中的卡片。

**组成**：Card + Badge + StatusDot + Button

**Props**：

```typescript
interface ProjectCardProps {
  project: Project
  activeVersion?: Version
  onOpen: () => void
  onOpenInEditor: () => void
}
```

**结构**：

```
┌─────────────────────────────────────────────────┐
│  Kindle → Anki                        v2.0     │
│                                                 │
│  Development         │  Runtime                │
│  ● Completed         │  ⏰ Scheduled: 9am      │
│                      │  Last: 2h ago ✓         │
│                                                 │
│  [Iterate] [VSCode]  │  [Run Now] [Dashboard]  │
└─────────────────────────────────────────────────┘
```

---

### 3.2 TaskItem

单个任务项。

**Props**：

```typescript
interface TaskItemProps {
  task: Task
  isCurrent?: boolean     // 当前执行中
  onClick?: () => void
}
```

**结构**：

```
○  001. 初始化项目结构
   └─ Depends: none

●  002. 创建基础组件          ← 当前任务（amber 背景）
   └─ Depends: 001

✓  003. 实现路由              ← 已完成（绿色勾）
   └─ Depends: 001, 002
```

**状态图标**：

| 状态 | 图标 |
|------|------|
| pending | 空心圆 ○ |
| running | amber spinner ● |
| completed | 绿色勾 ✓ |
| failed | 红色叉 ✗ |
| skipped | 灰色横线 — |

---

### 3.3 TaskList

任务列表，按 Milestone 分组。

**Props**：

```typescript
interface TaskListProps {
  plan: ExecutionPlan
  currentTaskId?: string
  onTaskClick?: (taskId: string) => void
}
```

**结构**：

```
## Milestone 1: Core Setup

  ✓  001. 初始化项目
  ✓  002. 添加依赖
  ●  003. 创建组件         ← 当前
  ○  004. 实现路由

## Milestone 2: Features

  ○  005. 用户认证
  ○  006. 数据存储
```

---

### 3.4 StatCard

Dashboard 指标卡片。

**Props**：

```typescript
interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
}
```

**结构**：

```
┌─────────────┐
│     847     │  ← 大数字，font-light
│ Cards Today │  ← 小标签
└─────────────┘
```

---

### 3.5 LogViewer

日志查看器。

**Props**：

```typescript
interface LogViewerProps {
  logs: string[]
  autoScroll?: boolean    // 自动滚动到底部
  maxLines?: number       // 最大显示行数
}
```

**样式要点**：
- 等宽字体（JetBrains Mono）
- 深色背景 stone-900
- 浅色文字 stone-300
- 自动滚动到最新

---

### 3.6 RunHistoryList

运行历史列表（Runtime 页面用）。

**Props**：

```typescript
interface RunHistoryListProps {
  runs: Run[]
  onSelectRun?: (runId: string) => void
  selectedRunId?: string
}
```

**Run 结构**：

```typescript
interface Run {
  id: string
  triggeredAt: Date
  triggeredBy: 'manual' | 'schedule' | 'startup'
  completedAt?: Date
  status: 'running' | 'success' | 'failed'
  exitCode?: number
}
```

**结构**：

```
┌─────────────────────────────────────────────────┐
│  ● 2024-01-15 09:00    Manual    ✓ Success     │
│  ○ 2024-01-14 21:00    Schedule  ✗ Failed (1)  │
│  ○ 2024-01-14 09:00    Schedule  ✓ Success     │
└─────────────────────────────────────────────────┘
```

**样式要点**：
- 选中项有 amber 背景
- 状态用 StatusDot + Badge 组合
- 时间用 relative format（2h ago）

---

## 四、编辑器组件

### 4.1 MarkdownEditor

简单的 Markdown 编辑器。

**实现**：textarea + 基础样式（MVP 不用 CodeMirror）

**Props**：

```typescript
interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  readOnly?: boolean
}
```

**样式要点**：
- 等宽字体
- 自动增高（根据内容）
- 行号（可选，MVP 不做）

---

### 4.2 MarkdownPreview

Markdown 渲染预览。

**实现**：react-markdown

**Props**：

```typescript
interface MarkdownPreviewProps {
  content: string
}
```

**样式要点**：
- 按 Design System 的字体规范
- 标题、列表、代码块样式
- TODO checkbox 渲染

---

## 五、Review 简化方案

MVP 阶段，Review 页面的 Feedback 功能简化为：

### 5.1 原计划 vs 简化版

| 功能 | 原计划 | MVP 简化版 |
|------|--------|-----------|
| Comment 定位 | 行级锚点 | 整体 comment |
| Suggest Edit | inline 修改建议 | 不做 |
| Direct Edit | 标记 preserve | 直接编辑 textarea |

### 5.2 简化后的 Review 流程

```
┌─────────────────────────────────────────────────────────────┐
│  Review: TODO.md                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ## Milestone 1: Setup                              │   │
│  │                                                     │   │
│  │  - [ ] 001. Initialize project                      │   │
│  │  - [ ] 002. Add dependencies                        │   │
│  │  ...                                                │   │
│  │                                                     │   │
│  │  (可直接编辑)                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💬 Feedback (整体反馈，会影响 Regenerate)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  请把 Milestone 2 拆分得更细...                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                    [Regenerate] [Clear] [Approve]           │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 FeedbackPanel 组件

**Props**：

```typescript
interface FeedbackPanelProps {
  feedback: string
  onChange: (feedback: string) => void
  onRegenerate: () => void
  onClear: () => void
  onApprove: () => void
  loading?: boolean
}
```

---

## 六、组件开发顺序

按依赖关系排序：

### Phase 1：基础组件

```
1. Button
2. Input
3. Spinner
4. Badge
5. StatusDot
6. ProgressBar
7. Card
8. Modal
9. Tabs
```

### Phase 2：组合组件

```
10. TaskItem (依赖 Badge, StatusDot)
11. TaskList (依赖 TaskItem, ProgressBar)
12. ProjectCard (依赖 Card, Badge, StatusDot, Button)
13. StatCard (依赖 Card)
14. LogViewer
```

### Phase 3：编辑器组件

```
15. MarkdownEditor
16. MarkdownPreview
17. FeedbackPanel (依赖 MarkdownEditor, Button)
```

---

## 七、Checklist

| 检查项 | 说明 |
|--------|------|
| 遵循 Design System | 颜色、间距、圆角、字体 |
| Props 类型完整 | 所有 Props 有 TypeScript 定义 |
| 支持 className 透传 | 允许外部覆盖样式 |
| 可访问性 | 按钮有 aria-label，Modal 有焦点管理 |
| 响应式 | 基本的移动端适配（Electron 可能不需要） |
