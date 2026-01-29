/**
 * Todo Parser Engine
 * Parses TODO.md and MILESTONES/*.md files into ExecutionPlan structure
 *
 * Domain engine: Pure functions that parse markdown content
 * File I/O is handled by use cases via IFileSystemAdapter
 */

import type { ExecutionPlan, Milestone, Task, TaskStatus } from '@shared/types/execution.types'

/**
 * Parsed task from TODO.md index (lightweight, no details)
 */
export interface TodoIndexTask {
  id: string
  title: string
  completed: boolean
  milestoneId: string
}

/**
 * Parsed milestone header from TODO.md
 */
export interface TodoIndexMilestone {
  id: string
  name: string
  tasks: TodoIndexTask[]
}

/**
 * Result of parsing TODO.md
 */
export interface TodoIndex {
  projectName?: string
  milestones: TodoIndexMilestone[]
}

/**
 * Parsed task details from MILESTONES/*.md
 */
export interface MilestoneTaskDetail {
  id: string
  title: string
  description: string
  verification: string
  depends: string[]
}

/**
 * Parsed milestone details from MILESTONES/*.md
 */
export interface MilestoneDetail {
  id: string
  name: string
  description: string
  tasks: MilestoneTaskDetail[]
}

/**
 * Parse TODO.md index file
 *
 * Expected format:
 * ```markdown
 * # TODO
 *
 * > Project: my-project
 * > Generated: 2024-01-01T00:00:00.000Z
 *
 * ## M1: Setup
 * - [ ] 001. Initialize project
 * - [x] 002. Add dependencies
 *
 * ## M2: Features
 * - [ ] 003. Implement feature
 * ```
 *
 * @param content - TODO.md file content
 * @returns Parsed todo index
 */
