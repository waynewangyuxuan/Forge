/**
 * Project Use Cases Unit Tests
 * Tests for project CRUD operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProject, GetProjectDeps } from '../../src/main/application/use-cases/project/get-project'
import { listProjects, ListProjectsDeps } from '../../src/main/application/use-cases/project/list-projects'
import { archiveProject, ArchiveProjectDeps } from '../../src/main/application/use-cases/project/archive-project'
import { deleteProject, DeleteProjectDeps } from '../../src/main/application/use-cases/project/delete-project'
import { ValidationError, NotFoundError } from '../../src/shared/errors'
import type { Project } from '../../src/shared/types/domain.types'

// Mock project data
const mockProject: Project = {
  id: 'proj-123',
  name: 'Test Project',
  path: '/path/to/project',
  createdAt: new Date().toISOString(),
  archivedAt: null,
  githubOwner: 'testuser',
  githubRepo: 'test-project',
}

const mockArchivedProject: Project = {
  ...mockProject,
  id: 'proj-456',
  archivedAt: new Date().toISOString(),
}

// Create mock project repository
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

describe('getProject', () => {
  let deps: GetProjectDeps

  beforeEach(() => {
    deps = {
      projectRepo: createMockProjectRepo(),
    }
  })

  describe('validation', () => {
    it('should throw ValidationError when id is empty', async () => {
      await expect(
        getProject({ id: '' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when id is whitespace only', async () => {
      await expect(
        getProject({ id: '   ' }, deps)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('retrieval', () => {
    it('should return project when found', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(mockProject)

      const result = await getProject({ id: 'proj-123' }, deps)

      expect(result).toEqual(mockProject)
      expect(deps.projectRepo.findById).toHaveBeenCalledWith('proj-123')
    })

    it('should throw NotFoundError when project does not exist', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(null)

      await expect(
        getProject({ id: 'nonexistent' }, deps)
      ).rejects.toThrow(NotFoundError)
    })
  })
})

describe('listProjects', () => {
  let deps: ListProjectsDeps

  beforeEach(() => {
    deps = {
      projectRepo: createMockProjectRepo(),
    }
  })

  it('should call findAll without includeArchived by default', async () => {
    vi.mocked(deps.projectRepo.findAll).mockResolvedValue([mockProject])

    await listProjects({}, deps)

    expect(deps.projectRepo.findAll).toHaveBeenCalledWith({ includeArchived: false })
  })

  it('should pass includeArchived when set to true', async () => {
    vi.mocked(deps.projectRepo.findAll).mockResolvedValue([mockProject, mockArchivedProject])

    await listProjects({ includeArchived: true }, deps)

    expect(deps.projectRepo.findAll).toHaveBeenCalledWith({ includeArchived: true })
  })

  it('should return all projects from repository', async () => {
    const projects = [mockProject]
    vi.mocked(deps.projectRepo.findAll).mockResolvedValue(projects)

    const result = await listProjects({}, deps)

    expect(result).toEqual(projects)
  })

  it('should return empty array when no projects exist', async () => {
    vi.mocked(deps.projectRepo.findAll).mockResolvedValue([])

    const result = await listProjects({}, deps)

    expect(result).toEqual([])
  })
})

describe('archiveProject', () => {
  let deps: ArchiveProjectDeps

  beforeEach(() => {
    deps = {
      projectRepo: createMockProjectRepo(),
    }
  })

  describe('validation', () => {
    it('should throw ValidationError when id is empty', async () => {
      await expect(
        archiveProject({ id: '' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when id is whitespace only', async () => {
      await expect(
        archiveProject({ id: '   ' }, deps)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('entity lookup', () => {
    it('should throw NotFoundError when project does not exist', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(null)

      await expect(
        archiveProject({ id: 'nonexistent' }, deps)
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('archiving', () => {
    it('should archive a non-archived project', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(mockProject)
      vi.mocked(deps.projectRepo.archive).mockResolvedValue(undefined)

      await archiveProject({ id: 'proj-123' }, deps)

      expect(deps.projectRepo.archive).toHaveBeenCalledWith('proj-123')
    })

    it('should no-op for already archived project', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(mockArchivedProject)

      await archiveProject({ id: 'proj-456' }, deps)

      expect(deps.projectRepo.archive).not.toHaveBeenCalled()
    })
  })
})

describe('deleteProject', () => {
  let deps: DeleteProjectDeps

  beforeEach(() => {
    deps = {
      projectRepo: createMockProjectRepo(),
    }
  })

  describe('validation', () => {
    it('should throw ValidationError when id is empty', async () => {
      await expect(
        deleteProject({ id: '' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when id is whitespace only', async () => {
      await expect(
        deleteProject({ id: '   ' }, deps)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('entity lookup', () => {
    it('should throw NotFoundError when project does not exist', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(null)

      await expect(
        deleteProject({ id: 'nonexistent' }, deps)
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('deletion', () => {
    it('should delete a project and return removed outcome', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(mockProject)
      vi.mocked(deps.projectRepo.delete).mockResolvedValue(undefined)

      const result = await deleteProject({ id: 'proj-123' }, deps)

      expect(deps.projectRepo.delete).toHaveBeenCalledWith('proj-123')
      expect(result.outcome).toBe('removed')
    })

    it('should delete an archived project and return removed outcome', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(mockArchivedProject)
      vi.mocked(deps.projectRepo.delete).mockResolvedValue(undefined)

      const result = await deleteProject({ id: 'proj-456' }, deps)

      expect(deps.projectRepo.delete).toHaveBeenCalledWith('proj-456')
      expect(result.outcome).toBe('removed')
    })
  })

  describe('invariant enforcement', () => {
    it('should throw ValidationError when deleteFromGitHub is true but deleteLocalFiles is false', async () => {
      await expect(
        deleteProject({ id: 'proj-123', deleteFromGitHub: true, deleteLocalFiles: false }, deps)
      ).rejects.toThrow(ValidationError)
    })
  })
})
