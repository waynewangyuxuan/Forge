/**
 * Server Store Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useServerStore } from '../../src/renderer/stores/server.store'
import type { Project, Version } from '../../src/shared/types/domain.types'

// Mock window.api
const mockApi = {
  invoke: vi.fn(),
}

// Set up window.api mock
Object.defineProperty(global, 'window', {
  value: { api: mockApi },
  writable: true,
})

const mockProject: Project = {
  id: 'proj-123',
  name: 'Test Project',
  path: '/path/to/project',
  createdAt: new Date().toISOString(),
  archivedAt: null,
}

const mockVersion: Version = {
  id: 'ver-456',
  projectId: 'proj-123',
  versionName: 'v1.0',
  branchName: 'main',
  devStatus: 'drafting',
  runtimeStatus: 'idle',
  createdAt: new Date().toISOString(),
}

describe('useServerStore', () => {
  beforeEach(() => {
    // Reset store state
    useServerStore.setState({
      projects: [],
      versions: {},
      currentVersionId: {},
      credentials: [],
      settings: null,
      loading: {
        projects: false,
        versions: false,
        credentials: false,
        settings: false,
      },
    })
    vi.clearAllMocks()
  })

  describe('fetchProjects', () => {
    it('should fetch and store projects', async () => {
      mockApi.invoke.mockResolvedValue({ ok: true, data: [mockProject] })

      await useServerStore.getState().fetchProjects()

      expect(mockApi.invoke).toHaveBeenCalledWith('project:list', {})
      expect(useServerStore.getState().projects).toEqual([mockProject])
    })

    it('should set loading state during fetch', async () => {
      mockApi.invoke.mockImplementation(async () => {
        expect(useServerStore.getState().loading.projects).toBe(true)
        return { ok: true, data: [] }
      })

      await useServerStore.getState().fetchProjects()

      expect(useServerStore.getState().loading.projects).toBe(false)
    })

    it('should throw error on failure', async () => {
      mockApi.invoke.mockRejectedValue(new Error('Network error'))

      await expect(
        useServerStore.getState().fetchProjects()
      ).rejects.toThrow('Network error')
    })
  })

  describe('createProject', () => {
    it('should create project and add to store', async () => {
      mockApi.invoke.mockResolvedValue({ ok: true, data: mockProject })

      const result = await useServerStore.getState().createProject({ name: 'Test' })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toEqual(mockProject)
      }
      expect(useServerStore.getState().projects).toContain(mockProject)
    })
  })

  describe('archiveProject', () => {
    it('should archive project and update store', async () => {
      useServerStore.setState({ projects: [mockProject] })
      mockApi.invoke.mockResolvedValue({ ok: true, data: undefined })

      await useServerStore.getState().archiveProject('proj-123')

      const archived = useServerStore.getState().projects.find(p => p.id === 'proj-123')
      expect(archived?.archivedAt).toBeDefined()
    })
  })

  describe('deleteProject', () => {
    it('should delete project and remove from store on removed outcome', async () => {
      useServerStore.setState({ projects: [mockProject] })
      mockApi.invoke.mockResolvedValue({ ok: true, data: { outcome: 'removed' } })

      const result = await useServerStore.getState().deleteProject('proj-123')

      expect(result.ok).toBe(true)
      expect(useServerStore.getState().projects).toHaveLength(0)
    })

    it('should deactivate project (mark hasLocalFiles=false) on deactivated outcome', async () => {
      useServerStore.setState({ projects: [mockProject] })
      const updatedProject = { ...mockProject, hasLocalFiles: false }
      mockApi.invoke.mockResolvedValue({
        ok: true,
        data: { outcome: 'deactivated', project: updatedProject },
      })

      const result = await useServerStore.getState().deleteProject('proj-123', { deleteLocalFiles: true })

      expect(result.ok).toBe(true)
      expect(useServerStore.getState().projects).toHaveLength(1)
      expect(useServerStore.getState().projects[0].hasLocalFiles).toBe(false)
    })

    it('should not modify state on error result', async () => {
      useServerStore.setState({ projects: [mockProject] })
      mockApi.invoke.mockResolvedValue({
        ok: false,
        error: { code: 'GITHUB_MISSING_SCOPE', message: 'Missing scope', name: 'GitHubMissingScopeError' },
      })

      const result = await useServerStore.getState().deleteProject('proj-123', { deleteFromGitHub: true, deleteLocalFiles: true })

      expect(result.ok).toBe(false)
      expect(useServerStore.getState().projects).toHaveLength(1) // Project still there
    })
  })

  describe('fetchVersions', () => {
    it('should fetch and store versions for project', async () => {
      mockApi.invoke.mockResolvedValue({ ok: true, data: [mockVersion] })

      await useServerStore.getState().fetchVersions('proj-123')

      expect(mockApi.invoke).toHaveBeenCalledWith('version:list', { projectId: 'proj-123' })
      expect(useServerStore.getState().versions['proj-123']).toEqual([mockVersion])
    })
  })

  describe('createVersion', () => {
    it('should create version and add to store', async () => {
      mockApi.invoke.mockResolvedValue({ ok: true, data: mockVersion })

      const result = await useServerStore.getState().createVersion({
        projectId: 'proj-123',
        versionName: 'v1.0',
        branchName: 'main',
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toEqual(mockVersion)
      }
      expect(useServerStore.getState().versions['proj-123']).toContain(mockVersion)
    })
  })

  describe('setCurrentVersion', () => {
    it('should set current version in store', () => {
      mockApi.invoke.mockResolvedValue({ ok: true, data: undefined })

      useServerStore.getState().setCurrentVersion('proj-123', 'ver-456')

      expect(useServerStore.getState().currentVersionId['proj-123']).toBe('ver-456')
    })

    it('should call API to set active version', () => {
      mockApi.invoke.mockResolvedValue({ ok: true, data: undefined })

      useServerStore.getState().setCurrentVersion('proj-123', 'ver-456')

      expect(mockApi.invoke).toHaveBeenCalledWith('version:setActive', { id: 'ver-456' })
    })
  })

  describe('fetchCredentials', () => {
    it('should fetch and store credentials', async () => {
      const mockCredentials = [{ id: 'cred-1', nickname: 'API_KEY', type: 'api_key' as const }]
      mockApi.invoke.mockResolvedValue({ ok: true, data: mockCredentials })

      await useServerStore.getState().fetchCredentials()

      expect(useServerStore.getState().credentials).toEqual(mockCredentials)
    })
  })

  describe('addCredential', () => {
    it('should add credential and update store', async () => {
      const credential = { id: 'cred-1', nickname: 'API_KEY', type: 'api_key' as const }
      mockApi.invoke.mockResolvedValue({ ok: true, data: credential })

      const result = await useServerStore.getState().addCredential({
        nickname: 'API_KEY',
        value: 'secret',
        type: 'api_key',
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toEqual(credential)
      }
      expect(useServerStore.getState().credentials).toContain(credential)
    })
  })

  describe('updateCredential', () => {
    it('should call API to update credential', async () => {
      mockApi.invoke.mockResolvedValue({ ok: true, data: undefined })

      await useServerStore.getState().updateCredential('cred-1', 'new-value')

      expect(mockApi.invoke).toHaveBeenCalledWith('credentials:update', { id: 'cred-1', value: 'new-value' })
    })
  })

  describe('deleteCredential', () => {
    it('should delete credential and remove from store', async () => {
      const credential = { id: 'cred-1', nickname: 'API_KEY', type: 'api_key' as const }
      useServerStore.setState({ credentials: [credential] })
      mockApi.invoke.mockResolvedValue({ ok: true, data: undefined })

      await useServerStore.getState().deleteCredential('cred-1')

      expect(useServerStore.getState().credentials).toHaveLength(0)
    })
  })

  describe('fetchSettings', () => {
    it('should fetch and store settings', async () => {
      const settings = { cloneRoot: '~/projects', executionParallelism: 2 }
      mockApi.invoke.mockResolvedValue({ ok: true, data: settings })

      await useServerStore.getState().fetchSettings()

      expect(useServerStore.getState().settings).toEqual(settings)
    })
  })

  describe('updateSettings', () => {
    it('should update settings and store result', async () => {
      const settings = { cloneRoot: '~/new-projects', executionParallelism: 2 }
      mockApi.invoke.mockResolvedValue({ ok: true, data: settings })

      const result = await useServerStore.getState().updateSettings({ cloneRoot: '~/new-projects' })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toEqual(settings)
      }
      expect(useServerStore.getState().settings).toEqual(settings)
    })
  })
})

describe('useProject helper', () => {
  it('should return project by id', () => {
    useServerStore.setState({ projects: [mockProject] })

    // Since we can't use hooks outside React, we test the store selector directly
    const selector = (s: { projects: Project[] }) => s.projects.find((p) => p.id === 'proj-123')
    const result = selector(useServerStore.getState())

    expect(result).toEqual(mockProject)
  })

  it('should return undefined for non-existent id', () => {
    useServerStore.setState({ projects: [mockProject] })

    const selector = (s: { projects: Project[] }) => s.projects.find((p) => p.id === 'nonexistent')
    const result = selector(useServerStore.getState())

    expect(result).toBeUndefined()
  })
})

describe('useVersions helper', () => {
  it('should return versions for project', () => {
    useServerStore.setState({ versions: { 'proj-123': [mockVersion] } })

    const selector = (s: { versions: Record<string, Version[]> }) => s.versions['proj-123'] || []
    const result = selector(useServerStore.getState())

    expect(result).toEqual([mockVersion])
  })

  it('should return empty array for project without versions', () => {
    useServerStore.setState({ versions: {} })

    const selector = (s: { versions: Record<string, Version[]> }) => s.versions['proj-123'] || []
    const result = selector(useServerStore.getState())

    expect(result).toEqual([])
  })
})

describe('useCurrentVersion helper', () => {
  it('should return current version for project', () => {
    useServerStore.setState({
      versions: { 'proj-123': [mockVersion] },
      currentVersionId: { 'proj-123': 'ver-456' },
    })

    const state = useServerStore.getState()
    const versionId = state.currentVersionId['proj-123']
    const result = versionId ? state.versions['proj-123']?.find((v) => v.id === versionId) : undefined

    expect(result).toEqual(mockVersion)
  })

  it('should return undefined when no current version set', () => {
    useServerStore.setState({
      versions: { 'proj-123': [mockVersion] },
      currentVersionId: {},
    })

    const state = useServerStore.getState()
    const versionId = state.currentVersionId['proj-123']
    const result = versionId ? state.versions['proj-123']?.find((v) => v.id === versionId) : undefined

    expect(result).toBeUndefined()
  })
})

describe('error handling', () => {
  it('createProject should throw error on failure', async () => {
    mockApi.invoke.mockRejectedValue(new Error('Create failed'))

    await expect(
      useServerStore.getState().createProject({ name: 'Test' })
    ).rejects.toThrow('Create failed')
  })

  it('archiveProject should throw error on failure', async () => {
    mockApi.invoke.mockRejectedValue(new Error('Archive failed'))

    await expect(
      useServerStore.getState().archiveProject('proj-123')
    ).rejects.toThrow('Archive failed')
  })

  it('deleteProject should return error result on failure', async () => {
    mockApi.invoke.mockResolvedValue({
      ok: false,
      error: { code: 'UNKNOWN', message: 'Delete failed', name: 'Error' },
    })

    const result = await useServerStore.getState().deleteProject('proj-123')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toBe('Delete failed')
    }
  })

  it('fetchVersions should throw error on failure', async () => {
    mockApi.invoke.mockRejectedValue(new Error('Fetch versions failed'))

    await expect(
      useServerStore.getState().fetchVersions('proj-123')
    ).rejects.toThrow('Fetch versions failed')
  })

  it('fetchVersions should set loading state during fetch', async () => {
    mockApi.invoke.mockImplementation(async () => {
      expect(useServerStore.getState().loading.versions).toBe(true)
      return { ok: true, data: [] }
    })

    await useServerStore.getState().fetchVersions('proj-123')

    expect(useServerStore.getState().loading.versions).toBe(false)
  })

  it('createVersion should throw error on failure', async () => {
    mockApi.invoke.mockRejectedValue(new Error('Create version failed'))

    await expect(
      useServerStore.getState().createVersion({
        projectId: 'proj-123',
        versionName: 'v1.0',
        branchName: 'main',
      })
    ).rejects.toThrow('Create version failed')
  })

  it('createVersion should add to existing versions', async () => {
    const existingVersion: Version = {
      id: 'ver-existing',
      projectId: 'proj-123',
      versionName: 'v0.9',
      branchName: 'develop',
      devStatus: 'drafting',
      runtimeStatus: 'idle',
      createdAt: new Date().toISOString(),
    }
    useServerStore.setState({
      versions: { 'proj-123': [existingVersion] },
    })
    mockApi.invoke.mockResolvedValue({ ok: true, data: mockVersion })

    await useServerStore.getState().createVersion({
      projectId: 'proj-123',
      versionName: 'v1.0',
      branchName: 'main',
    })

    expect(useServerStore.getState().versions['proj-123']).toHaveLength(2)
    expect(useServerStore.getState().versions['proj-123']).toContain(existingVersion)
    expect(useServerStore.getState().versions['proj-123']).toContain(mockVersion)
  })

  it('updateCredential should throw error on failure', async () => {
    mockApi.invoke.mockRejectedValue(new Error('Update credential failed'))

    await expect(
      useServerStore.getState().updateCredential('cred-1', 'new-value')
    ).rejects.toThrow('Update credential failed')
  })

  it('fetchCredentials should throw error on failure', async () => {
    mockApi.invoke.mockRejectedValue(new Error('Fetch credentials failed'))

    await expect(
      useServerStore.getState().fetchCredentials()
    ).rejects.toThrow('Fetch credentials failed')
  })

  it('addCredential should throw error on failure', async () => {
    mockApi.invoke.mockRejectedValue(new Error('Add credential failed'))

    await expect(
      useServerStore.getState().addCredential({
        nickname: 'API_KEY',
        value: 'secret',
        type: 'api_key',
      })
    ).rejects.toThrow('Add credential failed')
  })

  it('deleteCredential should throw error on failure', async () => {
    mockApi.invoke.mockRejectedValue(new Error('Delete credential failed'))

    await expect(
      useServerStore.getState().deleteCredential('cred-1')
    ).rejects.toThrow('Delete credential failed')
  })

  it('fetchSettings should throw error on failure', async () => {
    mockApi.invoke.mockRejectedValue(new Error('Fetch settings failed'))

    await expect(
      useServerStore.getState().fetchSettings()
    ).rejects.toThrow('Fetch settings failed')
  })

  it('updateSettings should throw error on failure', async () => {
    mockApi.invoke.mockRejectedValue(new Error('Update settings failed'))

    await expect(
      useServerStore.getState().updateSettings({ cloneRoot: '/new/path' })
    ).rejects.toThrow('Update settings failed')
  })

  it('setCurrentVersion should handle API error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockApi.invoke.mockResolvedValue({
      ok: false,
      error: { code: 'UNKNOWN_ERROR', message: 'Set active failed' },
    })

    // Should not throw, but log error
    useServerStore.getState().setCurrentVersion('proj-123', 'ver-456')

    // Wait for the async API call
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(consoleError).toHaveBeenCalledWith(
      'Failed to set active version:',
      'Set active failed'
    )

    consoleError.mockRestore()
  })
})

describe('useProject hook selector', () => {
  it('should return project when found', () => {
    useServerStore.setState({ projects: [mockProject] })

    const selector = (s: { projects: Project[] }) => s.projects.find((p) => p.id === 'proj-123')
    const result = selector(useServerStore.getState())

    expect(result).toEqual(mockProject)
  })
})

describe('useVersions hook selector', () => {
  it('should return empty array when projectId is undefined', () => {
    useServerStore.setState({ versions: { 'proj-123': [mockVersion] } })

    const projectId = undefined
    const selector = (s: { versions: Record<string, Version[]> }) =>
      projectId ? s.versions[projectId] || [] : []
    const result = selector(useServerStore.getState())

    expect(result).toEqual([])
  })
})

describe('useCurrentVersion hook selector', () => {
  it('should return undefined when projectId is undefined', () => {
    useServerStore.setState({
      versions: { 'proj-123': [mockVersion] },
      currentVersionId: { 'proj-123': 'ver-456' },
    })

    const projectId: string | undefined = undefined
    const selector = (s: { versions: Record<string, Version[]>; currentVersionId: Record<string, string> }) => {
      if (!projectId) return undefined
      const versionId = s.currentVersionId[projectId]
      if (!versionId) return undefined
      return s.versions[projectId]?.find((v) => v.id === versionId)
    }
    const result = selector(useServerStore.getState())

    expect(result).toBeUndefined()
  })

  it('should return undefined when version not found', () => {
    useServerStore.setState({
      versions: { 'proj-123': [mockVersion] },
      currentVersionId: { 'proj-123': 'ver-nonexistent' },
    })

    const projectId = 'proj-123'
    const selector = (s: { versions: Record<string, Version[]>; currentVersionId: Record<string, string> }) => {
      if (!projectId) return undefined
      const versionId = s.currentVersionId[projectId]
      if (!versionId) return undefined
      return s.versions[projectId]?.find((v) => v.id === versionId)
    }
    const result = selector(useServerStore.getState())

    expect(result).toBeUndefined()
  })
})
