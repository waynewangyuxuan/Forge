/**
 * IPC Handler Tests
 * Tests for all IPC handlers (project, version, spec, github, system)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'

// Create mock handler storage and adapter objects with vi.hoisted
const { mockHandlers, mockGitHubAdapter, mockFsAdapter } = vi.hoisted(() => ({
  mockHandlers: new Map<string, (...args: unknown[]) => unknown>(),
  mockGitHubAdapter: {
    isAvailable: vi.fn(),
    checkAuth: vi.fn(),
    createRepo: vi.fn(),
    cloneRepo: vi.fn(),
    initRepo: vi.fn(),
    commitAll: vi.fn(),
    push: vi.fn(),
  },
  mockFsAdapter: {
    exists: vi.fn(),
    createDir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    remove: vi.fn(),
    readDir: vi.fn(),
    copyDir: vi.fn(),
    isDirectory: vi.fn(),
    watch: vi.fn(),
  },
}))

// Mock electron
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      mockHandlers.set(channel, handler)
    }),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
  app: {
    getVersion: vi.fn(() => '1.0.0'),
    getPath: vi.fn(() => '/mock/data'),
  },
}))

// Mock child_process with promisify support
vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}))

vi.mock('node:util', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:util')>()
  return {
    ...actual,
    promisify: vi.fn((fn: (...args: unknown[]) => unknown) => {
      return async (...args: unknown[]) => {
        return new Promise((resolve, reject) => {
          fn(...args, (error: Error | null, stdout: string, stderr: string) => {
            if (error) reject(error)
            else resolve({ stdout, stderr })
          })
        })
      }
    }),
  }
})

// Mock github adapter with persistent reference
vi.mock('../../src/main/infrastructure/adapters/github.adapter', () => ({
  getGitHubAdapter: () => mockGitHubAdapter,
}))

// Mock file system adapter with persistent reference
vi.mock('../../src/main/infrastructure/adapters/file-system.adapter', () => ({
  getFileSystemAdapter: () => mockFsAdapter,
}))

import { createTestDatabase, setDatabase, closeDatabase } from '../../src/main/infrastructure/database'
import { registerProjectHandlers } from '../../src/main/infrastructure/ipc/project.ipc'
import { registerVersionHandlers } from '../../src/main/infrastructure/ipc/version.ipc'
import { registerSpecHandlers } from '../../src/main/infrastructure/ipc/spec.ipc'
import { registerGitHubHandlers } from '../../src/main/infrastructure/ipc/github.ipc'
import { registerSystemHandlers } from '../../src/main/infrastructure/ipc/system.ipc'
import { SQLiteProjectRepository } from '../../src/main/infrastructure/repositories/sqlite-project.repo'
import { SQLiteVersionRepository } from '../../src/main/infrastructure/repositories/sqlite-version.repo'
import { dialog, app } from 'electron'
import { exec } from 'node:child_process'

// Helper to invoke a registered handler
async function invokeHandler(channel: string, input?: unknown): Promise<unknown> {
  const handler = mockHandlers.get(channel)
  if (!handler) {
    throw new Error(`Handler not found: ${channel}`)
  }
  return handler({}, input)
}

describe('IPC Handlers', () => {
  let db: Database.Database
  let projectRepo: SQLiteProjectRepository
  let versionRepo: SQLiteVersionRepository
  let projectId: string

  beforeEach(async () => {
    vi.clearAllMocks()
    mockHandlers.clear()

    // Reset adapter mocks to clear mock implementations
    Object.values(mockGitHubAdapter).forEach(mock => mock.mockReset())
    Object.values(mockFsAdapter).forEach(mock => mock.mockReset())

    db = createTestDatabase()
    setDatabase(db)
    projectRepo = new SQLiteProjectRepository()
    versionRepo = new SQLiteVersionRepository()

    // Create a test project
    const project = await projectRepo.create({
      name: 'Test Project',
      path: '/test/path',
    })
    projectId = project.id

    // Create a test version
    await versionRepo.create({
      projectId,
      versionName: 'v1.0',
      branchName: 'main',
      devStatus: 'drafting',
      runtimeStatus: 'idle',
    })
  })

  afterEach(() => {
    closeDatabase()
  })

  describe('Project IPC Handlers', () => {
    beforeEach(() => {
      registerProjectHandlers()
    })

    it('should register project:list handler', async () => {
      expect(mockHandlers.has('project:list')).toBe(true)
    })

    it('should handle project:list', async () => {
      const result = await invokeHandler('project:list', {})
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
    })

    it('should register project:get handler', async () => {
      expect(mockHandlers.has('project:get')).toBe(true)
    })

    it('should handle project:get', async () => {
      const result = await invokeHandler('project:get', { id: projectId })
      expect(result).toBeDefined()
      expect((result as { id: string }).id).toBe(projectId)
    })

    it('should handle project:get with non-existent id', async () => {
      await expect(invokeHandler('project:get', { id: 'non-existent' })).rejects.toThrow()
    })

    it('should register project:create handler', async () => {
      expect(mockHandlers.has('project:create')).toBe(true)
    })

    it('should handle project:create', async () => {
      mockGitHubAdapter.isAvailable.mockResolvedValue(true)
      mockGitHubAdapter.checkAuth.mockResolvedValue({ authenticated: true, user: { login: 'testuser', name: 'Test', avatarUrl: '' } })
      mockGitHubAdapter.createRepo.mockResolvedValue({
        owner: 'testuser',
        name: 'new-project',
        cloneUrl: 'https://github.com/testuser/new-project.git',
        private: false,
      })
      mockGitHubAdapter.cloneRepo.mockResolvedValue(undefined)
      mockFsAdapter.createDir.mockResolvedValue(undefined)
      mockFsAdapter.writeFile.mockResolvedValue(undefined)

      const result = await invokeHandler('project:create', {
        name: 'new-project',
        description: 'A test project',
        private: false,
      })

      expect(result).toBeDefined()
      expect((result as { name: string }).name).toBe('new-project')
    })

    it('should register project:archive handler', async () => {
      expect(mockHandlers.has('project:archive')).toBe(true)
    })

    it('should handle project:archive', async () => {
      await expect(invokeHandler('project:archive', { id: projectId })).resolves.toBeUndefined()
    })

    it('should register project:delete handler', async () => {
      expect(mockHandlers.has('project:delete')).toBe(true)
    })

    it('should handle project:delete', async () => {
      await expect(invokeHandler('project:delete', { id: projectId })).resolves.toBeUndefined()
    })
  })

  describe('Version IPC Handlers', () => {
    beforeEach(() => {
      registerVersionHandlers()
    })

    it('should register version:list handler', async () => {
      expect(mockHandlers.has('version:list')).toBe(true)
    })

    it('should handle version:list', async () => {
      const result = await invokeHandler('version:list', { projectId })
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
    })

    it('should register version:get handler', async () => {
      expect(mockHandlers.has('version:get')).toBe(true)
    })

    it('should handle version:get', async () => {
      const versions = await versionRepo.findByProject(projectId)
      const versionId = versions[0].id

      const result = await invokeHandler('version:get', { id: versionId })
      expect(result).toBeDefined()
      expect((result as { id: string }).id).toBe(versionId)
    })

    it('should register version:create handler', async () => {
      expect(mockHandlers.has('version:create')).toBe(true)
    })

    it('should handle version:create', async () => {
      const result = await invokeHandler('version:create', {
        projectId,
        versionName: 'v2.0',
        branchName: 'develop',
      })

      expect(result).toBeDefined()
      expect((result as { versionName: string }).versionName).toBe('v2.0')
    })

    it('should register version:setActive handler', async () => {
      expect(mockHandlers.has('version:setActive')).toBe(true)
    })

    it('should handle version:setActive', async () => {
      const versions = await versionRepo.findByProject(projectId)
      const versionId = versions[0].id

      const result = await invokeHandler('version:setActive', { id: versionId })
      expect(result).toBeDefined()
    })
  })

  describe('Spec IPC Handlers', () => {
    beforeEach(() => {
      registerSpecHandlers()
    })

    it('should register spec:read handler', async () => {
      expect(mockHandlers.has('spec:read')).toBe(true)
    })

    it('should handle spec:read when file exists', async () => {
      mockFsAdapter.exists.mockResolvedValue(true)
      mockFsAdapter.readFile.mockResolvedValue('# Product Spec')

      const versions = await versionRepo.findByProject(projectId)
      const versionId = versions[0].id

      const result = await invokeHandler('spec:read', {
        versionId,
        file: 'PRODUCT.md',
      })

      expect(result).toBe('# Product Spec')
    })

    it('should handle spec:read when file does not exist', async () => {
      // Import error class dynamically to avoid hoisting issues
      const { FileNotFoundError } = await import('../../src/shared/errors')
      mockFsAdapter.readFile.mockRejectedValue(new FileNotFoundError('/test/path/META/CORE/PRODUCT.md'))

      const versions = await versionRepo.findByProject(projectId)
      const versionId = versions[0].id

      const result = await invokeHandler('spec:read', {
        versionId,
        file: 'PRODUCT.md',
      })

      expect(result).toBe('')
    })

    it('should register spec:save handler', async () => {
      expect(mockHandlers.has('spec:save')).toBe(true)
    })

    it('should handle spec:save', async () => {
      mockFsAdapter.createDir.mockResolvedValue(undefined)
      mockFsAdapter.writeFile.mockResolvedValue(undefined)

      const versions = await versionRepo.findByProject(projectId)
      const versionId = versions[0].id

      await expect(
        invokeHandler('spec:save', {
          versionId,
          file: 'PRODUCT.md',
          content: '# Updated Content',
        })
      ).resolves.toBeUndefined()

      expect(mockFsAdapter.writeFile).toHaveBeenCalled()
    })
  })

  describe('GitHub IPC Handlers', () => {
    beforeEach(() => {
      registerGitHubHandlers()
    })

    it('should register github:checkAuth handler', async () => {
      expect(mockHandlers.has('github:checkAuth')).toBe(true)
    })

    it('should handle github:checkAuth when available and authenticated', async () => {
      mockGitHubAdapter.isAvailable.mockResolvedValue(true)
      mockGitHubAdapter.checkAuth.mockResolvedValue({
        authenticated: true,
        user: { login: 'testuser', name: 'Test User', avatarUrl: 'https://example.com/avatar.png' },
      })

      const result = await invokeHandler('github:checkAuth')

      expect(result).toEqual({
        available: true,
        auth: {
          authenticated: true,
          user: { login: 'testuser', name: 'Test User', avatarUrl: 'https://example.com/avatar.png' },
        },
      })
    })

    it('should handle github:checkAuth when not available', async () => {
      mockGitHubAdapter.isAvailable.mockResolvedValue(false)

      const result = await invokeHandler('github:checkAuth')

      expect(result).toEqual({
        available: false,
        auth: { authenticated: false },
      })
    })

    it('should register github:createRepo handler', async () => {
      expect(mockHandlers.has('github:createRepo')).toBe(true)
    })

    it('should handle github:createRepo', async () => {
      mockGitHubAdapter.createRepo.mockResolvedValue({
        owner: 'testuser',
        name: 'test-repo',
        cloneUrl: 'https://github.com/testuser/test-repo.git',
        private: true,
      })

      const result = await invokeHandler('github:createRepo', {
        name: 'test-repo',
        options: { private: true, description: 'Test repo' },
      })

      expect(result).toEqual({
        owner: 'testuser',
        name: 'test-repo',
        cloneUrl: 'https://github.com/testuser/test-repo.git',
        private: true,
      })
    })

    it('should register github:cloneRepo handler', async () => {
      expect(mockHandlers.has('github:cloneRepo')).toBe(true)
    })

    it('should handle github:cloneRepo', async () => {
      mockGitHubAdapter.cloneRepo.mockResolvedValue(undefined)

      await expect(
        invokeHandler('github:cloneRepo', {
          owner: 'testuser',
          repo: 'test-repo',
          destPath: '/local/path',
        })
      ).resolves.toBeUndefined()

      expect(mockGitHubAdapter.cloneRepo).toHaveBeenCalledWith('testuser', 'test-repo', '/local/path')
    })
  })

  describe('System IPC Handlers', () => {
    beforeEach(() => {
      registerSystemHandlers()
    })

    it('should register system:getSettings handler', async () => {
      expect(mockHandlers.has('system:getSettings')).toBe(true)
    })

    it('should handle system:getSettings', async () => {
      const result = await invokeHandler('system:getSettings')

      expect(result).toBeDefined()
      expect(typeof (result as { projectsLocation: string }).projectsLocation).toBe('string')
    })

    it('should register system:updateSettings handler', async () => {
      expect(mockHandlers.has('system:updateSettings')).toBe(true)
    })

    it('should handle system:updateSettings', async () => {
      const result = await invokeHandler('system:updateSettings', {
        projectsLocation: '/new/location',
      })

      expect(result).toBeDefined()
      expect((result as { projectsLocation: string }).projectsLocation).toBe('/new/location')
    })

    it('should register system:selectFolder handler', async () => {
      expect(mockHandlers.has('system:selectFolder')).toBe(true)
    })

    it('should handle system:selectFolder when folder selected', async () => {
      const mockDialog = vi.mocked(dialog)
      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: false,
        filePaths: ['/selected/folder'],
      })

      const result = await invokeHandler('system:selectFolder', { title: 'Select' })

      expect(result).toEqual({ path: '/selected/folder' })
    })

    it('should handle system:selectFolder when cancelled', async () => {
      const mockDialog = vi.mocked(dialog)
      mockDialog.showOpenDialog.mockResolvedValue({
        canceled: true,
        filePaths: [],
      })

      const result = await invokeHandler('system:selectFolder', {})

      expect(result).toEqual({ path: null })
    })

    it('should register system:checkClaude handler', async () => {
      expect(mockHandlers.has('system:checkClaude')).toBe(true)
    })

    it('should handle system:checkClaude when available', async () => {
      const mockExec = vi.mocked(exec)
      mockExec.mockImplementation((_cmd, callback) => {
        if (typeof callback === 'function') {
          callback(null, 'claude 1.0.0', '')
        }
        return {} as ReturnType<typeof exec>
      })

      const result = await invokeHandler('system:checkClaude')

      expect(result).toEqual({
        available: true,
        version: 'claude 1.0.0',
      })
    })

    it('should handle system:checkClaude when not available', async () => {
      const mockExec = vi.mocked(exec)
      mockExec.mockImplementation((_cmd, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('Command not found'), '', '')
        }
        return {} as ReturnType<typeof exec>
      })

      const result = await invokeHandler('system:checkClaude')

      expect(result).toEqual({
        available: false,
      })
    })

    it('should register system:getAppInfo handler', async () => {
      expect(mockHandlers.has('system:getAppInfo')).toBe(true)
    })

    it('should handle system:getAppInfo', async () => {
      const mockApp = vi.mocked(app)
      mockApp.getVersion.mockReturnValue('2.0.0')

      const result = await invokeHandler('system:getAppInfo')

      expect(result).toBeDefined()
      expect((result as { version: string }).version).toBe('2.0.0')
    })
  })
})
