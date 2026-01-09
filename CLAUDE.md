# CLAUDE.md

> **项目入口文档** - Claude Code 开发本项目的核心指引

---

## 一、项目概述

**Forge** 是一个 Electron 桌面应用，通过 AI 将自然语言 Spec 转化为完整可运行的项目。

核心流程：`Spec → Scaffold → Review → Execute → Run → Dashboard`

---

## 二、文档结构

所有设计文档位于 `META/` 目录：

```
META/
├── META.md                    # 文档索引
├── FILE-STRUCTURE.md          # 【必读】文件结构 Single Source of Truth
├── PROGRESS.md                # 进度记录（开发时高频更新）
├── TODO.md                    # 待办事项（开发时高频查看）
│
├── CORE/                      # 产品定义
│   ├── PRODUCT.md             # 【必读】产品规格 - 做什么、为什么
│   └── REGULATION.md          # 【必读】开发规范 - 代码风格、约定
│
├── FRONTEND/                  # 前端架构
│   ├── FRONTEND.md            # 状态管理、数据流
│   ├── PAGES.md               # 页面设计
│   └── COMPONENTS.md          # 组件库
│
├── BACKEND/                   # 后端架构
│   ├── OVERVIEW.md            # 分层架构、Use Cases 清单
│   ├── DOMAIN.md              # Domain 层设计
│   ├── DATA-MODEL.md          # 数据模型、SQLite Schema
│   ├── INTERFACES.md          # 接口定义
│   └── CONFIG-DRIVEN.md       # 配置驱动设计
│
├── IPC/                       # 前后端通信
│   └── IPC.md                 # IPC 通道定义
│
└── MILESTONES/                # 开发里程碑
    ├── META.md                # 里程碑索引
    ├── M0.md ~ M9.md          # 各阶段详细任务
```

---

## 三、开发流程

### 3.1 开始任务前

1. **阅读相关文档**
   - 必读：`PRODUCT.md`、`REGULATION.md`、`FILE-STRUCTURE.md`
   - 根据任务阅读对应模块文档

2. **查看 TODO.md**
   - 确认当前任务
   - 检查是否有阻塞项

3. **查看当前 Milestone**
   - `META/MILESTONES/Mx.md`
   - 了解任务上下文和验收标准

### 3.2 开发过程中

1. **高频 Commit**
   - 每完成一个小功能就 commit
   - Commit message 清晰描述改动

2. **保持对齐**
   - 时刻对照 `PRODUCT.md` 确保符合产品设计
   - 遵循 `REGULATION.md` 代码规范
   - 文件结构符合 `FILE-STRUCTURE.md`

3. **遇到问题**
   - 创建 GitHub Issue 记录问题
   - 在 Issue 中描述问题、复现步骤、预期行为

4. **发现新任务**
   - 添加到 `TODO.md`
   - 格式：日期 + 任务描述

### 3.3 完成任务后

1. **更新 PROGRESS.md**
   - 记录完成的工作
   - 格式：日期 + 完成内容

2. **更新 Milestone 状态**
   - 勾选已完成的交付物
   - 更新 `MILESTONES/META.md` 进度表

3. **检查 TODO.md**
   - 移除已完成项
   - 确认下一步任务

---

## 四、关键约定

### 4.1 代码组织

```
src/
├── main/           # 后端 - Electron Main Process
│   ├── domain/     # 纯业务逻辑，零外部依赖
│   ├── application/# Use Cases，编排逻辑
│   └── infrastructure/  # 适配器、Repository、IPC
│
├── renderer/       # 前端 - React
│   ├── stores/     # Zustand 状态管理
│   ├── pages/      # 页面组件
│   └── components/ # 通用组件
│
├── shared/         # 前后端共享
│   ├── types/      # 类型定义
│   └── interfaces/ # 接口定义
│
└── preload/        # Electron Preload
```

### 4.2 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件 | kebab-case | `create-project.ts` |
| 类/接口 | PascalCase | `ProjectRepository` |
| 函数/变量 | camelCase | `createProject` |
| IPC 通道 | domain:action | `project:create` |

### 4.3 提交规范

```
<type>: <description>

type:
- feat: 新功能
- fix: 修复
- refactor: 重构
- docs: 文档
- chore: 杂项
```

---

## 五、快速参考

### 常用文档链接

| 需求 | 文档 |
|------|------|
| 产品功能理解 | [PRODUCT.md](META/CORE/PRODUCT.md) |
| 代码规范查询 | [REGULATION.md](META/CORE/REGULATION.md) |
| 文件放哪里 | [FILE-STRUCTURE.md](META/FILE-STRUCTURE.md) |
| 前端状态设计 | [FRONTEND.md](META/FRONTEND/FRONTEND.md) |
| 后端架构理解 | [OVERVIEW.md](META/BACKEND/OVERVIEW.md) |
| IPC 接口查询 | [IPC.md](META/IPC/IPC.md) |
| 当前任务 | [TODO.md](META/TODO.md) |
| 进度记录 | [PROGRESS.md](META/PROGRESS.md) |

### 状态机

**开发流 (DevStatus)**:
```
drafting → scaffolding → reviewing → ready → executing → completed
                                        ↓
                                      paused / error
```

**运行流 (RuntimeStatus)**:
```
idle → running → success/failed
         ↓
       stopped
```

---

## 六、检查清单

开发时定期自检：

- [ ] 代码是否符合 `REGULATION.md`？
- [ ] 文件位置是否符合 `FILE-STRUCTURE.md`？
- [ ] 功能是否符合 `PRODUCT.md` 定义？
- [ ] 是否及时更新 `PROGRESS.md`？
- [ ] 是否有遗漏任务需要加入 `TODO.md`？
- [ ] 遇到问题是否创建了 GitHub Issue？
- [ ] 是否保持高频 commit？
