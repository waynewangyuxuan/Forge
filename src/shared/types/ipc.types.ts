/**
 * IPC channel type definitions
 * Defines all invoke channels and their input/output types
 */

import {
  Project,
  Version,
  CreateProjectInput,
  CreateVersionInput,
} from './project.types'
import {
  RuntimeConfigInput,
  Credential,
  AddCredentialInput,
  Settings,
} from './runtime.types'
import {
  GitHubAuthStatus,
  GitHubRepo,
  CreateRepoOptions,
} from './github.types'
import {
  GenerateScaffoldInput,
  GenerateScaffoldResult,
} from './scaffold.types'
import { Execution, ExecutionPlan, Feedback } from './execution.types'
import { ErrorCode, WarningCode } from '../constants'

// ============================================================
// IPC Result Envelope Types
// ============================================================

/**
 * Serialized error for IPC transport
 * Contains structured error information that survives Electron IPC serialization
 */
export interface IPCError {
  code: ErrorCode
  message: string
  name: string
  details?: Record<string, unknown>  // e.g., { scope: 'delete_repo' }
}

/**
 * Structured warning for non-fatal issues
 * Used instead of freeform strings for consistent UI handling
 */
export interface IPCWarning {
  code: WarningCode
  message: string
  details?: Record<string, unknown>
}

/**
 * Result envelope - IPC handlers should return this instead of throwing
 * This ensures error codes and details survive Electron IPC serialization
 */
export type IPCResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: IPCError }

// ============================================================
// Delete Project Types
// ============================================================

/**
 * Delete outcome - what actually happened
 */
export type DeleteOutcome =
  | 'deleted'     // Full delete: DB + optional GitHub/local
  | 'deactivated' // Local files only: project remains, marked inactive
  | 'removed'     // Remove from Forge only: DB deleted, files/GitHub preserved

/**
 * Delete result - returned by project:delete
 */
export interface ProjectDeleteOutput {
  outcome: DeleteOutcome
  project?: Project  // For 'deactivated' - the updated project
  warnings?: IPCWarning[]
}

// Note: These types will be used when implementing additional IPC channels:
// - Execution, ExecutionPlan, ExecutionProgress from './execution.types'
// - RuntimeConfig, Run from './runtime.types'

// ============================================================
// Project Channels
// ============================================================

export interface ProjectListInput {
  includeArchived?: boolean
}

export interface ProjectGetInput {
  id: string
}

export interface ProjectArchiveInput {
  id: string
}

export interface ProjectDeleteInput {
  id: string
  deleteFromGitHub?: boolean
  deleteLocalFiles?: boolean
}

export interface ProjectActivateInput {
  id: string
}

// ============================================================
// Version Channels
// ============================================================

export interface VersionListInput {
  projectId: string
}

export interface VersionGetInput {
  id: string
}

export interface VersionSetActiveInput {
  id: string
}

// ============================================================
// Spec Channels
// ============================================================

export type SpecFile = 'PRODUCT.md' | 'TECHNICAL.md' | 'REGULATION.md'

export interface SpecReadInput {
  versionId: string
  file: SpecFile
}

export interface SpecSaveInput {
  versionId: string
  file: SpecFile
  content: string
}

export interface SpecGenerateScaffoldInput {
  versionId: string
}

// ============================================================
// Review Channels
// ============================================================

export interface ReviewGetTodoInput {
  versionId: string
}

export interface ReviewReadTodoRawInput {
  versionId: string
}

export interface ReviewSaveTodoRawInput {
  versionId: string
  content: string
}

export interface ReviewAddFeedbackInput {
  versionId: string
  feedback: string
}

export interface ReviewClearFeedbackInput {
  versionId: string
}

export interface ReviewRegenerateInput {
  versionId: string
}

export interface ReviewApproveInput {
  versionId: string
}

export interface ReviewGetFeedbackInput {
  versionId: string
}

// ============================================================
// Execution Channels
// ============================================================

export interface ExecutionStartInput {
  versionId: string
  options?: {
    commitStrategy?: 'each_task' | 'each_milestone' | 'manual'
    openInEditor?: boolean
  }
}

export interface ExecutionPauseInput {
  executionId: string
}

export interface ExecutionResumeInput {
  executionId: string
}

