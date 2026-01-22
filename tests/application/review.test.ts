/**
 * Review Use Cases Unit Tests
 * Tests for getTodo, readTodoRaw, saveTodoRaw, feedback, and approve use cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { join } from 'path'
import {
  getTodo,
  GetTodoDeps,
  readTodoRaw,
  ReadTodoRawDeps,
  saveTodoRaw,
  SaveTodoRawDeps,
  addFeedback,
  AddFeedbackDeps,
  getFeedback,
  GetFeedbackDeps,
  clearFeedback,
  ClearFeedbackDeps,
  approveReview,
  ApproveReviewDeps,
} from '../../src/main/application/use-cases/review'
import {
  setConfigDir,
  clearConfigCache,
} from '../../src/main/infrastructure/config-loader/yaml-config-loader'
import { ValidationError, NotFoundError, FileNotFoundError } from '../../src/shared/errors'
import type { Project, Version } from '../../src/shared/types/domain.types'
import type { Feedback } from '../../src/shared/types/execution.types'

// Point to the actual config directory in the project
const CONFIG_DIR = join(__dirname, '../../config')

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
  devStatus: 'reviewing',
  runtimeStatus: 'idle',
  createdAt: new Date().toISOString(),
}

const mockFeedback: Feedback = {
  id: 'fb-789',
  versionId: 'ver-456',
  content: 'Please add more tasks for testing',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// Create mock dependencies factory
function createMockDeps() {
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
    feedbackRepo: {
      findByVersionId: vi.fn(),
      upsert: vi.fn(),
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

describe('getTodo', () => {
  let deps: ReturnType<typeof createMockDeps>

  beforeEach(() => {
    deps = createMockDeps()
    vi.mocked(deps.versionRepo.findById).mockResolvedValue(mockVersion)
    vi.mocked(deps.projectRepo.findById).mockResolvedValue(mockProject)
  })

  describe('validation', () => {
    it('should throw ValidationError when versionId is empty', async () => {
      await expect(
        getTodo({ versionId: '' }, deps as GetTodoDeps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when versionId is whitespace only', async () => {
      await expect(
        getTodo({ versionId: '   ' }, deps as GetTodoDeps)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('entity lookup', () => {
    it('should throw NotFoundError when version does not exist', async () => {
      vi.mocked(deps.versionRepo.findById).mockResolvedValue(null)

      await expect(
        getTodo({ versionId: 'nonexistent' }, deps as GetTodoDeps)
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw NotFoundError when project does not exist', async () => {
      vi.mocked(deps.projectRepo.findById).mockResolvedValue(null)

      await expect(
        getTodo({ versionId: 'ver-456' }, deps as GetTodoDeps)
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('file reading', () => {
    it('should return empty plan when TODO.md does not exist', async () => {
      vi.mocked(deps.fs.readFile).mockRejectedValue(new Error('ENOENT'))

      const result = await getTodo({ versionId: 'ver-456' }, deps as GetTodoDeps)

      expect(result.milestones).toHaveLength(0)
      expect(result.totalTasks).toBe(0)
      expect(result.completedTasks).toBe(0)
    })

    it('should parse TODO.md and MILESTONES correctly', async () => {
      const todoContent = `# TODO

> Project: test-project

## M1: Setup
- [ ] 001. Initialize project
- [x] 002. Add config
`
      const milestoneContent = `# M1: Setup

> Set up the project

## Tasks

### 001. Initialize project

**Description:**
Create the initial structure

**Verification:**
Files exist

**Depends:** none

---

### 002. Add config

**Description:**
Add configuration files

**Verification:**
Config files exist

**Depends:** 001

---
`
      vi.mocked(deps.fs.readFile).mockImplementation(async (path: string) => {
        if (path.endsWith('TODO.md')) return todoContent
        if (path.includes('MILESTONES')) return milestoneContent
        throw new Error('File not found')
      })
      vi.mocked(deps.fs.readDir).mockResolvedValue(['M1-setup.md'])

      const result = await getTodo({ versionId: 'ver-456' }, deps as GetTodoDeps)

      expect(result.milestones).toHaveLength(1)
      expect(result.milestones[0].id).toBe('M1')
      expect(result.milestones[0].name).toBe('Setup')
      expect(result.milestones[0].tasks).toHaveLength(2)
      expect(result.totalTasks).toBe(2)
      expect(result.completedTasks).toBe(1)
    })

    it('should handle missing MILESTONES directory gracefully', async () => {
      const todoContent = `# TODO

## M1: Setup
- [ ] 001. Task one
`
      vi.mocked(deps.fs.readFile).mockResolvedValue(todoContent)
      vi.mocked(deps.fs.readDir).mockRejectedValue(new Error('ENOENT'))

      const result = await getTodo({ versionId: 'ver-456' }, deps as GetTodoDeps)

      expect(result.milestones).toHaveLength(1)
      expect(result.milestones[0].tasks).toHaveLength(1)
    })
  })
})

describe('readTodoRaw', () => {
  let deps: ReturnType<typeof createMockDeps>

  beforeEach(() => {
    deps = createMockDeps()
    vi.mocked(deps.versionRepo.findById).mockResolvedValue(mockVersion)
    vi.mocked(deps.projectRepo.findById).mockResolvedValue(mockProject)
  })

  describe('validation', () => {
    it('should throw ValidationError when versionId is empty', async () => {
      await expect(
        readTodoRaw({ versionId: '' }, deps as ReadTodoRawDeps)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('file reading', () => {
    it('should return file content when file exists', async () => {
      const content = '# TODO\n\n## M1: Setup\n- [ ] 001. Task'
      vi.mocked(deps.fs.readFile).mockResolvedValue(content)

      const result = await readTodoRaw({ versionId: 'ver-456' }, deps as ReadTodoRawDeps)

      expect(result).toBe(content)
      expect(deps.fs.readFile).toHaveBeenCalledWith('/path/to/project/META/TODO.md')
    })

    it('should return empty string when file does not exist', async () => {
      vi.mocked(deps.fs.readFile).mockRejectedValue(
        new FileNotFoundError('/path/to/project/META/TODO.md')
      )

      const result = await readTodoRaw({ versionId: 'ver-456' }, deps as ReadTodoRawDeps)

      expect(result).toBe('')
    })
  })
})

describe('saveTodoRaw', () => {
  let deps: ReturnType<typeof createMockDeps>

  beforeEach(() => {
    deps = createMockDeps()
    vi.mocked(deps.versionRepo.findById).mockResolvedValue(mockVersion)
    vi.mocked(deps.projectRepo.findById).mockResolvedValue(mockProject)
    vi.mocked(deps.fs.writeFile).mockResolvedValue(undefined)
  })

  describe('validation', () => {
    it('should throw ValidationError when versionId is empty', async () => {
      await expect(
        saveTodoRaw({ versionId: '', content: 'test' }, deps as SaveTodoRawDeps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when content is undefined', async () => {
      await expect(
        saveTodoRaw({ versionId: 'ver-456', content: undefined as never }, deps as SaveTodoRawDeps)
      ).rejects.toThrow(ValidationError)
    })

    it('should allow empty string as content', async () => {
      await expect(
        saveTodoRaw({ versionId: 'ver-456', content: '' }, deps as SaveTodoRawDeps)
      ).resolves.not.toThrow()
    })
  })

  describe('file writing', () => {
    it('should write file content correctly', async () => {
      const content = '# TODO\n\nUpdated content.'

      await saveTodoRaw({ versionId: 'ver-456', content }, deps as SaveTodoRawDeps)

      expect(deps.fs.writeFile).toHaveBeenCalledWith('/path/to/project/META/TODO.md', content)
    })
  })
})

describe('addFeedback', () => {
  let deps: ReturnType<typeof createMockDeps>

  beforeEach(() => {
    deps = createMockDeps()
    vi.mocked(deps.versionRepo.findById).mockResolvedValue(mockVersion)
    vi.mocked(deps.feedbackRepo.upsert).mockResolvedValue(mockFeedback)
  })

  describe('validation', () => {
    it('should throw ValidationError when versionId is empty', async () => {
      await expect(
        addFeedback({ versionId: '', feedback: 'test' }, deps as AddFeedbackDeps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when feedback is empty', async () => {
      await expect(
        addFeedback({ versionId: 'ver-456', feedback: '' }, deps as AddFeedbackDeps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when feedback is whitespace only', async () => {
      await expect(
        addFeedback({ versionId: 'ver-456', feedback: '   ' }, deps as AddFeedbackDeps)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('entity lookup', () => {
    it('should throw NotFoundError when version does not exist', async () => {
      vi.mocked(deps.versionRepo.findById).mockResolvedValue(null)

      await expect(
        addFeedback({ versionId: 'nonexistent', feedback: 'test' }, deps as AddFeedbackDeps)
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('feedback creation', () => {
    it('should upsert feedback correctly', async () => {
      const feedback = 'Please add more tests'

      const result = await addFeedback(
        { versionId: 'ver-456', feedback },
        deps as AddFeedbackDeps
      )

      expect(deps.feedbackRepo.upsert).toHaveBeenCalledWith({
        versionId: 'ver-456',
        content: feedback,
      })
      expect(result).toEqual(mockFeedback)
    })
  })
})

describe('getFeedback', () => {
  let deps: ReturnType<typeof createMockDeps>

  beforeEach(() => {
    deps = createMockDeps()
    vi.mocked(deps.versionRepo.findById).mockResolvedValue(mockVersion)
  })

  describe('validation', () => {
    it('should throw ValidationError when versionId is empty', async () => {
      await expect(
        getFeedback({ versionId: '' }, deps as GetFeedbackDeps)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('feedback retrieval', () => {
    it('should return feedback when it exists', async () => {
      vi.mocked(deps.feedbackRepo.findByVersionId).mockResolvedValue(mockFeedback)

      const result = await getFeedback({ versionId: 'ver-456' }, deps as GetFeedbackDeps)

      expect(result).toEqual(mockFeedback)
    })

    it('should return null when no feedback exists', async () => {
      vi.mocked(deps.feedbackRepo.findByVersionId).mockResolvedValue(null)

      const result = await getFeedback({ versionId: 'ver-456' }, deps as GetFeedbackDeps)

      expect(result).toBeNull()
    })
  })
})

describe('clearFeedback', () => {
  let deps: ReturnType<typeof createMockDeps>

  beforeEach(() => {
    deps = createMockDeps()
    vi.mocked(deps.versionRepo.findById).mockResolvedValue(mockVersion)
    vi.mocked(deps.feedbackRepo.delete).mockResolvedValue(undefined)
  })

  describe('validation', () => {
    it('should throw ValidationError when versionId is empty', async () => {
      await expect(
        clearFeedback({ versionId: '' }, deps as ClearFeedbackDeps)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('entity lookup', () => {
    it('should throw NotFoundError when version does not exist', async () => {
      vi.mocked(deps.versionRepo.findById).mockResolvedValue(null)

      await expect(
        clearFeedback({ versionId: 'nonexistent' }, deps as ClearFeedbackDeps)
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('feedback deletion', () => {
    it('should delete feedback correctly', async () => {
      await clearFeedback({ versionId: 'ver-456' }, deps as ClearFeedbackDeps)

      expect(deps.feedbackRepo.delete).toHaveBeenCalledWith('ver-456')
    })
  })
})

describe('approveReview', () => {
  let deps: ReturnType<typeof createMockDeps>

  beforeEach(() => {
    // Set config directory for state machine loading
    setConfigDir(CONFIG_DIR)
    clearConfigCache()

    deps = createMockDeps()
    vi.mocked(deps.versionRepo.findById).mockResolvedValue(mockVersion)
    vi.mocked(deps.versionRepo.updateStatus).mockResolvedValue(undefined)
  })

  afterEach(() => {
    setConfigDir(null)
    clearConfigCache()
  })

  describe('validation', () => {
    it('should throw ValidationError when versionId is empty', async () => {
      await expect(
        approveReview({ versionId: '' }, deps as ApproveReviewDeps)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('entity lookup', () => {
    it('should throw NotFoundError when version does not exist', async () => {
      vi.mocked(deps.versionRepo.findById).mockResolvedValue(null)

      await expect(
        approveReview({ versionId: 'nonexistent' }, deps as ApproveReviewDeps)
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('state transition', () => {
    it('should throw ValidationError when not in reviewing state', async () => {
      const draftingVersion = { ...mockVersion, devStatus: 'drafting' as const }
      vi.mocked(deps.versionRepo.findById).mockResolvedValue(draftingVersion)

      await expect(
        approveReview({ versionId: 'ver-456' }, deps as ApproveReviewDeps)
      ).rejects.toThrow(ValidationError)
    })

    it('should transition to ready state when in reviewing state', async () => {
      await approveReview({ versionId: 'ver-456' }, deps as ApproveReviewDeps)

      expect(deps.versionRepo.updateStatus).toHaveBeenCalledWith('ver-456', {
        devStatus: 'ready',
      })
    })
  })
})
