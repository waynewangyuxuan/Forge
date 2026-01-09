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
 * Serialize any error for IPC transport
 * Preserves error code and message
 */
export function serializeError(error: unknown): { message: string; code: ErrorCode; name: string } {
  if (error instanceof ForgeError) {
    return error.toJSON()
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
