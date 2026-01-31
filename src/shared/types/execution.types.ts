/**
 * Execution and Task types
 * These represent the code generation process
 */

/**
 * Execution status for a code generation run
 */
export type ExecutionStatus = 'running' | 'paused' | 'completed' | 'failed' | 'aborted'

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
  preExecutionCommit: string | null // Git commit SHA before execution started
  isPaused: boolean // Persisted pause flag
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
 * Parsed task from TODO.md + MILESTONES/*.md
 */
export interface Task {
  id: string // e.g., "001"
  title: string // Short title from TODO.md line
  description?: string // Detailed description from MILESTONES/*.md
  status: TaskStatus // Derived from checkbox state
  milestoneId: string // e.g., "M1"
  depends: string[] // Task IDs this depends on
  verification?: string // How to verify completion
}

/**
 * Milestone containing tasks
 */
export interface Milestone {
  id: string // e.g., "M1"
  name: string // e.g., "Project Setup"
  description?: string
  tasks: Task[]
  completedCount: number
  totalCount: number
}

/**
 * Parsed execution plan from TODO.md + MILESTONES/*.md
 */
export interface ExecutionPlan {
  milestones: Milestone[]
  totalTasks: number
  completedTasks: number
}

/**
 * Feedback for review
 */
export interface Feedback {
  id: string
  versionId: string
  content: string
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
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

/**
 * File change action in structured output
 */
export type FileChangeAction = 'create' | 'update' | 'delete'

/**
 * Single file change from Claude's structured output
 */
export interface FileChange {
  path: string // Relative to project root
  action: FileChangeAction
  content?: string // For create/update
}

/**
 * Claude's structured output for a task
 */
export interface TaskOutput {
  taskId: string
  files: FileChange[]
  summary: string
}