export interface ExecutionAbortInput {
  executionId: string
}

export interface ExecutionRetryInput {
  executionId: string
  taskId: string
}

export interface ExecutionSkipInput {
  executionId: string
  taskId: string
}

export interface ExecutionGetStatusInput {
  executionId: string
}

// ============================================================
// Runtime Channels
// ============================================================

export interface RuntimeConfigureInput {
  versionId: string
  config: RuntimeConfigInput
}

export interface RuntimeGetConfigInput {
  versionId: string
}

export interface RuntimeTriggerInput {
  versionId: string
}

export interface RuntimeStopInput {
  versionId: string
}

export interface RuntimeGetStatusInput {
  versionId: string
}

export interface RuntimeGetHistoryInput {
  versionId: string
  limit?: number
}

export interface RuntimeGetLogsInput {
  runId: string
}

// ============================================================
// Dashboard Channels
// ============================================================

export interface DashboardGetConfigInput {
  versionId: string
}

export interface DashboardGetMetricsInput {
  versionId: string
}

// ============================================================
// Credentials Channels
// ============================================================

export interface CredentialsUpdateInput {
  id: string
  value: string
}

export interface CredentialsDeleteInput {
  id: string
}

// ============================================================
// Shell Channels
// ============================================================

export interface ShellOpenInEditorInput {
  path: string
}

export interface ShellOpenFolderInput {
  path: string
}

export interface ShellOpenExternalInput {
  url: string
}

// ============================================================
// System Channels
// ============================================================

export interface SystemSelectFolderInput {
  title?: string
  defaultPath?: string
}

export interface SystemSelectFolderOutput {
  path: string | null
}

export interface SystemCheckClaudeOutput {
  available: boolean
  version?: string
}

export interface SystemAppInfoOutput {
  version: string
  dataPath: string
}

// ============================================================
// Event Payloads
// ============================================================

export interface ScaffoldProgressEvent {
  versionId: string
  message: string
}

export interface ScaffoldCompletedEvent {
  versionId: string
}

export interface ScaffoldErrorEvent {
  versionId: string
  error: string
  errorCode?: string // Error code for structured error handling
}

export interface ExecutionProgressEvent {
  executionId: string
  completed: number
  total: number
  percent: number
}

export interface ExecutionTaskStartEvent {
  executionId: string
  taskId: string
  description: string
}

export interface ExecutionTaskDoneEvent {
  executionId: string
  taskId: string
}

export interface ExecutionTaskFailedEvent {
  executionId: string
  taskId: string
  error: string
}

export interface ExecutionPausedEvent {
  executionId: string
}

export interface ExecutionResumedEvent {
  executionId: string
}

export interface ExecutionBlockedEvent {
  executionId: string
  blockedTaskIds: string[]
}

export interface ExecutionCompletedEvent {
  executionId: string
}

export interface ExecutionErrorEvent {
  executionId: string
  error: string
}

export interface RuntimeStartedEvent {
  runId: string
  versionId: string
}

export interface RuntimeLogEvent {
  runId: string
  line: string
}

export interface RuntimeCompletedEvent {
  runId: string
  status: 'success' | 'failed'
  exitCode?: number
}

export interface FileChangedEvent {
  versionId: string
  file: string
  changeType: 'add' | 'change' | 'unlink'
}

// ============================================================
// GitHub Channels
// ============================================================

export interface GitHubCheckAuthOutput {
  available: boolean
  auth: GitHubAuthStatus
}

export interface GitHubCreateRepoInput {
  name: string
  options?: CreateRepoOptions
}

export interface GitHubCloneRepoInput {
  owner: string
  repo: string
  destPath: string
}

// ============================================================
// IPC Channel Map (for type-safe invoke)
// ============================================================

/**
 * Map of all IPC channels to their input/output types
 * Usage: IPCChannelMap['project:list']['input'] -> ProjectListInput
 */
export interface IPCChannelMap {
  // Project - all return IPCResult<T> for reliable error handling
  'project:list': { input: ProjectListInput; output: IPCResult<Project[]> }
  'project:create': { input: CreateProjectInput; output: IPCResult<Project> }
  'project:get': { input: ProjectGetInput; output: IPCResult<Project | null> }
  'project:archive': { input: ProjectArchiveInput; output: IPCResult<void> }
  'project:delete': { input: ProjectDeleteInput; output: IPCResult<ProjectDeleteOutput> }
  'project:activate': { input: ProjectActivateInput; output: IPCResult<Project> }

