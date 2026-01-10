/**
 * GitHub Adapter Tests
 * Tests for GitHubAdapter using mocked exec
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exec } from 'node:child_process'
import {
  GitHubCLINotFoundError,
  GitHubNotAuthenticatedError,
  GitHubRepoExistsError,
  GitHubOperationError,
} from '../../src/shared/errors'

// Mock child_process
vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}))

// We need to import after mocking
const { GitHubAdapter, getGitHubAdapter } = await import('../../src/main/infrastructure/adapters/github.adapter')

const mockExec = vi.mocked(exec)

// Helper to create mock exec implementation
function mockExecSuccess(stdout: string, stderr = '') {
  mockExec.mockImplementation(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
    if (callback) {
      callback(null, { stdout, stderr })
    }
    return {} as ReturnType<typeof exec>
  }) as typeof exec)
}

function mockExecError(errorMessage: string, stderr = '') {
  mockExec.mockImplementation(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
    const error = new Error(errorMessage) as Error & { stderr: string }
    error.stderr = stderr
    if (callback) {
      callback(error, { stdout: '', stderr })
    }
    return {} as ReturnType<typeof exec>
  }) as typeof exec)
}

describe('GitHubAdapter', () => {
  let adapter: GitHubAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new GitHubAdapter()
  })

  describe('isAvailable', () => {
    it('should return true when gh is installed', async () => {
      mockExecSuccess('gh version 2.40.0')

      const result = await adapter.isAvailable()

      expect(result).toBe(true)
    })

    it('should return false when gh is not installed', async () => {
      mockExecError('command not found')

      const result = await adapter.isAvailable()

      expect(result).toBe(false)
    })
  })

  describe('checkAuth', () => {
    it('should return authenticated status when logged in', async () => {
      // First call for auth status
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        if (callback) callback(null, { stdout: 'Logged in to github.com', stderr: '' })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)
      // Second call for user info
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        if (callback) callback(null, { stdout: 'testuser\nTest User\nhttps://avatar.url', stderr: '' })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      const result = await adapter.checkAuth()

      expect(result.authenticated).toBe(true)
      expect(result.user?.login).toBe('testuser')
    })

    it('should return not authenticated when not logged in', async () => {
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        const error = new Error('not logged in') as Error & { stderr: string; stdout: string }
        error.stderr = 'You are not logged in'
        error.stdout = ''
        if (callback) callback(error, { stdout: '', stderr: error.stderr })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      const result = await adapter.checkAuth()

      expect(result.authenticated).toBe(false)
    })

    it('should return not authenticated when "not authenticated" error', async () => {
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        const error = new Error('auth error') as Error & { stderr: string; stdout: string }
        error.stderr = 'You are not authenticated to github.com'
        error.stdout = ''
        if (callback) callback(error, { stdout: '', stderr: error.stderr })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      const result = await adapter.checkAuth()

      expect(result.authenticated).toBe(false)
    })

    it('should return not authenticated when gh command not found', async () => {
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        const error = new Error('not found') as Error & { stderr: string; stdout: string }
        error.stderr = 'gh: command not found'
        error.stdout = ''
        if (callback) callback(error, { stdout: '', stderr: error.stderr })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      const result = await adapter.checkAuth()

      expect(result.authenticated).toBe(false)
    })

    it('should return not authenticated when gh not recognized (Windows)', async () => {
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        const error = new Error('not found') as Error & { stderr: string; stdout: string }
        error.stderr = "'gh' is not recognized as an internal or external command"
        error.stdout = ''
        if (callback) callback(error, { stdout: '', stderr: error.stderr })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      const result = await adapter.checkAuth()

      expect(result.authenticated).toBe(false)
    })

    it('should return not authenticated for other errors', async () => {
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        const error = new Error('unknown error') as Error & { stderr: string; stdout: string }
        error.stderr = 'Some random network error'
        error.stdout = ''
        if (callback) callback(error, { stdout: '', stderr: error.stderr })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      const result = await adapter.checkAuth()

      expect(result.authenticated).toBe(false)
    })
  })

  describe('getAuthenticatedUser', () => {
    it('should return user info when authenticated', async () => {
      mockExecSuccess('testuser\nTest User\nhttps://avatar.url')

      const result = await adapter.getAuthenticatedUser()

      expect(result).toEqual({
        login: 'testuser',
        name: 'Test User',
        avatarUrl: 'https://avatar.url',
      })
    })

    it('should use login as name fallback', async () => {
      mockExecSuccess('testuser\n\nhttps://avatar.url')

      const result = await adapter.getAuthenticatedUser()

      expect(result?.name).toBe('testuser')
    })

    it('should return null on error', async () => {
      mockExecError('Not authenticated')

      const result = await adapter.getAuthenticatedUser()

      expect(result).toBeNull()
    })

    it('should return null for incomplete response', async () => {
      mockExecSuccess('testuser\n')

      const result = await adapter.getAuthenticatedUser()

      expect(result).toBeNull()
    })
  })

  describe('createRepo', () => {
    beforeEach(() => {
      // Mock isAvailable
      vi.spyOn(adapter, 'isAvailable').mockResolvedValue(true)
      // Mock checkAuth
      vi.spyOn(adapter, 'checkAuth').mockResolvedValue({
        authenticated: true,
        user: { login: 'testuser', name: 'Test', avatarUrl: '' },
      })
    })

    it('should throw GitHubCLINotFoundError when gh not available', async () => {
      vi.spyOn(adapter, 'isAvailable').mockResolvedValue(false)

      await expect(adapter.createRepo('test-repo')).rejects.toThrow(GitHubCLINotFoundError)
    })

    it('should throw GitHubNotAuthenticatedError when not authenticated', async () => {
      vi.spyOn(adapter, 'checkAuth').mockResolvedValue({ authenticated: false })

      await expect(adapter.createRepo('test-repo')).rejects.toThrow(GitHubNotAuthenticatedError)
    })

    it('should throw GitHubRepoExistsError when repo exists', async () => {
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        const error = new Error('Failed') as Error & { stderr: string }
        error.stderr = 'Name already exists on this account'
        if (callback) callback(error, { stdout: '', stderr: error.stderr })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      await expect(adapter.createRepo('existing-repo')).rejects.toThrow(GitHubRepoExistsError)
    })

    it('should throw GitHubRepoExistsError with "already exists" message', async () => {
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        const error = new Error('Failed') as Error & { stderr: string }
        error.stderr = 'repository already exists'
        if (callback) callback(error, { stdout: '', stderr: error.stderr })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      await expect(adapter.createRepo('existing-repo')).rejects.toThrow(GitHubRepoExistsError)
    })

    it('should throw GitHubOperationError for unknown errors', async () => {
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        const error = new Error('Failed') as Error & { stderr: string }
        error.stderr = 'Network timeout'
        if (callback) callback(error, { stdout: '', stderr: error.stderr })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      await expect(adapter.createRepo('test-repo')).rejects.toThrow(GitHubOperationError)
    })

    it('should throw GitHubOperationError with empty stderr', async () => {
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        const error = new Error('Failed') as Error & { stderr: string }
        error.stderr = ''
        if (callback) callback(error, { stdout: '', stderr: '' })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      await expect(adapter.createRepo('test-repo')).rejects.toThrow(GitHubOperationError)
    })

    it('should create repo and parse URL from output', async () => {
      // First call: gh repo create
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        if (callback) callback(null, { stdout: 'Created repository https://github.com/testuser/new-repo on GitHub', stderr: '' })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)
      // Second call: gh api repos/...
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        if (callback) callback(null, { stdout: '12345\nnew-repo\ntestuser/new-repo\nhttps://github.com/testuser/new-repo\nhttps://github.com/testuser/new-repo.git\ngit@github.com:testuser/new-repo.git', stderr: '' })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      const result = await adapter.createRepo('new-repo')

      expect(result).toEqual({
        id: '12345',
        name: 'new-repo',
        fullName: 'testuser/new-repo',
        htmlUrl: 'https://github.com/testuser/new-repo',
        cloneUrl: 'https://github.com/testuser/new-repo.git',
        sshUrl: 'git@github.com:testuser/new-repo.git',
      })
    })

    it('should create repo with private option', async () => {
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        expect(command).toContain('--private')
        if (callback) callback(null, { stdout: 'Created repository https://github.com/testuser/private-repo', stderr: '' })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        if (callback) callback(null, { stdout: '12345\nprivate-repo\ntestuser/private-repo\nhttps://github.com/testuser/private-repo\nhttps://github.com/testuser/private-repo.git\ngit@github.com:testuser/private-repo.git', stderr: '' })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      await adapter.createRepo('private-repo', { private: true })
    })

    it('should create repo with description option', async () => {
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        expect(command).toContain('--description "Test description"')
        if (callback) callback(null, { stdout: 'Created repository https://github.com/testuser/desc-repo', stderr: '' })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        if (callback) callback(null, { stdout: '12345\ndesc-repo\ntestuser/desc-repo\nhttps://github.com/testuser/desc-repo\nhttps://github.com/testuser/desc-repo.git\ngit@github.com:testuser/desc-repo.git', stderr: '' })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      await adapter.createRepo('desc-repo', { description: 'Test description' })
    })

    it('should fallback to user login when no URL in output', async () => {
      // First call: gh repo create - no URL in output
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        if (callback) callback(null, { stdout: 'Repository created successfully', stderr: '' })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)
      // Second call: gh api repos/...
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        expect(command).toContain('repos/testuser/fallback-repo')
        if (callback) callback(null, { stdout: '12345\nfallback-repo\ntestuser/fallback-repo\nhttps://github.com/testuser/fallback-repo\nhttps://github.com/testuser/fallback-repo.git\ngit@github.com:testuser/fallback-repo.git', stderr: '' })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      const result = await adapter.createRepo('fallback-repo')

      expect(result.name).toBe('fallback-repo')
    })

    it('should throw GitHubOperationError when getRepoInfo returns incomplete data', async () => {
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        if (callback) callback(null, { stdout: 'Created repository https://github.com/testuser/incomplete', stderr: '' })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        // Only 3 lines instead of 6
        if (callback) callback(null, { stdout: '12345\nincomplete\ntestuser/incomplete', stderr: '' })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      await expect(adapter.createRepo('incomplete')).rejects.toThrow(GitHubOperationError)
    })

    it('should throw GitHubOperationError when getRepoInfo API fails', async () => {
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        if (callback) callback(null, { stdout: 'Created repository https://github.com/testuser/apierror', stderr: '' })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        const error = new Error('API Error') as Error & { stderr: string }
        error.stderr = 'Not Found'
        if (callback) callback(error, { stdout: '', stderr: 'Not Found' })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      await expect(adapter.createRepo('apierror')).rejects.toThrow(GitHubOperationError)
    })
  })

  describe('cloneRepo', () => {
    beforeEach(() => {
      vi.spyOn(adapter, 'isAvailable').mockResolvedValue(true)
      vi.spyOn(adapter, 'checkAuth').mockResolvedValue({
        authenticated: true,
        user: { login: 'testuser', name: 'Test', avatarUrl: '' },
      })
    })

    it('should throw GitHubCLINotFoundError when gh not available', async () => {
      vi.spyOn(adapter, 'isAvailable').mockResolvedValue(false)

      await expect(
        adapter.cloneRepo('owner', 'repo', '/dest')
      ).rejects.toThrow(GitHubCLINotFoundError)
    })

    it('should throw GitHubNotAuthenticatedError when not authenticated', async () => {
      vi.spyOn(adapter, 'checkAuth').mockResolvedValue({ authenticated: false })

      await expect(
        adapter.cloneRepo('owner', 'repo', '/dest')
      ).rejects.toThrow(GitHubNotAuthenticatedError)
    })

    it('should throw GitHubOperationError on clone failure', async () => {
      mockExec.mockImplementationOnce(((command: string, callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
        const error = new Error('Clone failed') as Error & { stderr: string }
        error.stderr = 'Permission denied'
        if (callback) callback(error, { stdout: '', stderr: error.stderr })
        return {} as ReturnType<typeof exec>
      }) as typeof exec)

      await expect(
        adapter.cloneRepo('owner', 'repo', '/dest')
      ).rejects.toThrow(GitHubOperationError)
    })

    it('should clone successfully', async () => {
      mockExecSuccess('Cloning into /dest...')

      await expect(
        adapter.cloneRepo('owner', 'repo', '/dest')
      ).resolves.not.toThrow()
    })
  })

  describe('getGitHubAdapter singleton', () => {
    it('should return same instance', () => {
      const instance1 = getGitHubAdapter()
      const instance2 = getGitHubAdapter()

      expect(instance1).toBe(instance2)
    })
  })
})
