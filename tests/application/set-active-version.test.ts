/**
 * Set Active Version Use Case Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActiveVersion, SetActiveVersionDeps } from '../../src/main/application/use-cases/version/set-active-version'
import { ValidationError, NotFoundError } from '../../src/shared/errors'
import type { Version } from '../../src/shared/types/domain.types'

const mockVersion: Version = {
  id: 'ver-456',
  projectId: 'proj-123',
  versionName: 'v1.0',
  branchName: 'main',
  devStatus: 'drafting',
  runtimeStatus: 'idle',
  createdAt: new Date().toISOString(),
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

describe('setActiveVersion', () => {
  let deps: SetActiveVersionDeps

  beforeEach(() => {
    deps = {
      versionRepo: createMockVersionRepo(),
    }
  })

  describe('validation', () => {
    it('should throw ValidationError when id is empty', async () => {
      await expect(
        setActiveVersion({ id: '' }, deps)
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError when id is whitespace only', async () => {
      await expect(
        setActiveVersion({ id: '   ' }, deps)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('entity lookup', () => {
    it('should throw NotFoundError when version does not exist', async () => {
      vi.mocked(deps.versionRepo.findById).mockResolvedValue(null)

      await expect(
        setActiveVersion({ id: 'nonexistent' }, deps)
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('set active', () => {
    it('should return version when found', async () => {
      vi.mocked(deps.versionRepo.findById).mockResolvedValue(mockVersion)

      const result = await setActiveVersion({ id: 'ver-456' }, deps)

      expect(result).toEqual(mockVersion)
      expect(deps.versionRepo.findById).toHaveBeenCalledWith('ver-456')
    })
  })
})
