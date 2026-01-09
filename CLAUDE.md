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

### 3.1 开始 Milestone 前

1. **阅读相关文档**
   - 必读：`PRODUCT.md`、`REGULATION.md`、`FILE-STRUCTURE.md`
   - 根据任务阅读对应模块文档

2. **查看当前 Milestone**
   - `META/MILESTONES/Mx.md`
   - 了解任务上下文和验收标准

3. **分解 TODO 到 Sections**
   - 将 Milestone 交付物分解为逻辑 Sections
   - 每个 Section 包含相关的 feature tasks + tests
   - 更新 `TODO.md` 记录详细分解
   - Section 粒度：可独立完成、可独立测试、可独立 commit

**Section 分解示例：**
```
#### 1. Shared Layer - Types & Interfaces
- [ ] 1.1 Create `shared/types/project.types.ts`
- [ ] 1.2 Create `shared/types/ipc.types.ts`
**Tests:**
- [ ] 1.T1 Unit test for error classes

#### 2. Infrastructure - Database
- [ ] 2.1 Install dependencies
- [ ] 2.2 Create database initialization
**Tests:**
- [ ] 2.T1 Integration test: DB creation
```

> **设计理念**：Section-based 开发模式是 Forge 协调 AI 执行的核心模式。
> 每个 Section 是一个原子工作单元，有明确的输入、输出和验证标准。
> 这个模式同样适用于 Forge 生成的项目 TODO.md 结构。

### 3.2 开发过程中（Section-based）

1. **Section 为单位开发**
   - 完成一个 Section 的所有 tasks + tests
   - Section 内保持专注，避免跨 Section 修改
   - 完成后立即 commit

2. **Section Commit 规范**
   ```
   feat(m1): implement shared layer types and interfaces

   - Add project.types.ts, ipc.types.ts
   - Add repository interfaces
   - Add error classes with serialization
   ```

3. **保持对齐**
   - 时刻对照 `PRODUCT.md` 确保符合产品设计
   - 遵循 `REGULATION.md` 代码规范
   - 文件结构符合 `FILE-STRUCTURE.md`

4. **遇到问题**
   - 创建 GitHub Issue 记录问题
   - 在 Issue 中描述问题、复现步骤、预期行为

5. **发现新任务**
   - 添加到 `TODO.md` 的 "Potential Additional Tasks" 部分
   - 评估是否需要加入当前 Section 或后续处理

### 3.3 完成 Section 后

1. **更新 TODO.md**
   - 勾选 Section 内已完成的 tasks
   - 保留未完成项，添加发现的新任务

2. **Commit Section**
   - 运行 lint 和 typecheck
   - 提交本 Section 的所有改动
   - Push 到远程

### 3.4 完成 Milestone 后

1. **更新 PROGRESS.md**
   - 按 Section 记录完成的工作
   - 格式：日期 + Section 完成内容

2. **更新 Milestone 状态**
   - 勾选 `Mx.md` 中的交付物
   - 更新 `MILESTONES/META.md` 进度表

3. **清理 TODO.md**
   - 归档已完成的 Milestone tasks
   - 将 Potential Tasks 评估后移入下个 Milestone

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

### Section 完成自检：

- [ ] Section 内所有 tasks 完成？
- [ ] Section 内所有 tests 通过？
- [ ] 代码符合 `REGULATION.md`？
- [ ] 文件位置符合 `FILE-STRUCTURE.md`？
- [ ] Lint 和 TypeCheck 通过？
- [ ] 已 commit 并 push？

### Milestone 完成自检：

- [ ] 所有 Sections 完成并 committed？
- [ ] 验收标准全部满足？
- [ ] `PROGRESS.md` 已更新？
- [ ] `Mx.md` 交付物已勾选？
- [ ] `MILESTONES/META.md` 进度表已更新？
- [ ] 发现的新任务已记录到 `TODO.md`？
