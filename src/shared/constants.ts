/**
 * Shared constants and status enums
 */

/**
 * Development flow status
 * Matches state machine definition in config/state-machines/dev-flow.yaml
 */
export type DevStatus =
  | 'drafting' // Writing spec
  | 'scaffolding' // AI generating TODO.md
  | 'reviewing' // User reviewing TODO.md
  | 'ready' // Approved, ready to execute
  | 'executing' // Generating code
  | 'paused' // Execution paused
  | 'completed' // Development complete
  | 'error' // Error occurred

/**
 * Runtime flow status
 * Matches state machine definition in config/state-machines/runtime-flow.yaml
 */
export type RuntimeStatus =
  | 'not_configured' // Runtime not set up
  | 'idle' // Configured, waiting for trigger
  | 'running' // Currently running
  | 'success' // Last run succeeded
  | 'failed' // Last run failed

/**
 * IPC Error codes
 * Used for structured error handling between main and renderer
 */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE: 'DUPLICATE',
  CLAUDE_UNAVAILABLE: 'CLAUDE_UNAVAILABLE',
  CLAUDE_TIMEOUT: 'CLAUDE_TIMEOUT',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  // GitHub errors
  GITHUB_NOT_AUTHENTICATED: 'GITHUB_NOT_AUTHENTICATED',
  GITHUB_CLI_NOT_FOUND: 'GITHUB_CLI_NOT_FOUND',
  GITHUB_REPO_EXISTS: 'GITHUB_REPO_EXISTS',
  GITHUB_OPERATION_FAILED: 'GITHUB_OPERATION_FAILED',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

/**
 * Default application settings
 */
export const DEFAULT_SETTINGS = {
  projectsLocation: '~/Projects',
  cloneRoot: '~/Projects', // GitHub clone root directory
  initGit: true,
  autoCommitOnMilestone: true,
  autoPush: false,
  defaultEditor: 'code',
} as const

/**
 * App metadata
 */
export const APP_NAME = 'Forge'
export const APP_ID = 'com.forge.app'
