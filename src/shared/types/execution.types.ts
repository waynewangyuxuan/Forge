/**
 * Execution and Task types
 * These represent the code generation process
 */

/**
 * Execution status for a code generation run
 */
export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'aborted'

/**
 * Task attempt status
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

/**
 * An execution record - one run of code generation for a version
 */
export interface Execution {
  id: string
  versionId: string
  startedAt: string // ISO 8601
  completedAt: string | null
  status: ExecutionStatus
  totalTasks: number
  completedTasks: number
  currentTaskId: string | null
}

/**
 * A task attempt record - one attempt at executing a single task
 */
export interface TaskAttempt {
  id: string
  executionId: string
  taskId: string // Task ID from TODO.md (e.g., "001")
  attemptNumber: number
  startedAt: string
  completedAt: string | null
  status: TaskStatus
  errorMessage: string | null
}

/**
 * Parsed task from TODO.md
 */
export interface Task {
  id: string // e.g., "001"
  description: string
  completed: boolean
  milestone?: string
}

/**
 * Parsed execution plan from TODO.md
 */
export interface ExecutionPlan {
  tasks: Task[]
  milestones: string[]
  totalTasks: number
  completedTasks: number
}

/**
 * Real-time execution progress
 */
export interface ExecutionProgress {
  executionId: string
  completed: number
  total: number
  percent: number
  currentTaskId?: string
  currentTaskDescription?: string
}
