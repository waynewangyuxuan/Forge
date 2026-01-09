# Forge Design System

> **美学方向**：Warm Industrial — 温暖、专注、crafted
> **核心原则**：清晰、不 intimidating、好用

---

## 1. 设计原则

### 1.1 Calm Confidence（沉稳自信）
- 不需要闪烁的动画证明"AI 在工作"
- 进度展示要像工匠在干活——稳定、可预测
- 颜色克制，只在关键状态用强调色

### 1.2 Progressive Disclosure（渐进展示）
- 默认界面极简，复杂选项藏起来
- 操作按钮 hover 时才显示
- 高级设置折叠，需要时展开

### 1.3 Tangible Progress（可触摸的进度）
- 每一步都有明确的"产出物"感
- 不是抽象的 loading，而是"任务正在执行"
- 完成时有"东西落地"的满足感

---

## 2. 色彩系统

### 2.1 基础色板

| 用途 | 色值 | CSS 变量 | 说明 |
|-----|------|---------|------|
| **Background** | `#faf9f7` | `--bg-base` | 暖白，主背景 |
| **Surface** | `#ffffff` | `--bg-surface` | 纯白，卡片/面板 |
| **Muted** | `#f5f5f4` | `--bg-muted` | 浅灰，次级区域/按钮 |
| **Border** | `#e5e5e5` | `--border-default` | 默认边框 |
| **Border Light** | `#f0f0f0` | `--border-light` | 分割线 |

### 2.2 文字色

| 用途 | 色值 | CSS 变量 | 说明 |
|-----|------|---------|------|
| **Primary** | `#1a1a1a` | `--text-primary` | 主文字 |
| **Secondary** | `#525252` | `--text-secondary` | 次要文字 |
| **Tertiary** | `#737373` | `--text-tertiary` | 辅助文字 |
| **Muted** | `#a3a3a3` | `--text-muted` | 最弱文字/placeholder |

### 2.3 强调色

| 用途 | 色值 | CSS 变量 | 说明 |
|-----|------|---------|------|
| **Accent** | `#f59e0b` | `--accent` | 琥珀色，品牌主色 |
| **Accent Dark** | `#d97706` | `--accent-dark` | 深琥珀，hover 状态 |
| **Accent Light** | `#fef3c7` | `--accent-light` | 浅琥珀，背景高亮 |

### 2.4 语义色

| 状态 | 前景色 | 背景色 | 边框色 |
|-----|-------|-------|-------|
| **Success** | `#16a34a` | `#f0fdf4` (green-50) | `#bbf7d0` (green-200) |
| **Error** | `#dc2626` | `#fef2f2` (red-50) | `#fecaca` (red-200) |
| **Warning** | `#d97706` | `#fffbeb` (amber-50) | `#fde68a` (amber-200) |
| **Info** | `#2563eb` | `#eff6ff` (blue-50) | `#bfdbfe` (blue-200) |

### 2.5 渐变

```css
/* Primary Gradient - 用于主按钮、Logo */
--gradient-primary: linear-gradient(to right, #f59e0b, #ea580c);

/* Progress Bar */
--gradient-progress: linear-gradient(to right, #f59e0b, #f97316);
```

---

## 3. 字体系统

### 3.1 字体家族

```css
/* 主字体 - 用于标题和正文 */
--font-sans: 'DM Sans', system-ui, -apple-system, sans-serif;

/* 等宽字体 - 用于代码、任务编号、路径 */
--font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
```

### 3.2 字体大小

| 名称 | 大小 | 行高 | 用途 |
|-----|-----|-----|-----|
| `text-xs` | 12px | 16px | 标签、提示、辅助信息 |
| `text-sm` | 14px | 20px | 正文、按钮、列表项 |
| `text-base` | 15px | 24px | Markdown 正文 |
| `text-lg` | 18px | 28px | 页面标题、项目名 |
| `text-xl` | 20px | 28px | 卡片标题 |
| `text-2xl` | 24px | 32px | 大标题 |
| `text-3xl` | 30px | 36px | 指标数字 |
| `text-4xl` | 36px | 40px | Hero 标题 |

### 3.3 字重

| 名称 | 值 | 用途 |
|-----|---|-----|
| `font-light` | 300 | 大标题、指标数字 |
| `font-normal` | 400 | 正文 |
| `font-medium` | 500 | 按钮、标签、强调文字 |

### 3.4 特殊文字样式

```css
/* 页面标题 */
.page-title {
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.01em;
}

/* Section 标签 */
.section-label {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--text-muted);
}

/* 任务编号 */
.task-id {
  font-family: var(--font-mono);
  font-size: 14px;
}
```

---

## 4. 间距系统

