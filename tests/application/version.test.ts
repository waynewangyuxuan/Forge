/**
 * Version Use Cases Unit Tests
 * Tests for version CRUD operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createVersion, CreateVersionDeps } from '../../src/main/application/use-cases/version/create-version'
import { getVersion, GetVersionDeps } from '../../src/main/application/use-cases/version/get-version'
import { listVersions, ListVersionsDeps } from '../../src/main/application/use-cases/version/list-versions'
import { ValidationError, NotFoundError } from '../../src/shared/errors'
import type { Project, Version } from '../../src/shared/types/domain.types'

// Mock data
const mockProject: Project = {
  id: 'proj-123',
  name: 'Test Project',
  path: '/path/to/project',
  createdAt: new Date().toISOString(),
  archivedAt: null,
}

const mockArchivedProject: Project = {
  ...mockProject,
  id: 'proj-archived',
  archivedAt: new Date().toISOString(),
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

// Create mock repositories
function createMockProjectRepo() {
  return {
    findById: vi.fn(),
    findByPath: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    delete: vi.fn(),
  }
}

function createMockVersionRepo() {
  return {
    findById: vi.fn(),
    findByProject: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
  }
}

describe('createVersion', () => {
  let deps: CreateVersionDeps

  beforeEach(() => {
    deps = {
      projectRepo: createMockProjectRepo(),
      versionRepo: createMockVersionRepo(),
    }
  })

  describe('validation', () => {
    it('should throw ValidationError when projectId is empty', async () => {
      await expect(
        createVersion({ projectId: '', versionName: 'v2.0', branchName: 'dev' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when projectId is whitespace only', async () => {
      await expect(
        createVersion({ projectId: '   ', versionName: 'v2.0', branchName: 'dev' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when versionName is empty', async () => {
      await expect(
        createVersion({ projectId: 'proj-123', versionName: '', branchName: 'dev' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when versionName is whitespace only', async () => {
      await expect(
        createVersion({ projectId: 'proj-123', versionName: '   ', branchName: 'dev' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when branchName is empty', async () => {
      await expect(
        createVersion({ projectId: 'proj-123', versionName: 'v2.0', branchName: '' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when branchName is whitespace only', async () => {
      await expect(
        createVersion({ projectId: 'proj-123', versionName: 'v2.0', branchName: '   ' }, deps)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('entity lookup', () => {
    it('should throw NotFoundError when project does not exist', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(null)

      await expect(
        createVersion({ projectId: 'nonexistent', versionName: 'v2.0', branchName: 'dev' }, deps)
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw ValidationError when project is archived', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(mockArchivedProject)

      await expect(
        createVersion({ projectId: 'proj-archived', versionName: 'v2.0', branchName: 'dev' }, deps)
      ).rejects.toThrow(ValidationError)

      const error = await createVersion({ projectId: 'proj-archived', versionName: 'v2.0', branchName: 'dev' }, deps)
        .catch((e) => e)
      expect(error.message).toContain('archived')
    })
  })

  describe('creation', () => {
    it('should create a version successfully', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(mockProject)
      vi.mocked(deps.versionRepo.create).mockResolvedValue(mockVersion)

      const result = await createVersion(
        { projectId: 'proj-123', versionName: 'v1.0', branchName: 'main' },
        deps
      )

      expect(result).toEqual(mockVersion)
      expect(deps.versionRepo.create).toHaveBeenCalledWith({
        projectId: 'proj-123',
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: 'drafting',
        runtimeStatus: 'not_configured',
      })
    })

    it('should trim whitespace from version and branch names', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(mockProject)
      vi.mocked(deps.versionRepo.create).mockResolvedValue(mockVersion)

      await createVersion(
        { projectId: 'proj-123', versionName: '  v2.0  ', branchName: '  feature/new  ' },
        deps
      )

      expect(deps.versionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          versionName: 'v2.0',
          branchName: 'feature/new',
        })
      )
    })
  })
})

describe('getVersion', () => {
  let deps: GetVersionDeps

  beforeEach(() => {
    deps = {
      versionRepo: createMockVersionRepo(),
    }
  })

  describe('validation', () => {
    it('should throw ValidationError when id is empty', async () => {
      await expect(
        getVersion({ id: '' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when id is whitespace only', async () => {
      await expect(
        getVersion({ id: '   ' }, deps)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('retrieval', () => {
    it('should return version when found', async () => {
      vi.mocked(deps.versionRepo.findById).mockResolvedValue(mockVersion)

      const result = await getVersion({ id: 'ver-456' }, deps)

      expect(result).toEqual(mockVersion)
      expect(deps.versionRepo.findById).toHaveBeenCalledWith('ver-456')
    })

    it('should throw NotFoundError when version does not exist', async () => {
      vi.mocked(deps.versionRepo.findById).mockResolvedValue(null)

      await expect(
        getVersion({ id: 'nonexistent' }, deps)
      ).rejects.toThrow(NotFoundError)
    })
  })
})

describe('listVersions', () => {
  let deps: ListVersionsDeps

  beforeEach(() => {
    deps = {
      projectRepo: createMockProjectRepo(),
      versionRepo: createMockVersionRepo(),
    }
  })

  describe('validation', () => {
    it('should throw ValidationError when projectId is empty', async () => {
      await expect(
        listVersions({ projectId: '' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when projectId is whitespace only', async () => {
      await expect(
        listVersions({ projectId: '   ' }, deps)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('entity lookup', () => {
    it('should throw NotFoundError when project does not exist', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(null)

      await expect(
        listVersions({ projectId: 'nonexistent' }, deps)
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('listing', () => {
    it('should return versions for existing project', async () => {
      const versions = [mockVersion]
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(mockProject)
      vi.mocked(deps.versionRepo.findByProject).mockResolvedValue(versions)

      const result = await listVersions({ projectId: 'proj-123' }, deps)

      expect(result).toEqual(versions)
      expect(deps.versionRepo.findByProject).toHaveBeenCalledWith('proj-123')
    })

    it('should return empty array when no versions exist', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(mockProject)
      vi.mocked(deps.versionRepo.findByProject).mockResolvedValue([])

      const result = await listVersions({ projectId: 'proj-123' }, deps)

      expect(result).toEqual([])
    })

    it('should work for archived projects', async () => {
      const versions = [mockVersion]
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(mockArchivedProject)
      vi.mocked(deps.versionRepo.findByProject).mockResolvedValue(versions)

      const result = await listVersions({ projectId: 'proj-archived' }, deps)

      expect(result).toEqual(versions)
    })
  })
})
