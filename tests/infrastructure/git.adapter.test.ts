/**
 * GitAdapter Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GitAdapter } from '../../src/main/infrastructure/adapters/git.adapter'
import { GitNotRepoError, GitNoRemoteError, GitOperationError } from '../../src/shared/errors'

// Mock simple-git
vi.mock('simple-git', () => {
  const mockGit = {
    checkIsRepo: vi.fn(),
    init: vi.fn(),
    status: vi.fn(),
    add: vi.fn(),
    commit: vi.fn(),
    push: vi.fn(),
    branchLocal: vi.fn(),
    checkoutLocalBranch: vi.fn(),
    checkout: vi.fn(),
    getRemotes: vi.fn(),
  }

  return {
    default: vi.fn(() => mockGit),
  }
})

import simpleGit from 'simple-git'

describe('GitAdapter', () => {
  let adapter: GitAdapter
  let mockGit: ReturnType<typeof simpleGit>

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new GitAdapter()
    mockGit = simpleGit('/test/path')
  })

  describe('isRepo', () => {
    it('should return true for git repositories', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(true)

      const result = await adapter.isRepo('/test/path')

      expect(result).toBe(true)
      expect(simpleGit).toHaveBeenCalledWith('/test/path')
    })

    it('should return false for non-git directories', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(false)

      const result = await adapter.isRepo('/not/a/repo')

      expect(result).toBe(false)
    })

    it('should return false when check throws error', async () => {
      vi.mocked(mockGit.checkIsRepo).mockRejectedValue(new Error('Not a repo'))

      const result = await adapter.isRepo('/invalid/path')

      expect(result).toBe(false)
    })
  })

  describe('init', () => {
    it('should initialize a git repository', async () => {
      vi.mocked(mockGit.init).mockResolvedValue({} as never)

      await adapter.init('/test/path')

      expect(mockGit.init).toHaveBeenCalled()
    })

    it('should throw GitOperationError on failure', async () => {
      vi.mocked(mockGit.init).mockRejectedValue(new Error('Init failed'))

      await expect(adapter.init('/test/path')).rejects.toThrow(GitOperationError)
    })
  })

  describe('status', () => {
    it('should return repository status', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(true)
      vi.mocked(mockGit.status).mockResolvedValue({
        staged: ['file1.ts'],
        modified: ['file2.ts'],
        not_added: ['file3.ts'],
        deleted: ['file4.ts'],
        renamed: [],
        current: 'main',
        ahead: 1,
        behind: 0,
      } as never)

      const result = await adapter.status('/test/path')

      expect(result.staged).toEqual(['file1.ts'])
      expect(result.untracked).toEqual(['file3.ts'])
      expect(result.deleted).toEqual(['file4.ts'])
      expect(result.branch).toBe('main')
      expect(result.ahead).toBe(1)
    })

    it('should include deleted files in status', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(true)
      vi.mocked(mockGit.status).mockResolvedValue({
        staged: [],
        modified: [],
        not_added: [],
        deleted: ['removed1.ts', 'removed2.ts'],
        renamed: [],
        current: 'feature',
        ahead: 0,
        behind: 0,
      } as never)

      const result = await adapter.status('/test/path')

      expect(result.deleted).toEqual(['removed1.ts', 'removed2.ts'])
      expect(result.staged).toEqual([])
      expect(result.untracked).toEqual([])
    })

    it('should throw GitNotRepoError for non-repo paths', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(false)

      await expect(adapter.status('/not/a/repo')).rejects.toThrow(GitNotRepoError)
    })
  })

  describe('add', () => {
    it('should stage files', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(true)
      vi.mocked(mockGit.add).mockResolvedValue({} as never)

      await adapter.add('/test/path', ['file1.ts', 'file2.ts'])

      expect(mockGit.add).toHaveBeenCalledWith(['file1.ts', 'file2.ts'])
    })

    it('should throw GitNotRepoError for non-repo paths', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(false)

      await expect(adapter.add('/not/a/repo', ['file.ts'])).rejects.toThrow(GitNotRepoError)
    })
  })

  describe('commit', () => {
    it('should create commit and return hash', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(true)
      vi.mocked(mockGit.commit).mockResolvedValue({ commit: 'abc1234' } as never)

      const result = await adapter.commit('/test/path', 'Test commit')

      expect(result).toBe('abc1234')
      expect(mockGit.commit).toHaveBeenCalledWith('Test commit')
    })

    it('should return empty string if no commit hash', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(true)
      vi.mocked(mockGit.commit).mockResolvedValue({} as never)

      const result = await adapter.commit('/test/path', 'Test commit')

      expect(result).toBe('')
    })
  })

  describe('push', () => {
    it('should push to remote', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(true)
      vi.mocked(mockGit.getRemotes).mockResolvedValue([{ name: 'origin' }] as never)
      vi.mocked(mockGit.push).mockResolvedValue({} as never)

      await adapter.push('/test/path')

      expect(mockGit.push).toHaveBeenCalledWith('origin')
    })

    it('should throw GitNoRemoteError when no remote configured', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(true)
      vi.mocked(mockGit.getRemotes).mockResolvedValue([] as never)

      await expect(adapter.push('/test/path')).rejects.toThrow(GitNoRemoteError)
    })
  })

  describe('hasRemote', () => {
    it('should return true when remotes exist', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(true)
      vi.mocked(mockGit.getRemotes).mockResolvedValue([{ name: 'origin' }] as never)

      const result = await adapter.hasRemote('/test/path')

      expect(result).toBe(true)
    })

    it('should return false when no remotes', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(true)
      vi.mocked(mockGit.getRemotes).mockResolvedValue([] as never)

      const result = await adapter.hasRemote('/test/path')

      expect(result).toBe(false)
    })
  })

  describe('getRemoteUrl', () => {
    it('should return origin URL', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(true)
      vi.mocked(mockGit.getRemotes).mockResolvedValue([
        { name: 'origin', refs: { fetch: 'https://github.com/user/repo.git' } },
      ] as never)

      const result = await adapter.getRemoteUrl('/test/path')

      expect(result).toBe('https://github.com/user/repo.git')
    })

    it('should return null when no origin', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(true)
      vi.mocked(mockGit.getRemotes).mockResolvedValue([
        { name: 'upstream', refs: { fetch: 'https://github.com/other/repo.git' } },
      ] as never)

      const result = await adapter.getRemoteUrl('/test/path')

      expect(result).toBeNull()
    })
  })

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(true)
      vi.mocked(mockGit.branchLocal).mockResolvedValue({ current: 'feature-branch' } as never)

      const result = await adapter.getCurrentBranch('/test/path')

      expect(result).toBe('feature-branch')
    })

    it('should return main as default', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(true)
      vi.mocked(mockGit.branchLocal).mockResolvedValue({} as never)

      const result = await adapter.getCurrentBranch('/test/path')

      expect(result).toBe('main')
    })
  })

  describe('createBranch', () => {
    it('should create and checkout new branch', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(true)
      vi.mocked(mockGit.checkoutLocalBranch).mockResolvedValue({} as never)

      await adapter.createBranch('/test/path', 'new-branch')

      expect(mockGit.checkoutLocalBranch).toHaveBeenCalledWith('new-branch')
    })
  })

  describe('checkout', () => {
    it('should checkout existing branch', async () => {
      vi.mocked(mockGit.checkIsRepo).mockResolvedValue(true)
      vi.mocked(mockGit.checkout).mockResolvedValue({} as never)

      await adapter.checkout('/test/path', 'existing-branch')

      expect(mockGit.checkout).toHaveBeenCalledWith('existing-branch')
    })
  })
})
