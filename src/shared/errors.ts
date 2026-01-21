/**
 * Custom error classes for Forge
 * These errors preserve error codes for IPC serialization
 */

import { ErrorCode, ErrorCodes } from './constants'

/**
 * Base error class for all Forge errors
 * Includes a code property that survives IPC serialization
 */
export class ForgeError extends Error {
  public readonly code: ErrorCode

  constructor(message: string, code: ErrorCode) {
    super(message)
    this.name = 'ForgeError'
    this.code = code
    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Convert to a plain object for IPC serialization
   */
  toJSON(): { message: string; code: ErrorCode; name: string } {
    return {
      message: this.message,
      code: this.code,
      name: this.name,
    }
  }
}

/**
 * Validation error - input validation failed
 */
export class ValidationError extends ForgeError {
  public readonly field?: string

  constructor(message: string, field?: string) {
    super(message, ErrorCodes.VALIDATION_ERROR)
    this.name = 'ValidationError'
    this.field = field
  }
}

/**
 * Not found error - resource doesn't exist
 */
export class NotFoundError extends ForgeError {
  public readonly entity: string
  public readonly id: string

  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, ErrorCodes.NOT_FOUND)
    this.name = 'NotFoundError'
    this.entity = entity
    this.id = id
  }
}

/**
 * Duplicate error - unique constraint violation
 */
export class DuplicateError extends ForgeError {
  public readonly entity: string
  public readonly field: string

  constructor(entity: string, field: string) {
    super(`${entity} with this ${field} already exists`, ErrorCodes.DUPLICATE)
    this.name = 'DuplicateError'
    this.entity = entity
    this.field = field
  }
}

/**
 * File not found error
 */
export class FileNotFoundError extends ForgeError {
  public readonly path: string

  constructor(path: string) {
    super(`File not found: ${path}`, ErrorCodes.FILE_NOT_FOUND)
    this.name = 'FileNotFoundError'
    this.path = path
  }
}

/**
 * Database error
 */
export class DatabaseError extends ForgeError {
  constructor(message: string) {
    super(message, ErrorCodes.DATABASE_ERROR)
    this.name = 'DatabaseError'
  }
}

/**
 * Claude CLI unavailable
 */
export class ClaudeUnavailableError extends ForgeError {
  constructor() {
    super('Claude CLI is not available', ErrorCodes.CLAUDE_UNAVAILABLE)
    this.name = 'ClaudeUnavailableError'
  }
}

/**
 * Claude execution timeout
 */
export class ClaudeTimeoutError extends ForgeError {
  public readonly timeoutMs: number

  constructor(timeoutMs: number) {
    super(`Claude execution timed out after ${timeoutMs}ms`, ErrorCodes.CLAUDE_TIMEOUT)
    this.name = 'ClaudeTimeoutError'
    this.timeoutMs = timeoutMs
  }
}

/**
 * GitHub not authenticated - user needs to login via gh CLI
 */
export class GitHubNotAuthenticatedError extends ForgeError {
  constructor() {
    super('GitHub authentication required. Please run "gh auth login" or connect via Settings.', ErrorCodes.GITHUB_NOT_AUTHENTICATED)
    this.name = 'GitHubNotAuthenticatedError'
  }
}

/**
 * GitHub CLI not found - gh CLI not installed
 */
export class GitHubCLINotFoundError extends ForgeError {
  constructor() {
    super('GitHub CLI (gh) not found. Please install it from https://cli.github.com', ErrorCodes.GITHUB_CLI_NOT_FOUND)
    this.name = 'GitHubCLINotFoundError'
  }
}

/**
 * GitHub repository already exists
 */
export class GitHubRepoExistsError extends ForgeError {
  public readonly repoName: string

  constructor(repoName: string) {
    super(`GitHub repository "${repoName}" already exists`, ErrorCodes.GITHUB_REPO_EXISTS)
    this.name = 'GitHubRepoExistsError'
    this.repoName = repoName
  }
}

