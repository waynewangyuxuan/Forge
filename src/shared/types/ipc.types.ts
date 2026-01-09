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
  // Project
  'project:list': { input: ProjectListInput; output: Project[] }
  'project:create': { input: CreateProjectInput; output: Project }
  'project:get': { input: ProjectGetInput; output: Project | null }
  'project:archive': { input: ProjectArchiveInput; output: void }
  'project:delete': { input: ProjectDeleteInput; output: void }

  // Version
  'version:list': { input: VersionListInput; output: Version[] }
  'version:get': { input: VersionGetInput; output: Version | null }
  'version:create': { input: CreateVersionInput; output: Version }
  'version:setActive': { input: VersionSetActiveInput; output: void }

  // System
  'system:getSettings': { input: void; output: Settings }
  'system:updateSettings': { input: Partial<Settings>; output: Settings }
  'system:selectFolder': { input: SystemSelectFolderInput; output: SystemSelectFolderOutput }
  'system:checkClaude': { input: void; output: SystemCheckClaudeOutput }
  'system:getAppInfo': { input: void; output: SystemAppInfoOutput }

  // Credentials
  'credentials:list': { input: void; output: Credential[] }
  'credentials:add': { input: AddCredentialInput; output: Credential }
  'credentials:update': { input: CredentialsUpdateInput; output: void }
  'credentials:delete': { input: CredentialsDeleteInput; output: void }

  // GitHub
  'github:checkAuth': { input: void; output: GitHubCheckAuthOutput }
  'github:createRepo': { input: GitHubCreateRepoInput; output: GitHubRepo }
  'github:cloneRepo': { input: GitHubCloneRepoInput; output: void }
}

/**
 * Helper type to get input type for a channel
 */
export type IPCInput<T extends keyof IPCChannelMap> = IPCChannelMap[T]['input']

/**
 * Helper type to get output type for a channel
 */
export type IPCOutput<T extends keyof IPCChannelMap> = IPCChannelMap[T]['output']
