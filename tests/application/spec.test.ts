/**
 * Spec Use Cases Unit Tests
 * Tests for readSpec and saveSpec use cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readSpec, ReadSpecDeps } from '../../src/main/application/use-cases/spec/read-spec'
import { saveSpec, SaveSpecDeps } from '../../src/main/application/use-cases/spec/save-spec'
import { ValidationError, NotFoundError, FileNotFoundError } from '../../src/shared/errors'
import type { Project, Version } from '../../src/shared/types/domain.types'

// Mock data
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

// Create mock dependencies factory
function createMockDeps(): ReadSpecDeps & SaveSpecDeps {
  return {
    projectRepo: {
      findById: vi.fn(),
      findByPath: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      archive: vi.fn(),
      delete: vi.fn(),
    },
    versionRepo: {
      findById: vi.fn(),
      findByProject: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
    },
    fs: {
      readFile: vi.fn(),
      readDir: vi.fn(),
      exists: vi.fn(),
      isDirectory: vi.fn(),
      writeFile: vi.fn(),
      createDir: vi.fn(),
      copyDir: vi.fn(),
      remove: vi.fn(),
      watch: vi.fn(),
    },
  }
}

describe('readSpec', () => {
  let deps: ReadSpecDeps & SaveSpecDeps

  beforeEach(() => {
    deps = createMockDeps()
    vi.mocked(deps.versionRepo.findById).mockResolvedValue(mockVersion)
    vi.mocked(deps.projectRepo.findById).mockResolvedValue(mockProject)
  })

  describe('validation', () => {
    it('should throw ValidationError when versionId is empty', async () => {
      await expect(
        readSpec({ versionId: '', file: 'PRODUCT.md' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when versionId is whitespace only', async () => {
      await expect(
        readSpec({ versionId: '   ', file: 'PRODUCT.md' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid file name', async () => {
      await expect(
        readSpec({ versionId: 'ver-456', file: 'INVALID.md' as never }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when file is empty', async () => {
      await expect(
        readSpec({ versionId: 'ver-456', file: '' as never }, deps)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('entity lookup', () => {
    it('should throw NotFoundError when version does not exist', async () => {
      vi.mocked(deps.versionRepo.findById).mockResolvedValue(null)

      await expect(
        readSpec({ versionId: 'nonexistent', file: 'PRODUCT.md' }, deps)
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw NotFoundError when project does not exist', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(null)

      await expect(
        readSpec({ versionId: 'ver-456', file: 'PRODUCT.md' }, deps)
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('file reading', () => {
    it('should return file content when file exists', async () => {
      const content = '# Product Specification\n\nThis is the product spec.'
      vi.mocked(deps.fs.readFile).mockResolvedValue(content)

      const result = await readSpec({ versionId: 'ver-456', file: 'PRODUCT.md' }, deps)

      expect(result).toBe(content)
      expect(deps.fs.readFile).toHaveBeenCalledWith(
        '/path/to/project/META/CORE/PRODUCT.md'
      )
    })

    it('should return empty string when file does not exist', async () => {
      vi.mocked(deps.fs.readFile).mockRejectedValue(
        new FileNotFoundError('/path/to/project/META/CORE/PRODUCT.md')
      )

      const result = await readSpec({ versionId: 'ver-456', file: 'PRODUCT.md' }, deps)

      expect(result).toBe('')
    })

    it('should re-throw non-FileNotFoundError errors', async () => {
      const error = new Error('Permission denied')
      vi.mocked(deps.fs.readFile).mockRejectedValue(error)

      await expect(
        readSpec({ versionId: 'ver-456', file: 'PRODUCT.md' }, deps)
      ).rejects.toThrow('Permission denied')
    })

    it('should read TECHNICAL.md correctly', async () => {
      vi.mocked(deps.fs.readFile).mockResolvedValue('# Technical Spec')

      const result = await readSpec({ versionId: 'ver-456', file: 'TECHNICAL.md' }, deps)

      expect(result).toBe('# Technical Spec')
      expect(deps.fs.readFile).toHaveBeenCalledWith(
        '/path/to/project/META/CORE/TECHNICAL.md'
      )
    })

    it('should read REGULATION.md correctly', async () => {
      vi.mocked(deps.fs.readFile).mockResolvedValue('# Regulation Spec')

      const result = await readSpec({ versionId: 'ver-456', file: 'REGULATION.md' }, deps)

      expect(result).toBe('# Regulation Spec')
      expect(deps.fs.readFile).toHaveBeenCalledWith(
        '/path/to/project/META/CORE/REGULATION.md'
      )
    })
  })
})

describe('saveSpec', () => {
  let deps: ReadSpecDeps & SaveSpecDeps

  beforeEach(() => {
    deps = createMockDeps()
    vi.mocked(deps.versionRepo.findById).mockResolvedValue(mockVersion)
    vi.mocked(deps.projectRepo.findById).mockResolvedValue(mockProject)
    vi.mocked(deps.fs.writeFile).mockResolvedValue(undefined)
  })

  describe('validation', () => {
    it('should throw ValidationError when versionId is empty', async () => {
      await expect(
        saveSpec({ versionId: '', file: 'PRODUCT.md', content: 'test' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when versionId is whitespace only', async () => {
      await expect(
        saveSpec({ versionId: '   ', file: 'PRODUCT.md', content: 'test' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid file name', async () => {
      await expect(
        saveSpec({ versionId: 'ver-456', file: 'README.md' as never, content: 'test' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when file is empty', async () => {
      await expect(
        saveSpec({ versionId: 'ver-456', file: '' as never, content: 'test' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when content is undefined', async () => {
      await expect(
        saveSpec({ versionId: 'ver-456', file: 'PRODUCT.md', content: undefined as never }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when content is null', async () => {
      await expect(
        saveSpec({ versionId: 'ver-456', file: 'PRODUCT.md', content: null as never }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should allow empty string as content', async () => {
      await expect(
        saveSpec({ versionId: 'ver-456', file: 'PRODUCT.md', content: '' }, deps)
      ).resolves.not.toThrow()
    })
  })

  describe('entity lookup', () => {
    it('should throw NotFoundError when version does not exist', async () => {
      vi.mocked(deps.versionRepo.findById).mockResolvedValue(null)

      await expect(
        saveSpec({ versionId: 'nonexistent', file: 'PRODUCT.md', content: 'test' }, deps)
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw NotFoundError when project does not exist', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(null)

      await expect(
        saveSpec({ versionId: 'ver-456', file: 'PRODUCT.md', content: 'test' }, deps)
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('file writing', () => {
    it('should write file content correctly', async () => {
      const content = '# Product Specification\n\nUpdated content.'

      await saveSpec({ versionId: 'ver-456', file: 'PRODUCT.md', content }, deps)

      expect(deps.fs.writeFile).toHaveBeenCalledWith(
        '/path/to/project/META/CORE/PRODUCT.md',
        content
      )
    })

    it('should write TECHNICAL.md correctly', async () => {
      const content = '# Technical Spec'

      await saveSpec({ versionId: 'ver-456', file: 'TECHNICAL.md', content }, deps)

      expect(deps.fs.writeFile).toHaveBeenCalledWith(
        '/path/to/project/META/CORE/TECHNICAL.md',
        content
      )
    })

    it('should write REGULATION.md correctly', async () => {
      const content = '# Regulation Spec'

      await saveSpec({ versionId: 'ver-456', file: 'REGULATION.md', content }, deps)

      expect(deps.fs.writeFile).toHaveBeenCalledWith(
        '/path/to/project/META/CORE/REGULATION.md',
        content
      )
    })

    it('should propagate write errors', async () => {
      const error = new Error('Disk full')
      vi.mocked(deps.fs.writeFile).mockRejectedValue(error)

      await expect(
        saveSpec({ versionId: 'ver-456', file: 'PRODUCT.md', content: 'test' }, deps)
      ).rejects.toThrow('Disk full')
    })

    it('should handle large content', async () => {
      const largeContent = '# Spec\n'.repeat(10000)

      await saveSpec({ versionId: 'ver-456', file: 'PRODUCT.md', content: largeContent }, deps)

      expect(deps.fs.writeFile).toHaveBeenCalledWith(
        '/path/to/project/META/CORE/PRODUCT.md',
        largeContent
      )
    })
  })
})