### 4.1 基础间距

基于 4px 网格：

| 名称 | 值 | 用途 |
|-----|---|-----|
| `space-1` | 4px | 图标与文字间距 |
| `space-2` | 8px | 紧凑元素间距 |
| `space-3` | 12px | 列表项内间距 |
| `space-4` | 16px | 组件内间距 |
| `space-5` | 20px | 卡片内边距 |
| `space-6` | 24px | 大卡片内边距、section 间距 |
| `space-8` | 32px | 页面区块间距 |
| `space-12` | 48px | 大区块间距 |
| `space-16` | 64px | 页面顶部/底部边距 |

### 4.2 组件间距规范

```
页面布局:
├── 顶栏高度: 56px (h-14)
├── 页面内边距: 24px (p-6)
├── 最大内容宽度: 800px - 1100px
└── 区块间距: 24px (space-y-6)

卡片:
├── 外边距: 16px (gap-4)
├── 内边距: 24px (p-6)
├── 头部内边距: 16px 24px (px-6 py-4)
└── 列表项内边距: 12px 24px (px-6 py-3)
```

---

## 5. 圆角系统

| 名称 | 值 | 用途 |
|-----|---|-----|
| `rounded` | 4px | 小元素、badge |
| `rounded-lg` | 8px | 按钮、输入框 |
| `rounded-xl` | 12px | 小卡片、弹窗内容区 |
| `rounded-2xl` | 16px | 主卡片、面板 |
| `rounded-full` | 9999px | 圆形按钮、状态点、pill |

---

## 6. 阴影系统

```css
/* 轻阴影 - 卡片默认 */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);

/* 中阴影 - 卡片 hover */
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

/* 大阴影 - 弹窗 */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

/* 品牌阴影 - Primary 按钮 */
--shadow-amber: 0 4px 14px -3px rgb(245 158 11 / 0.25);
```

---

## 7. 组件规范

### 7.1 按钮

#### Primary Button
```
背景: gradient-primary
文字: white
圆角: rounded-lg (8px)
内边距: 10px 20px (py-2.5 px-5)
字体: 14px medium
阴影: shadow-amber
Hover: scale(1.02) + shadow 加深
```

#### Secondary Button
```
背景: #f5f5f4
文字: #525252
圆角: rounded-lg
内边距: 10px 20px
字体: 14px medium
边框: none
Hover: 背景 #e5e5e5
```

#### Ghost Button
```
背景: transparent
文字: #f59e0b (accent)
圆角: rounded-lg
内边距: 10px 20px
Hover: 背景 amber-50
```

#### Destructive Button
```
背景: red-50
文字: red-600
圆角: rounded-lg
内边距: 10px 20px
Hover: 背景 red-100
```

#### Icon Button
```
大小: 32px x 32px 或 36px x 36px
圆角: rounded-lg
内边距: 8px
Hover: 背景 #f5f5f4
```

### 7.2 输入框

```
背景: white
边框: 1px solid #e5e5e5
圆角: rounded-xl (12px)
内边距: 12px 16px
字体: 14px (正常) 或 mono (代码输入)
Focus: border-amber-400 + ring-2 ring-amber-100
Placeholder: #a3a3a3
```

### 7.3 卡片

```
背景: white
边框: 1px solid #e5e5e5
圆角: rounded-2xl (16px)
阴影: shadow-sm
内边距: 24px (内容区)

Header:
  背景: #fafafa
  边框: border-b border-[#f0f0f0]
  内边距: 16px 24px
```

### 7.4 状态 Badge

| 状态 | 背景 | 文字 | 边框 |
|-----|-----|-----|-----|
| executing | amber-50 | amber-700 | amber-200 |
| paused | gray-100 | gray-600 | gray-200 |
| completed | green-50 | green-700 | green-200 |
| error | red-50 | red-700 | red-200 |
| scheduled | blue-50 | blue-700 | blue-200 |

```
圆角: rounded (4px) 或 rounded-full (pill)
内边距: 2px 8px
字体: 12px mono
```

### 7.5 状态指示点

```
大小: 8px (w-2 h-2)
圆角: rounded-full
动画: animate-pulse (执行中)

颜色:
  - 执行中: bg-amber-500
  - 成功: bg-green-500
  - 错误: bg-red-500
  - 暂停: bg-gray-400
```

### 7.6 进度条

```
轨道:
  高度: 8px (默认) 或 6px (紧凑)
  背景: #f0f0f0
  圆角: rounded-full

填充:
  背景: gradient-progress
  圆角: rounded-full
  动画: shimmer (执行中)
```

### 7.7 任务列表项

