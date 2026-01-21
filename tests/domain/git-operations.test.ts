/**
 * Git Operations Engine Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeGitHook, validateHookDefinition } from '../../src/main/domain/engines/git-operations'
import type { IGitAdapter } from '../../src/shared/interfaces/adapters'
import type { GitHookConfig } from '../../src/main/infrastructure/config-loader/yaml-config-loader'

describe('Git Operations Engine', () => {
  // Mock git adapter
  const createMockGitAdapter = (): IGitAdapter => ({
    init: vi.fn(),
    isRepo: vi.fn(),
    status: vi.fn(),
    add: vi.fn(),
    commit: vi.fn(),
    push: vi.fn(),
    createBranch: vi.fn(),
    checkout: vi.fn(),
    getCurrentBranch: vi.fn(),
    hasRemote: vi.fn(),
    getRemoteUrl: vi.fn(),
  })

  const defaultHookDefinition: GitHookConfig = {
    enabled: true,
    commit: {
      message: 'chore(scaffold): generate task breakdown for {{version_name}}',
      files: ['META/'],
    },
    push: {
      strategy: 'auto',
    },
  }

  // Default options for tests (new interface uses commitEnabled + pushStrategy)
  const defaultCommitEnabled = true
  const defaultPushStrategy = 'auto' as const

  const defaultContext = {
    projectPath: '/test/project',
    versionName: 'v1.0',
    projectName: 'TestProject',
  }

  describe('executeGitHook', () => {
    let mockGit: IGitAdapter

    beforeEach(() => {
      mockGit = createMockGitAdapter()
    })

    it('should skip when hook is disabled', async () => {
      const result = await executeGitHook({
        hookDefinition: { ...defaultHookDefinition, enabled: false },
        context: defaultContext,
        commitEnabled: defaultCommitEnabled,
        pushStrategy: defaultPushStrategy,
        git: mockGit,
      })

      expect(result.success).toBe(true)
      expect(result.skipped).toBe(true)
      expect(result.skippedReason).toBe('Hook is disabled in configuration')
    })

    it('should skip when commitEnabled is false', async () => {
      const result = await executeGitHook({
        hookDefinition: defaultHookDefinition,
        context: defaultContext,
        commitEnabled: false,
        pushStrategy: defaultPushStrategy,
        git: mockGit,
      })

      expect(result.success).toBe(true)
      expect(result.skipped).toBe(true)
      expect(result.skippedReason).toBe('Auto-commit disabled in settings')
    })

    it('should skip when path is not a git repository', async () => {
      vi.mocked(mockGit.isRepo).mockResolvedValue(false)

      const result = await executeGitHook({
        hookDefinition: defaultHookDefinition,
        context: defaultContext,
        commitEnabled: defaultCommitEnabled,
        pushStrategy: defaultPushStrategy,
        git: mockGit,
      })

      expect(result.success).toBe(true)
      expect(result.skipped).toBe(true)
      expect(result.skippedReason).toBe('Not a git repository')
    })

    it('should skip when there are no changes', async () => {
      vi.mocked(mockGit.isRepo).mockResolvedValue(true)
      vi.mocked(mockGit.status).mockResolvedValue({
        staged: [],
        unstaged: [],
        untracked: [],
        deleted: [],
        branch: 'main',
        ahead: 0,
        behind: 0,
      })

      const result = await executeGitHook({
        hookDefinition: defaultHookDefinition,
        context: defaultContext,
        commitEnabled: defaultCommitEnabled,
        pushStrategy: defaultPushStrategy,
        git: mockGit,
      })

      expect(result.success).toBe(true)
      expect(result.skipped).toBe(true)
      expect(result.skippedReason).toBe('No changes to commit')
    })

    it('should commit when only deleted files exist', async () => {
      vi.mocked(mockGit.isRepo).mockResolvedValue(true)
      vi.mocked(mockGit.status).mockResolvedValue({
        staged: [],
        unstaged: [],
        untracked: [],
        deleted: ['src/removed.ts'],
        branch: 'main',
        ahead: 0,
        behind: 0,
      })
      vi.mocked(mockGit.add).mockResolvedValue(undefined)
      vi.mocked(mockGit.commit).mockResolvedValue('deleted123')
      vi.mocked(mockGit.hasRemote).mockResolvedValue(false)

      const result = await executeGitHook({
        hookDefinition: defaultHookDefinition,
        context: defaultContext,
        commitEnabled: defaultCommitEnabled,
        pushStrategy: defaultPushStrategy,
        git: mockGit,
      })

      expect(result.success).toBe(true)
      expect(result.skipped).toBeFalsy() // undefined or false
      expect(result.commitHash).toBe('deleted123')
    })

    it('should return pushFailed when push throws error', async () => {
      vi.mocked(mockGit.isRepo).mockResolvedValue(true)
      vi.mocked(mockGit.status).mockResolvedValue({
        staged: [],
        unstaged: [],
        untracked: ['file.ts'],
        deleted: [],
        branch: 'main',
        ahead: 0,
        behind: 0,
      })
      vi.mocked(mockGit.add).mockResolvedValue(undefined)
      vi.mocked(mockGit.commit).mockResolvedValue('abc1234')
      vi.mocked(mockGit.hasRemote).mockResolvedValue(true)
      vi.mocked(mockGit.push).mockRejectedValue(new Error('Network error'))

      // Suppress console.warn for this test
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await executeGitHook({
        hookDefinition: defaultHookDefinition,
        context: defaultContext,
        commitEnabled: defaultCommitEnabled,
        pushStrategy: 'auto',
        git: mockGit,
      })

      // Commit should succeed but pushFailed should be true
      expect(result.success).toBe(true)
      expect(result.commitHash).toBe('abc1234')
      expect(result.pushed).toBe(false)
      expect(result.pushFailed).toBe(true)
      expect(result.pushError).toBe('Network error')

      warnSpy.mockRestore()
    })

    it('should commit files successfully', async () => {
      vi.mocked(mockGit.isRepo).mockResolvedValue(true)
      vi.mocked(mockGit.status).mockResolvedValue({
        staged: [],
        unstaged: [],
        untracked: ['META/TODO.md'],
        deleted: [],
        branch: 'main',
        ahead: 0,
        behind: 0,
      })
      vi.mocked(mockGit.add).mockResolvedValue(undefined)
      vi.mocked(mockGit.commit).mockResolvedValue('abc1234')
      vi.mocked(mockGit.hasRemote).mockResolvedValue(false)

      const result = await executeGitHook({
        hookDefinition: defaultHookDefinition,
        context: defaultContext,
        commitEnabled: defaultCommitEnabled,
        pushStrategy: defaultPushStrategy,
        git: mockGit,
      })

      expect(result.success).toBe(true)
      expect(result.commitHash).toBe('abc1234')
      expect(result.pushed).toBe(false)
      expect(mockGit.add).toHaveBeenCalledWith('/test/project', ['META/'])
      expect(mockGit.commit).toHaveBeenCalledWith(
        '/test/project',
        'chore(scaffold): generate task breakdown for v1.0'
      )
    })

    it('should substitute template variables in commit message', async () => {
      vi.mocked(mockGit.isRepo).mockResolvedValue(true)
      vi.mocked(mockGit.status).mockResolvedValue({
        staged: [],
        unstaged: [],
        untracked: ['file.ts'],
        deleted: [],
        branch: 'main',
        ahead: 0,
        behind: 0,
      })
      vi.mocked(mockGit.add).mockResolvedValue(undefined)
      vi.mocked(mockGit.commit).mockResolvedValue('def5678')
      vi.mocked(mockGit.hasRemote).mockResolvedValue(false)

      const hookDef: GitHookConfig = {
        ...defaultHookDefinition,
        commit: {
          message: 'feat({{milestone_name}}): complete milestone for {{project_name}}',
          files: ['.'],
        },
      }

      await executeGitHook({
        hookDefinition: hookDef,
        context: { ...defaultContext, milestoneName: 'M4.1' },
        commitEnabled: defaultCommitEnabled,
        pushStrategy: defaultPushStrategy,
        git: mockGit,
      })

      expect(mockGit.commit).toHaveBeenCalledWith(
        '/test/project',
        'feat(M4.1): complete milestone for TestProject'
      )
    })

    it('should stage all files when files includes "."', async () => {
      vi.mocked(mockGit.isRepo).mockResolvedValue(true)
      vi.mocked(mockGit.status).mockResolvedValue({
        staged: [],
        unstaged: [],
        untracked: ['file.ts'],
        deleted: [],
        branch: 'main',
        ahead: 0,
        behind: 0,
      })
      vi.mocked(mockGit.add).mockResolvedValue(undefined)
      vi.mocked(mockGit.commit).mockResolvedValue('abc1234')
      vi.mocked(mockGit.hasRemote).mockResolvedValue(false)

      const hookDef: GitHookConfig = {
        ...defaultHookDefinition,
        commit: {
          message: 'test',
          files: ['.'],
        },
      }

      await executeGitHook({
        hookDefinition: hookDef,
        context: defaultContext,
        commitEnabled: defaultCommitEnabled,
        pushStrategy: defaultPushStrategy,
        git: mockGit,
      })

      expect(mockGit.add).toHaveBeenCalledWith('/test/project', ['.'])
    })

    it('should push when pushStrategy is auto and config strategy is auto', async () => {
      vi.mocked(mockGit.isRepo).mockResolvedValue(true)
      vi.mocked(mockGit.status).mockResolvedValue({
        staged: [],
        unstaged: [],
        untracked: ['file.ts'],
        deleted: [],
        branch: 'main',
        ahead: 0,
        behind: 0,
      })
      vi.mocked(mockGit.add).mockResolvedValue(undefined)
      vi.mocked(mockGit.commit).mockResolvedValue('abc1234')
      vi.mocked(mockGit.hasRemote).mockResolvedValue(true)
      vi.mocked(mockGit.push).mockResolvedValue(undefined)

      const result = await executeGitHook({
        hookDefinition: defaultHookDefinition,
        context: defaultContext,
        commitEnabled: defaultCommitEnabled,
        pushStrategy: 'auto',
        git: mockGit,
      })

      expect(result.pushed).toBe(true)
      expect(mockGit.push).toHaveBeenCalledWith('/test/project')
    })

    it('should not push when pushStrategy is manual', async () => {
      vi.mocked(mockGit.isRepo).mockResolvedValue(true)
      vi.mocked(mockGit.status).mockResolvedValue({
        staged: [],
        unstaged: [],
        untracked: ['file.ts'],
        deleted: [],
        branch: 'main',
        ahead: 0,
        behind: 0,
      })
      vi.mocked(mockGit.add).mockResolvedValue(undefined)
      vi.mocked(mockGit.commit).mockResolvedValue('abc1234')
      vi.mocked(mockGit.hasRemote).mockResolvedValue(true)

      const result = await executeGitHook({
        hookDefinition: defaultHookDefinition,
        context: defaultContext,
        commitEnabled: defaultCommitEnabled,
        pushStrategy: 'manual',
        git: mockGit,
      })

      expect(result.pushed).toBe(false)
      expect(mockGit.push).not.toHaveBeenCalled()
    })

    it('should not push when pushStrategy setting is disabled', async () => {
      vi.mocked(mockGit.isRepo).mockResolvedValue(true)
      vi.mocked(mockGit.status).mockResolvedValue({
        staged: [],
        unstaged: [],
        untracked: ['file.ts'],
        deleted: [],
        branch: 'main',
        ahead: 0,
        behind: 0,
      })
      vi.mocked(mockGit.add).mockResolvedValue(undefined)
      vi.mocked(mockGit.commit).mockResolvedValue('abc1234')
      vi.mocked(mockGit.hasRemote).mockResolvedValue(true)

      const result = await executeGitHook({
        hookDefinition: defaultHookDefinition,
        context: defaultContext,
        commitEnabled: defaultCommitEnabled,
        pushStrategy: 'disabled',
        git: mockGit,
      })

      expect(result.pushed).toBe(false)
      expect(mockGit.push).not.toHaveBeenCalled()
    })

    it('should not push when config strategy is manual even if setting is auto', async () => {
      vi.mocked(mockGit.isRepo).mockResolvedValue(true)
      vi.mocked(mockGit.status).mockResolvedValue({
        staged: [],
        unstaged: [],
        untracked: ['file.ts'],
        deleted: [],
        branch: 'main',
        ahead: 0,
        behind: 0,
      })
      vi.mocked(mockGit.add).mockResolvedValue(undefined)
      vi.mocked(mockGit.commit).mockResolvedValue('abc1234')
      vi.mocked(mockGit.hasRemote).mockResolvedValue(true)

      const hookDef: GitHookConfig = {
        ...defaultHookDefinition,
        push: { strategy: 'manual' },
      }

      const result = await executeGitHook({
        hookDefinition: hookDef,
        context: defaultContext,
        commitEnabled: defaultCommitEnabled,
        pushStrategy: 'auto',
        git: mockGit,
      })

      expect(result.pushed).toBe(false)
      expect(mockGit.push).not.toHaveBeenCalled()
    })

    it('should handle push failure gracefully', async () => {
      vi.mocked(mockGit.isRepo).mockResolvedValue(true)
      vi.mocked(mockGit.status).mockResolvedValue({
        staged: [],
        unstaged: [],
        untracked: ['file.ts'],
        deleted: [],
        branch: 'main',
        ahead: 0,
        behind: 0,
      })
      vi.mocked(mockGit.add).mockResolvedValue(undefined)
      vi.mocked(mockGit.commit).mockResolvedValue('abc1234')
      vi.mocked(mockGit.hasRemote).mockResolvedValue(true)
      vi.mocked(mockGit.push).mockRejectedValue(new Error('Push failed'))

      // Suppress console.warn for this test
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await executeGitHook({
        hookDefinition: defaultHookDefinition,
        context: defaultContext,
        commitEnabled: defaultCommitEnabled,
        pushStrategy: 'auto',
        git: mockGit,
      })

      // Commit should still succeed
      expect(result.success).toBe(true)
      expect(result.commitHash).toBe('abc1234')
      expect(result.pushed).toBe(false)

      warnSpy.mockRestore()
    })

    it('should return error on git operation failure', async () => {
      vi.mocked(mockGit.isRepo).mockResolvedValue(true)
      vi.mocked(mockGit.status).mockRejectedValue(new Error('Git error'))

      const result = await executeGitHook({
        hookDefinition: defaultHookDefinition,
        context: defaultContext,
        commitEnabled: defaultCommitEnabled,
        pushStrategy: defaultPushStrategy,
        git: mockGit,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Git error')
    })

    it('should not push when config strategy is disabled even if setting is auto', async () => {
      vi.mocked(mockGit.isRepo).mockResolvedValue(true)
      vi.mocked(mockGit.status).mockResolvedValue({
        staged: [],
        unstaged: [],
        untracked: ['file.ts'],
        deleted: [],
        branch: 'main',
        ahead: 0,
        behind: 0,
      })
      vi.mocked(mockGit.add).mockResolvedValue(undefined)
      vi.mocked(mockGit.commit).mockResolvedValue('abc1234')
      vi.mocked(mockGit.hasRemote).mockResolvedValue(true)

      const hookDef: GitHookConfig = {
        ...defaultHookDefinition,
        push: { strategy: 'disabled' },
      }

      const result = await executeGitHook({
        hookDefinition: hookDef,
        context: defaultContext,
        commitEnabled: defaultCommitEnabled,
        pushStrategy: 'auto',
        git: mockGit,
      })

      expect(result.pushed).toBe(false)
      expect(mockGit.push).not.toHaveBeenCalled()
    })
  })

  describe('validateHookDefinition', () => {
    it('should validate correct hook definition', () => {
      expect(validateHookDefinition(defaultHookDefinition)).toBe(true)
    })

    it('should reject null', () => {
      expect(validateHookDefinition(null)).toBe(false)
    })

    it('should reject undefined', () => {
      expect(validateHookDefinition(undefined)).toBe(false)
    })

    it('should reject non-object', () => {
      expect(validateHookDefinition('string')).toBe(false)
    })

    it('should reject missing enabled', () => {
      const hook = { ...defaultHookDefinition }
      delete (hook as Record<string, unknown>).enabled
      expect(validateHookDefinition(hook)).toBe(false)
    })

    it('should reject missing commit', () => {
      const hook = { enabled: true, push: { strategy: 'auto' } }
      expect(validateHookDefinition(hook)).toBe(false)
    })

    it('should reject missing push', () => {
      const hook = { enabled: true, commit: { message: 'test', files: [] } }
      expect(validateHookDefinition(hook)).toBe(false)
    })

    it('should reject invalid push strategy', () => {
      const hook = {
        enabled: true,
        commit: { message: 'test', files: [] },
        push: { strategy: 'invalid' },
      }
      expect(validateHookDefinition(hook)).toBe(false)
    })
  })
})