export function parseTodoIndex(content: string): TodoIndex {
  const result: TodoIndex = {
    milestones: [],
  }

  const lines = content.split('\n')
  let currentMilestone: TodoIndexMilestone | null = null

  for (const line of lines) {
    const trimmed = line.trim()

    // Extract project name from metadata
    const projectMatch = trimmed.match(/^>\s*Project:\s*(.+)$/i)
    if (projectMatch) {
      result.projectName = projectMatch[1].trim()
      continue
    }

    // Match milestone header: ## M1: Setup
    const milestoneMatch = trimmed.match(/^##\s+(M\d+):\s*(.+)$/i)
    if (milestoneMatch) {
      currentMilestone = {
        id: milestoneMatch[1].toUpperCase(),
        name: milestoneMatch[2].trim(),
        tasks: [],
      }
      result.milestones.push(currentMilestone)
      continue
    }

    // Match task line: - [ ] 001. Task title or - [x] 002. Done task
    const taskMatch = trimmed.match(/^-\s*\[([ xX])\]\s*(\d+)\.\s*(.+)$/)
    if (taskMatch && currentMilestone) {
      const completed = taskMatch[1].toLowerCase() === 'x'
      currentMilestone.tasks.push({
        id: taskMatch[2],
        title: taskMatch[3].trim(),
        completed,
        milestoneId: currentMilestone.id,
      })
    }
  }

  return result
}

/**
 * Parse MILESTONES/*.md detail file
 *
 * Expected format:
 * ```markdown
 * # M1: Setup
 *
 * > Milestone description
 *
 * ## Tasks
 *
 * ### 001. Task Title
 *
 * **Description:**
 * Detailed description text
 *
 * **Verification:**
 * How to verify completion
 *
 * **Depends:** 001, 002
 *
 * ---
 * ```
 *
 * @param content - MILESTONES/*.md file content
 * @returns Parsed milestone detail
 */
export function parseMilestoneDetail(content: string): MilestoneDetail {
  const result: MilestoneDetail = {
    id: '',
    name: '',
    description: '',
    tasks: [],
  }

  const lines = content.split('\n')
  let currentTask: MilestoneTaskDetail | null = null
  let currentSection: 'none' | 'description' | 'verification' = 'none'
  let sectionBuffer: string[] = []

  function flushSection() {
    if (currentTask && currentSection !== 'none' && sectionBuffer.length > 0) {
      const text = sectionBuffer.join('\n').trim()
      if (currentSection === 'description') {
        currentTask.description = text
      } else if (currentSection === 'verification') {
        currentTask.verification = text
      }
    }
    sectionBuffer = []
    currentSection = 'none'
  }

  function finishTask() {
    flushSection()
    if (currentTask) {
      result.tasks.push(currentTask)
      currentTask = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Match milestone header: # M1: Setup
    const milestoneMatch = trimmed.match(/^#\s+(M\d+):\s*(.+)$/i)
    if (milestoneMatch) {
      result.id = milestoneMatch[1].toUpperCase()
      result.name = milestoneMatch[2].trim()
      continue
    }

    // Match milestone description (blockquote after header)
    if (trimmed.startsWith('>') && !result.description && result.id) {
      result.description = trimmed.replace(/^>\s*/, '').trim()
      continue
    }

    // Match task header: ### 001. Task Title
    const taskMatch = trimmed.match(/^###\s+(\d+)\.\s*(.+)$/)
    if (taskMatch) {
      finishTask()
      currentTask = {
        id: taskMatch[1],
        title: taskMatch[2].trim(),
        description: '',
        verification: '',
        depends: [],
      }
      continue
    }

    // Match section headers
    if (trimmed === '**Description:**') {
      flushSection()
      currentSection = 'description'
      continue
    }

    if (trimmed === '**Verification:**') {
      flushSection()
      currentSection = 'verification'
      continue
    }

    // Match depends line: **Depends:** 001, 002 or **Depends:** none
    const dependsMatch = trimmed.match(/^\*\*Depends:\*\*\s*(.+)$/i)
    if (dependsMatch && currentTask) {
      flushSection()
      const dependsText = dependsMatch[1].trim().toLowerCase()
      if (dependsText !== 'none') {
        currentTask.depends = dependsText
          .split(',')
          .map((d) => d.trim())
          .filter((d) => d.length > 0)
      }
      continue
    }

    // Match task separator
    if (trimmed === '---') {
      finishTask()
      continue
    }

    // Accumulate section content
    if (currentSection !== 'none' && currentTask) {
      sectionBuffer.push(line)
    }
  }

  // Finish any remaining task
  finishTask()

  return result
}

/**
 * Build ExecutionPlan from TodoIndex and MilestoneDetails
 *
 * @param todoIndex - Parsed TODO.md index
 * @param milestoneDetails - Array of parsed MILESTONES/*.md files
 * @returns Complete ExecutionPlan
 */
export function buildExecutionPlan(
  todoIndex: TodoIndex,
  milestoneDetails: MilestoneDetail[]
): ExecutionPlan {
  // Create a lookup map for milestone details
  const detailMap = new Map<string, MilestoneDetail>()
  for (const detail of milestoneDetails) {
    detailMap.set(detail.id, detail)
  }

  // Create a lookup map for task details
  const taskDetailMap = new Map<string, MilestoneTaskDetail>()
  for (const detail of milestoneDetails) {
    for (const task of detail.tasks) {
      taskDetailMap.set(task.id, task)
    }
  }

  const milestones: Milestone[] = []
  let totalTasks = 0
  let completedTasks = 0

  for (const indexMilestone of todoIndex.milestones) {
    const detail = detailMap.get(indexMilestone.id)

    const tasks: Task[] = []
    let milestoneCompleted = 0

    for (const indexTask of indexMilestone.tasks) {
      const taskDetail = taskDetailMap.get(indexTask.id)
      const status: TaskStatus = indexTask.completed ? 'completed' : 'pending'

      tasks.push({
        id: indexTask.id,
        title: indexTask.title,
        description: taskDetail?.description,
        status,
        milestoneId: indexMilestone.id,
        depends: taskDetail?.depends || [],
        verification: taskDetail?.verification,
      })

      totalTasks++
      if (indexTask.completed) {
        completedTasks++
        milestoneCompleted++
      }
    }

    milestones.push({
      id: indexMilestone.id,
      name: indexMilestone.name,
      description: detail?.description,
      tasks,
      completedCount: milestoneCompleted,
      totalCount: tasks.length,
    })
  }

  return {
    milestones,
    totalTasks,
    completedTasks,
  }
}

/**
 * Parse a complete execution plan from TODO.md content and milestone file contents
 *
 * This is a convenience function that combines all parsing steps
 *
 * @param todoContent - Content of TODO.md
 * @param milestoneContents - Array of { filename, content } for each MILESTONES/*.md file
 * @returns Complete ExecutionPlan
 */
export function parseExecutionPlan(
  todoContent: string,
  milestoneContents: Array<{ filename: string; content: string }>
): ExecutionPlan {
  const todoIndex = parseTodoIndex(todoContent)

  const milestoneDetails: MilestoneDetail[] = milestoneContents.map(({ content }) =>
    parseMilestoneDetail(content)
  )

  return buildExecutionPlan(todoIndex, milestoneDetails)
}
