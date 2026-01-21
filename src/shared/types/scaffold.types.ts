/**
 * Scaffold generation types
 * Defines the structure of AI-generated scaffold output and validation results
 */

/**
 * A single task within a milestone
 */
export interface ScaffoldTask {
  id: string // Global unique ID, e.g., "001", "002"
  title: string // Short title for TODO.md index
  description: string // Detailed description of what to do
  verification: string // How to verify task completion
  depends: string[] // Task IDs this task depends on, e.g., ["001", "002"]
}

/**
 * A milestone containing multiple tasks
 */
export interface ScaffoldMilestone {
  id: string // e.g., "M1", "M2"
  name: string // e.g., "Project Setup"
  description: string // Why this milestone exists
  tasks: ScaffoldTask[]
}

/**
 * Context information extracted from spec files
 */
export interface ScaffoldContext {
  architecture: string // Key architectural decisions
  conventions: string // Code style, naming conventions
}

/**
 * The complete scaffold output structure (JSON from AI)
 */
export interface ScaffoldOutput {
  project: {
    name: string
    description: string
  }
  context: ScaffoldContext
  milestones: ScaffoldMilestone[]
}

/**
 * Validation error for a specific field or task
 */
export interface ScaffoldValidationError {
  code: ScaffoldValidationErrorCode
  message: string
  path?: string // Path to the invalid field, e.g., "milestones[0].tasks[1].depends"
  taskId?: string // Task ID if error is task-specific
}

/**
 * Validation error codes
 */
export type ScaffoldValidationErrorCode =
  | 'INVALID_JSON'
  | 'MISSING_FIELD'
  | 'INVALID_TYPE'
  | 'INVALID_TASK_ID'
  | 'DUPLICATE_TASK_ID'
  | 'DUPLICATE_MILESTONE_ID'
  | 'INVALID_DEPENDENCY'
  | 'CIRCULAR_DEPENDENCY'
  | 'EMPTY_MILESTONES'
  | 'EMPTY_TASKS'

/**
 * Result of scaffold validation
 */
export interface ScaffoldValidationResult {
  valid: boolean
  errors: ScaffoldValidationError[]
}

/**
 * Input for scaffold generation
 */
export interface GenerateScaffoldInput {
  versionId: string
}

/**
 * Phases of scaffold generation
 */
export type ScaffoldPhase =
  | 'reading_specs' // Reading PRODUCT.md, TECHNICAL.md, etc.
  | 'generating' // Calling Claude AI
  | 'parsing' // Parsing AI output
  | 'validating' // Validating scaffold structure
  | 'writing_files' // Writing TODO.md, MILESTONES/*.md, etc.
  | 'completed' // Done
  | 'error' // Error occurred

/**
 * Result of scaffold generation
 */
export interface GenerateScaffoldResult {
  success: boolean
  scaffold?: ScaffoldOutput
  filesWritten?: string[] // List of files written
  error?: string
  errorCode?: string // Error code for structured error handling
}