/**
 * GitHub operation failed - generic GitHub API/CLI error
 */
export class GitHubOperationError extends ForgeError {
  public readonly operation: string

  constructor(operation: string, message: string) {
    super(`GitHub ${operation} failed: ${message}`, ErrorCodes.GITHUB_OPERATION_FAILED)
    this.name = 'GitHubOperationError'
    this.operation = operation
  }
}

/**
 * GitHub CLI missing required scope (e.g., delete_repo)
 */
export class GitHubMissingScopeError extends ForgeError {
  public readonly scope: string

  constructor(scope: string) {
    super(
      `GitHub CLI is missing the "${scope}" scope. Run: gh auth refresh -h github.com -s ${scope}`,
      ErrorCodes.GITHUB_MISSING_SCOPE
    )
    this.name = 'GitHubMissingScopeError'
    this.scope = scope
  }

  toJSON(): { message: string; code: ErrorCode; name: string; details: Record<string, unknown> } {
    return {
      ...super.toJSON(),
      details: { scope: this.scope },
    }
  }
}

/**
 * GitHub repository not found (may have been deleted already)
 */
export class GitHubRepoNotFoundError extends ForgeError {
  public readonly owner: string
  public readonly repo: string

  constructor(owner: string, repo: string) {
    super(
      `GitHub repository "${owner}/${repo}" not found`,
      ErrorCodes.GITHUB_REPO_NOT_FOUND
    )
    this.name = 'GitHubRepoNotFoundError'
    this.owner = owner
    this.repo = repo
  }

  toJSON(): { message: string; code: ErrorCode; name: string; details: Record<string, unknown> } {
    return {
      ...super.toJSON(),
      details: { owner: this.owner, repo: this.repo },
    }
  }
}

/**
 * Git repository not found - path is not a git repo
 */
export class GitNotRepoError extends ForgeError {
  public readonly path: string

  constructor(path: string) {
    super(`Not a git repository: ${path}`, ErrorCodes.GIT_NOT_REPO)
    this.name = 'GitNotRepoError'
    this.path = path
  }
}

/**
 * Git no remote - repository has no remote configured
 */
export class GitNoRemoteError extends ForgeError {
  public readonly path: string

  constructor(path: string) {
    super(`No remote configured for repository: ${path}`, ErrorCodes.GIT_NO_REMOTE)
    this.name = 'GitNoRemoteError'
    this.path = path
  }
}

/**
 * Git operation failed - generic git command error
 */
export class GitOperationError extends ForgeError {
  public readonly operation: string

  constructor(operation: string, message: string) {
    super(`Git ${operation} failed: ${message}`, ErrorCodes.GIT_OPERATION_FAILED)
    this.name = 'GitOperationError'
    this.operation = operation
  }
}

/**
 * Serialized error shape for IPC transport
 */
export interface SerializedError {
  message: string
  code: ErrorCode
  name: string
  details?: Record<string, unknown>
}

/**
 * Serialize any error for IPC transport
 * Preserves error code, message, and details
 */
export function serializeError(error: unknown): SerializedError {
  if (error instanceof ForgeError) {
    const json = error.toJSON()
    return {
      code: json.code,
      message: json.message,
      name: json.name,
      details: 'details' in json ? (json as { details?: Record<string, unknown> }).details : undefined,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: ErrorCodes.INTERNAL_ERROR,
      name: error.name,
    }
  }

  return {
    message: String(error),
    code: ErrorCodes.INTERNAL_ERROR,
    name: 'Error',
  }
}

/**
 * Type guard to check if an object is a serialized ForgeError
 */
export function isSerializedError(
  obj: unknown
): obj is { message: string; code: ErrorCode; name: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'message' in obj &&
    'code' in obj &&
    typeof (obj as Record<string, unknown>).message === 'string' &&
    typeof (obj as Record<string, unknown>).code === 'string'
  )
}