```
布局: flex items-center gap-4
内边距: 12px 24px
边框: border-b border-[#f5f5f5]

当前任务:
  背景: amber-50/50

图标:
  Done: 绿色小勾 (w-4 h-4)
  Current: amber spinner (w-4 h-4)
  Pending: 空心圆 border-[#d4d4d4]
```

### 7.8 弹窗 Modal

```
遮罩: bg-black/20 backdrop-blur-sm
容器:
  背景: white
  圆角: rounded-2xl
  阴影: shadow-xl
  宽度: 480px (默认)
  边框: 1px solid #e5e5e5

Header:
  内边距: 16px 24px
  边框: border-b border-[#f0f0f0]
  
Footer:
  内边距: 16px 24px
  背景: #fafafa
  边框: border-t border-[#f0f0f0]
```

---

## 8. 图标

### 8.1 图标规格

| 场景 | 大小 | stroke-width |
|-----|-----|-------------|
| 按钮内 | 14-16px | 2 |
| 列表项 | 14-16px | 2 |
| 状态图标 | 12px | 2.5-3 |
| 导航 | 20px | 2 |
| 大图标 | 24-28px | 1.5-2 |

### 8.2 常用图标

使用 Lucide Icons 或手绘 SVG，保持线条风格一致。

```
导航: arrow-left, chevron-right, chevron-left
操作: plus, edit, trash, copy, external-link
状态: check, x, alert-circle, clock
编辑器: code, file-text, folder
工具: github, vscode (自定义)
```

---

## 9. 动画

### 9.1 过渡

```css
/* 默认过渡 */
transition: all 0.2s ease;

/* 颜色/背景过渡 */
transition: colors 0.15s ease;

/* 位移/缩放过渡 */
transition: transform 0.3s ease;
```

### 9.2 关键帧动画

```css
/* Spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}

/* Pulse (状态点) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

/* Shimmer (进度条) */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
.animate-shimmer {
  animation: shimmer 2s infinite;
}
```

### 9.3 交互动画

```css
/* 按钮 hover */
.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-amber-lg);
}

/* 卡片 hover */
.card:hover {
  border-color: #d4d4d4;
  box-shadow: var(--shadow-md);
}

/* 操作按钮淡入 */
.card .actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}
.card:hover .actions {
  opacity: 1;
}
```

---

## 10. 响应式断点

| 名称 | 宽度 | 用途 |
|-----|-----|-----|
| `sm` | 640px | 移动端 |
| `md` | 768px | 平板 |
| `lg` | 1024px | 桌面 |
| `xl` | 1280px | 大桌面 |

### 内容最大宽度

| 页面类型 | 最大宽度 |
|---------|---------|
| 编辑器页面 | 1400px |
| 列表/详情页 | 1100px |
| 聚焦页面（执行进度） | 800px |
| 弹窗 | 480px |

---

## 11. 页面模板

### 11.1 标准页面结构

```
┌─────────────────────────────────────────────────────────────┐
│  Header (sticky, h-14, bg-white/80 backdrop-blur)           │
│  ├── 返回按钮                                                │
│  ├── Logo + 项目名 + 状态 Badge                              │
│  └── 操作按钮                                                │
├─────────────────────────────────────────────────────────────┤
│  Tab Bar (optional, border-b)                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Content (max-w-[xxx] mx-auto p-6)                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Card                                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 主次布局

```
┌──────────────────────────────────┬──────────────┐
│                                  │              │
│  Main Content (flex-1)           │  Sidebar     │
│                                  │  (w-72)      │
│                                  │  (sticky)    │
│                                  │              │
└──────────────────────────────────┴──────────────┘
```

---

## 12. Checklist

开发时参考此 checklist 确保一致性：

### 颜色
- [ ] 背景使用 `#faf9f7`，卡片使用 `#ffffff`
- [ ] 文字层级使用 primary → secondary → tertiary → muted
- [ ] 强调色只用 amber，不引入其他亮色
- [ ] 语义色（成功/错误）使用规定色值

### 字体
- [ ] 正文使用 DM Sans
- [ ] 代码/路径/任务编号使用 monospace
- [ ] 大标题使用 font-light

### 间距
- [ ] 遵循 4px 网格
- [ ] 卡片内边距 24px
- [ ] 区块间距 24px

### 组件
- [ ] 按钮圆角 8px，卡片圆角 16px
- [ ] Primary 按钮使用渐变 + amber 阴影
- [ ] 状态点使用 8px 圆形
- [ ] 执行中状态有 shimmer 或 pulse 动画

### 交互
- [ ] 过渡时间 0.2-0.3s
- [ ] 卡片 hover 有边框和阴影变化
- [ ] 操作按钮 hover 时才显示

---

*Forge Design System v1.0*
