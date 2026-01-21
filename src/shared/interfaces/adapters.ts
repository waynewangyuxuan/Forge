/**
 * Adapter interfaces
 * These abstract external system interactions
 */

/**
 * File system adapter interface
 */
export interface IFileSystemAdapter {
  // Read operations
  readFile(path: string): Promise<string>
  readDir(path: string): Promise<string[]>
  exists(path: string): Promise<boolean>
  isDirectory(path: string): Promise<boolean>

  // Write operations
  writeFile(path: string, content: string): Promise<void>
  createDir(path: string, recursive?: boolean): Promise<void>
  copyDir(src: string, dest: string): Promise<void>

  // Delete operations
  remove(path: string): Promise<void>

  // Watch operations
  watch(path: string, callback: (event: FileChangeEvent) => void): WatchHandle
}

export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink'
  path: string
}

export interface WatchHandle {
  stop(): void
}

/**
 * Claude CLI adapter interface
 */
export interface IClaudeAdapter {
  // Execute prompt and get result
  execute(options: ClaudeExecuteOptions): Promise<ClaudeResult>

  // Execute with streaming output
  executeStream(options: ClaudeExecuteOptions): AsyncIterable<ClaudeStreamChunk>

  // Check if Claude CLI is available
  isAvailable(): Promise<boolean>

  // Get Claude CLI version
  getVersion(): Promise<string | null>

  // Abort running execution
  abort(sessionId: string): Promise<void>
}

export interface ClaudeExecuteOptions {
  prompt: string
  workingDirectory: string
  allowedTools?: string[] // e.g., ['Read', 'Write', 'Bash']
  timeout?: number // seconds
  sessionId?: string // for tracking and aborting
}

export interface ClaudeResult {
  success: boolean
  output: string
  error?: string
  exitCode: number
}

export interface ClaudeStreamChunk {
  type: 'stdout' | 'stderr' | 'status'
  content: string
}

/**
 * Scheduler adapter interface for cron jobs
 */
export interface ISchedulerAdapter {
  // Schedule a job
  schedule(id: string, cron: string, callback: () => Promise<void>): void

  // Cancel a job
  cancel(id: string): void

  // Get all scheduled jobs
  getScheduled(): ScheduledTask[]

  // Get next run time for a job
  getNextRun(id: string): Date | null
}

export interface ScheduledTask {
  id: string
  cron: string
  nextRun: Date
}

/**
 * Credential store adapter interface (system keychain)
 */
export interface ICredentialStore {
  // Store a credential
  set(nickname: string, value: string): Promise<void>

  // Get a credential value
  get(nickname: string): Promise<string | null>

  // Delete a credential
  delete(nickname: string): Promise<void>

  // Check if credential exists
  has(nickname: string): Promise<boolean>
}

/**
 * Git repository status
 */
export interface GitStatus {
  staged: string[]
  unstaged: string[]
  untracked: string[]
  deleted: string[]
  branch: string
  ahead: number
  behind: number
}

/**
 * Result of a git hook execution
 */
export interface GitHookResult {
  success: boolean
  commitHash?: string
  pushed?: boolean
  pushFailed?: boolean
  pushError?: string
  error?: string
  skipped?: boolean
  skippedReason?: string
}

/**
 * Git adapter interface
 */
export interface IGitAdapter {
  // Repository operations
  init(path: string): Promise<void>
  isRepo(path: string): Promise<boolean>

  // Status and staging
  status(path: string): Promise<GitStatus>
  add(path: string, files: string[]): Promise<void>

  // Commit and push
  commit(path: string, message: string): Promise<string> // returns commit hash
  push(path: string, remote?: string): Promise<void>

  // Branch operations
  createBranch(path: string, branch: string): Promise<void>
  checkout(path: string, branch: string): Promise<void>
  getCurrentBranch(path: string): Promise<string>

  // Remote operations
  hasRemote(path: string): Promise<boolean>
  getRemoteUrl(path: string): Promise<string | null>
}

/**
 * GitHub adapter interface (uses gh CLI)
 */
export interface IGitHubAdapter {
  // CLI status
  isAvailable(): Promise<boolean>

  // Authentication
  checkAuth(): Promise<GitHubAuthStatus>

  // Repository operations
  createRepo(name: string, options?: CreateRepoOptions): Promise<GitHubRepo>
  cloneRepo(owner: string, repo: string, destPath: string): Promise<void>
  deleteRepo(owner: string, repo: string): Promise<void>

  // User info
  getAuthenticatedUser(): Promise<GitHubUser | null>
}

/**
 * GitHub authentication status
 */
export interface GitHubAuthStatus {
  authenticated: boolean
  user?: GitHubUser
}

/**
 * GitHub user info
 */
export interface GitHubUser {
  login: string
  name: string
  avatarUrl: string
}

/**
 * GitHub repository info
 */
export interface GitHubRepo {
  id: string
  name: string
  fullName: string
  htmlUrl: string
  cloneUrl: string
  sshUrl: string
}

/**
 * Options for creating a GitHub repository
 */
export interface CreateRepoOptions {
  description?: string
  private?: boolean
  autoInit?: boolean
}
