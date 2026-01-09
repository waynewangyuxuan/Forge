/**
 * Runtime configuration and run types
 * These represent how a completed project is executed
 */

/**
 * Trigger type for runtime execution
 */
export type TriggerType = 'manual' | 'schedule' | 'always_running'

/**
 * Run status
 */
export type RunStatus = 'running' | 'success' | 'failed'

/**
 * How the run was triggered
 */
export type TriggeredBy = 'manual' | 'schedule' | 'startup'

/**
 * Credential reference - how to resolve a credential value
 */
export type CredentialRef =
  | { type: 'global'; nickname: string }
  | { type: 'project'; value: string }

/**
 * Runtime configuration for a version
 */
export interface RuntimeConfig {
  versionId: string
  triggerType: TriggerType
  cronExpression: string | null // Required when triggerType = 'schedule'
  credentials: Record<string, CredentialRef> // ENV_NAME -> CredentialRef
  updatedAt: string
}

/**
 * A run record - one execution of run.sh
 */
export interface Run {
  id: string
  versionId: string
  triggeredAt: string
  triggeredBy: TriggeredBy
  completedAt: string | null
  status: RunStatus
  exitCode: number | null
  logPath: string | null
}

/**
 * Global credential stored in system keychain
 */
export interface Credential {
  id: string
  nickname: string
  type: string // e.g., "NOTION_API", "GITHUB_TOKEN"
  createdAt: string
  // Note: value is stored in system keychain, not in this object
}

/**
 * Input for adding a credential
 */
export interface AddCredentialInput {
  nickname: string
  type: string
  value: string
}

/**
 * Input for configuring runtime
 */
export interface RuntimeConfigInput {
  triggerType: TriggerType
  cronExpression?: string
  credentials: Record<string, CredentialRef>
}

/**
 * Application settings
 */
export interface Settings {
  projectsLocation: string // Default location for new projects
  cloneRoot: string // GitHub clone root directory
  initGit: boolean
  autoCommitOnMilestone: boolean
  autoPush: boolean
  defaultEditor: string // e.g., "code" for VSCode
}
