/**
 * Shared Errors Tests
 */

import { describe, it, expect } from 'vitest'
import {
  ForgeError,
  ValidationError,
  NotFoundError,
  DuplicateError,
  FileNotFoundError,
  DatabaseError,
  ClaudeUnavailableError,
  ClaudeTimeoutError,
  GitHubNotAuthenticatedError,
  GitHubCLINotFoundError,
  GitHubRepoExistsError,
  GitHubOperationError,
  serializeError,
  isSerializedError,
} from '../../src/shared/errors'
import { ErrorCodes } from '../../src/shared/constants'

describe('ForgeError', () => {
  it('should create error with message and code', () => {
    const error = new ForgeError('Test error', ErrorCodes.INTERNAL_ERROR)

    expect(error.message).toBe('Test error')
    expect(error.code).toBe(ErrorCodes.INTERNAL_ERROR)
    expect(error.name).toBe('ForgeError')
  })

  it('should serialize to JSON', () => {
    const error = new ForgeError('Test error', ErrorCodes.INTERNAL_ERROR)
    const json = error.toJSON()

    expect(json).toEqual({
      message: 'Test error',
      code: ErrorCodes.INTERNAL_ERROR,
      name: 'ForgeError',
    })
  })
})

describe('ValidationError', () => {
  it('should create with message and field', () => {
    const error = new ValidationError('Invalid value', 'field')

    expect(error.message).toBe('Invalid value')
    expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR)
    expect(error.field).toBe('field')
    expect(error.name).toBe('ValidationError')
  })

  it('should work without field', () => {
    const error = new ValidationError('Invalid value')

    expect(error.field).toBeUndefined()
  })
})

describe('NotFoundError', () => {
  it('should create with entity and id', () => {
    const error = new NotFoundError('Project', '123')

    expect(error.message).toBe('Project not found: 123')
    expect(error.code).toBe(ErrorCodes.NOT_FOUND)
    expect(error.entity).toBe('Project')
    expect(error.id).toBe('123')
    expect(error.name).toBe('NotFoundError')
  })
})

describe('DuplicateError', () => {
  it('should create with entity and field', () => {
    const error = new DuplicateError('Project', 'path')

    expect(error.message).toBe('Project with this path already exists')
    expect(error.code).toBe(ErrorCodes.DUPLICATE)
    expect(error.entity).toBe('Project')
    expect(error.field).toBe('path')
    expect(error.name).toBe('DuplicateError')
  })
})

describe('FileNotFoundError', () => {
  it('should create with path', () => {
    const error = new FileNotFoundError('/path/to/file')

    expect(error.message).toBe('File not found: /path/to/file')
    expect(error.code).toBe(ErrorCodes.FILE_NOT_FOUND)
    expect(error.path).toBe('/path/to/file')
    expect(error.name).toBe('FileNotFoundError')
  })
})

describe('DatabaseError', () => {
  it('should create with message', () => {
    const error = new DatabaseError('Connection failed')

    expect(error.message).toBe('Connection failed')
    expect(error.code).toBe(ErrorCodes.DATABASE_ERROR)
    expect(error.name).toBe('DatabaseError')
  })
})

describe('ClaudeUnavailableError', () => {
  it('should create with default message', () => {
    const error = new ClaudeUnavailableError()

    expect(error.message).toBe('Claude CLI is not available')
    expect(error.code).toBe(ErrorCodes.CLAUDE_UNAVAILABLE)
    expect(error.name).toBe('ClaudeUnavailableError')
  })
})

describe('ClaudeTimeoutError', () => {
  it('should create with timeout value', () => {
    const error = new ClaudeTimeoutError(5000)

    expect(error.message).toBe('Claude execution timed out after 5000ms')
    expect(error.code).toBe(ErrorCodes.CLAUDE_TIMEOUT)
    expect(error.timeoutMs).toBe(5000)
    expect(error.name).toBe('ClaudeTimeoutError')
  })
})

describe('GitHubNotAuthenticatedError', () => {
  it('should create with default message', () => {
    const error = new GitHubNotAuthenticatedError()

    expect(error.message).toContain('GitHub authentication required')
    expect(error.code).toBe(ErrorCodes.GITHUB_NOT_AUTHENTICATED)
    expect(error.name).toBe('GitHubNotAuthenticatedError')
  })
})

describe('GitHubCLINotFoundError', () => {
  it('should create with default message', () => {
    const error = new GitHubCLINotFoundError()

    expect(error.message).toContain('GitHub CLI (gh) not found')
    expect(error.code).toBe(ErrorCodes.GITHUB_CLI_NOT_FOUND)
    expect(error.name).toBe('GitHubCLINotFoundError')
  })
})

describe('GitHubRepoExistsError', () => {
  it('should create with repo name', () => {
    const error = new GitHubRepoExistsError('my-repo')

    expect(error.message).toBe('GitHub repository "my-repo" already exists')
    expect(error.code).toBe(ErrorCodes.GITHUB_REPO_EXISTS)
    expect(error.repoName).toBe('my-repo')
    expect(error.name).toBe('GitHubRepoExistsError')
  })
})

describe('GitHubOperationError', () => {
  it('should create with operation and message', () => {
    const error = new GitHubOperationError('clone', 'Access denied')

    expect(error.message).toBe('GitHub clone failed: Access denied')
    expect(error.code).toBe(ErrorCodes.GITHUB_OPERATION_FAILED)
    expect(error.operation).toBe('clone')
    expect(error.name).toBe('GitHubOperationError')
  })
})

describe('serializeError', () => {
  it('should serialize ForgeError', () => {
    const error = new ValidationError('Test', 'field')
    const serialized = serializeError(error)

    expect(serialized).toEqual({
      message: 'Test',
      code: ErrorCodes.VALIDATION_ERROR,
      name: 'ValidationError',
    })
  })

  it('should serialize standard Error', () => {
    const error = new Error('Standard error')
    const serialized = serializeError(error)

    expect(serialized).toEqual({
      message: 'Standard error',
      code: ErrorCodes.INTERNAL_ERROR,
      name: 'Error',
    })
  })

  it('should serialize non-Error values', () => {
    const serialized = serializeError('string error')

    expect(serialized).toEqual({
      message: 'string error',
      code: ErrorCodes.INTERNAL_ERROR,
      name: 'Error',
    })
  })
})

describe('isSerializedError', () => {
  it('should return true for valid serialized error', () => {
    const obj = {
      message: 'Test',
      code: 'VALIDATION_ERROR',
      name: 'ValidationError',
    }

    expect(isSerializedError(obj)).toBe(true)
  })

  it('should return false for non-object', () => {
    expect(isSerializedError('string')).toBe(false)
    expect(isSerializedError(123)).toBe(false)
    expect(isSerializedError(null)).toBe(false)
  })

  it('should return false for object without message', () => {
    expect(isSerializedError({ code: 'ERR' })).toBe(false)
  })

  it('should return false for object without code', () => {
    expect(isSerializedError({ message: 'test' })).toBe(false)
  })

  it('should return false for object with non-string message', () => {
    expect(isSerializedError({ message: 123, code: 'ERR' })).toBe(false)
  })

  it('should return false for object with non-string code', () => {
    expect(isSerializedError({ message: 'test', code: 123 })).toBe(false)
  })
})