  // Version - all return IPCResult<T>
  'version:list': { input: VersionListInput; output: IPCResult<Version[]> }
  'version:get': { input: VersionGetInput; output: IPCResult<Version | null> }
  'version:create': { input: CreateVersionInput; output: IPCResult<Version> }
  'version:setActive': { input: VersionSetActiveInput; output: IPCResult<void> }

  // Spec - all return IPCResult<T>
  'spec:read': { input: SpecReadInput; output: IPCResult<string> }
  'spec:save': { input: SpecSaveInput; output: IPCResult<void> }

  // System - all return IPCResult<T>
  'system:getSettings': { input: void; output: IPCResult<Settings> }
  'system:updateSettings': { input: Partial<Settings>; output: IPCResult<Settings> }
  'system:selectFolder': { input: SystemSelectFolderInput; output: IPCResult<SystemSelectFolderOutput> }
  'system:checkClaude': { input: void; output: IPCResult<SystemCheckClaudeOutput> }
  'system:getAppInfo': { input: void; output: IPCResult<SystemAppInfoOutput> }

  // Credentials - all return IPCResult<T>
  'credentials:list': { input: void; output: IPCResult<Credential[]> }
  'credentials:add': { input: AddCredentialInput; output: IPCResult<Credential> }
  'credentials:update': { input: CredentialsUpdateInput; output: IPCResult<void> }
  'credentials:delete': { input: CredentialsDeleteInput; output: IPCResult<void> }

  // GitHub - all return IPCResult<T>
  'github:checkAuth': { input: void; output: IPCResult<GitHubCheckAuthOutput> }
  'github:createRepo': { input: GitHubCreateRepoInput; output: IPCResult<GitHubRepo> }
  'github:cloneRepo': { input: GitHubCloneRepoInput; output: IPCResult<void> }

  // Scaffold - all return IPCResult<T>
  'scaffold:generate': { input: GenerateScaffoldInput; output: IPCResult<GenerateScaffoldResult> }
  'scaffold:checkClaudeAvailable': { input: void; output: IPCResult<{ available: boolean; version: string | null }> }

  // Review - all return IPCResult<T>
  'review:getTodo': { input: ReviewGetTodoInput; output: IPCResult<ExecutionPlan> }
  'review:readTodoRaw': { input: ReviewReadTodoRawInput; output: IPCResult<string> }
  'review:saveTodoRaw': { input: ReviewSaveTodoRawInput; output: IPCResult<void> }
  'review:getFeedback': { input: ReviewGetFeedbackInput; output: IPCResult<Feedback | null> }
  'review:addFeedback': { input: ReviewAddFeedbackInput; output: IPCResult<Feedback> }
  'review:clearFeedback': { input: ReviewClearFeedbackInput; output: IPCResult<void> }
  'review:regenerate': { input: ReviewRegenerateInput; output: IPCResult<void> }
  'review:approve': { input: ReviewApproveInput; output: IPCResult<Version> }

  // Execution - all return IPCResult<T>
  'execution:start': { input: ExecutionStartInput; output: IPCResult<Execution> }
  'execution:pause': { input: ExecutionPauseInput; output: IPCResult<void> }
  'execution:resume': { input: ExecutionResumeInput; output: IPCResult<void> }
  'execution:abort': { input: ExecutionAbortInput; output: IPCResult<void> }
  'execution:retry': { input: ExecutionRetryInput; output: IPCResult<void> }
  'execution:skip': { input: ExecutionSkipInput; output: IPCResult<void> }
  'execution:getStatus': { input: ExecutionGetStatusInput; output: IPCResult<Execution> }
  'execution:getStale': { input: void; output: IPCResult<Execution[]> }
}

/**
 * Helper type to get input type for a channel
 */
export type IPCInput<T extends keyof IPCChannelMap> = IPCChannelMap[T]['input']

/**
 * Helper type to get output type for a channel
 */
export type IPCOutput<T extends keyof IPCChannelMap> = IPCChannelMap[T]['output']
