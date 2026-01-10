/**
 * Create Project Use Case Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProject, CreateProjectDeps } from '../../src/main/application/use-cases/project/create-project'
import { ValidationError, GitHubCLINotFoundError, GitHubNotAuthenticatedError } from '../../src/shared/errors'
import type { Project, Version } from '../../src/shared/types/domain.types'
import type { Settings } from '../../src/shared/types/runtime.types'

const mockProject: Project = {
  id: 'proj-123',
  name: 'test-project',
  path: '/home/user/projects/test-project',
  createdAt: new Date().toISOString(),
  archivedAt: null,
  githubOwner: 'testuser',
  githubRepo: 'test-project',
}

const mockVersion: Version = {
  id: 'ver-456',
  projectId: 'proj-123',
  versionName: 'v1.0',
  branchName: 'main',
  devStatus: 'drafting',
  runtimeStatus: 'not_configured',
  createdAt: new Date().toISOString(),
}

const mockSettings: Settings = {
  cloneRoot: '~/projects',
  executionParallelism: 1,
}

const mockGitHubUser = {
  login: 'testuser',
  name: 'Test User',
  avatarUrl: 'https://example.com/avatar',
}

const mockGitHubRepo = {
  id: '12345',
  name: 'test-project',
  fullName: 'testuser/test-project',
  htmlUrl: 'https://github.com/testuser/test-project',
  cloneUrl: 'https://github.com/testuser/test-project.git',
  sshUrl: 'git@github.com:testuser/test-project.git',
}

function createMockDeps(): CreateProjectDeps {
  return {
    projectRepo: {
      findById: vi.fn(),
      findByPath: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn().mockResolvedValue(mockProject),
      update: vi.fn(),
      archive: vi.fn(),
      delete: vi.fn(),
    },
    versionRepo: {
      findById: vi.fn(),
      findByProject: vi.fn(),
      create: vi.fn().mockResolvedValue(mockVersion),
      updateStatus: vi.fn(),
      delete: vi.fn(),
    },
    fs: {
      readFile: vi.fn(),
      readDir: vi.fn(),
      exists: vi.fn().mockResolvedValue(false),
      isDirectory: vi.fn(),
      writeFile: vi.fn(),
      createDir: vi.fn(),
      copyDir: vi.fn(),
      remove: vi.fn(),
      watch: vi.fn(),
    },
    github: {
      isAvailable: vi.fn().mockResolvedValue(true),
      checkAuth: vi.fn().mockResolvedValue({ authenticated: true, user: mockGitHubUser }),
      getAuthenticatedUser: vi.fn().mockResolvedValue(mockGitHubUser),
      createRepo: vi.fn().mockResolvedValue(mockGitHubRepo),
      cloneRepo: vi.fn(),
    },
    getSettings: vi.fn().mockResolvedValue(mockSettings),
  }
}

describe('createProject', () => {
  let deps: CreateProjectDeps

  beforeEach(() => {
    deps = createMockDeps()
  })

  describe('validation', () => {
    it('should throw ValidationError when name is empty', async () => {
      await expect(
        createProject({ name: '' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when name is whitespace only', async () => {
      await expect(
        createProject({ name: '   ' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid repo name', async () => {
      await expect(
        createProject({ name: 'invalid name with spaces' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for name starting with special char', async () => {
      await expect(
        createProject({ name: '-invalid' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should accept valid repo names', async () => {
      await expect(
        createProject({ name: 'valid-project_123' }, deps)
      ).resolves.toBeDefined()
    })
  })

  describe('GitHub CLI checks', () => {
    it('should throw GitHubCLINotFoundError when gh is not available', async () => {
      vi.mocked(deps.github.isAvailable).mockResolvedValue(false)

      await expect(
        createProject({ name: 'test-project' }, deps)
      ).rejects.toThrow(GitHubCLINotFoundError)
    })

    it('should throw GitHubNotAuthenticatedError when not authenticated', async () => {
      vi.mocked(deps.github.checkAuth).mockResolvedValue({ authenticated: false })

      await expect(
        createProject({ name: 'test-project' }, deps)
      ).rejects.toThrow(GitHubNotAuthenticatedError)
    })

    it('should throw GitHubNotAuthenticatedError when user is missing', async () => {
      vi.mocked(deps.github.checkAuth).mockResolvedValue({ authenticated: true })

      await expect(
        createProject({ name: 'test-project' }, deps)
      ).rejects.toThrow(GitHubNotAuthenticatedError)
    })
  })

  describe('path checks', () => {
    it('should throw ValidationError when path already exists', async () => {
      vi.mocked(deps.fs.exists).mockResolvedValue(true)

      await expect(
        createProject({ name: 'test-project' }, deps)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('successful creation', () => {
    it('should create GitHub repo', async () => {
      await createProject({ name: 'test-project' }, deps)

      expect(deps.github.createRepo).toHaveBeenCalledWith('test-project', {
        description: undefined,
        private: false,
      })
    })

    it('should create GitHub repo with options', async () => {
      await createProject({
        name: 'test-project',
        description: 'A test project',
        private: true,
      }, deps)

      expect(deps.github.createRepo).toHaveBeenCalledWith('test-project', {
        description: 'A test project',
        private: true,
      })
    })

    it('should clone repo to local path', async () => {
      await createProject({ name: 'test-project' }, deps)

      expect(deps.github.cloneRepo).toHaveBeenCalledWith(
        'testuser',
        'test-project',
        expect.stringContaining('test-project')
      )
    })

    it('should create META/CORE directory structure', async () => {
      await createProject({ name: 'test-project' }, deps)

      expect(deps.fs.createDir).toHaveBeenCalledWith(
        expect.stringContaining('META/CORE'),
        true
      )
    })

    it('should create placeholder spec files', async () => {
      await createProject({ name: 'test-project' }, deps)

      expect(deps.fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('PRODUCT.md'),
        expect.stringContaining('# test-project')
      )
      expect(deps.fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('TECHNICAL.md'),
        expect.any(String)
      )
      expect(deps.fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('REGULATION.md'),
        expect.any(String)
      )
    })

    it('should create project in database', async () => {
      await createProject({ name: 'test-project' }, deps)

      expect(deps.projectRepo.create).toHaveBeenCalledWith({
        name: 'test-project',
        path: expect.stringContaining('test-project'),
        githubRepo: 'test-project',
        githubOwner: 'testuser',
      })
    })

    it('should create initial version', async () => {
      await createProject({ name: 'test-project' }, deps)

      expect(deps.versionRepo.create).toHaveBeenCalledWith({
        projectId: 'proj-123',
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: 'drafting',
        runtimeStatus: 'not_configured',
      })
    })

    it('should return project and version', async () => {
      const result = await createProject({ name: 'test-project' }, deps)

      expect(result.project).toEqual(mockProject)
      expect(result.version).toEqual(mockVersion)
    })
  })
})
