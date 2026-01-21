# CLAUDE.md

> ⚠️ 执行前必读：本项目按任务逐个执行，请严格遵循下方协议

## 执行协议

### Step 1: 定位当前任务

读取 `META/TODO.md`，找到第一个 `- [ ]` 开头的行。

示例：如果看到 `- [ ] 007. Define Highlight type`
- 当前任务 ID = `007`
- 所属 Milestone = `M2`（根据上方最近的 `## M2:` 标题）

### Step 2: 加载任务详情

**只读取当前任务所属的 Milestone 文件**：

```
META/MILESTONES/M{N}-*.md
```

在该文件中找到 `### {任务ID}.` 部分，阅读：
- **Description**：具体实现内容
- **Verification**：完成标准
- **Depends**：前置任务（应该已完成）

### Step 3: 执行任务

实现任务要求的内容。

**规则**：
- 只做当前任务，不要"顺便"做下一个
- 如果需要架构信息，读 `META/CONTEXT/architecture.md`
- 如果需要代码规范，读 `META/CONTEXT/conventions.md`

### Step 4: 验证

按 **Verification** 中的标准检查：
- 运行测试命令
- 检查文件是否存在
- 确认功能正常

### Step 5: 更新状态 & 提交

1. 编辑 `META/TODO.md`，将当前任务改为 `- [x]`
2. Git commit：`{任务ID}: {任务标题}`
3. **停止**，等待下一次指令

---

## 项目概要

{{project_summary}}

## 技术栈

{{tech_stack}}

## 文件索引

| 文件 | 用途 | 何时读取 |
|------|------|---------|
| `META/TODO.md` | 任务索引 | 每次执行开始 |
| `META/MILESTONES/M*.md` | 任务详情 | 执行当前任务时 |
| `META/CONTEXT/architecture.md` | 架构决策 | 需要时 |
| `META/CONTEXT/conventions.md` | 代码规范 | 需要时 |
| `META/CORE/PRODUCT.md` | 产品定义 | 很少需要 |
| `META/CORE/TECHNICAL.md` | 技术细节 | 很少需要 |
