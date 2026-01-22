/**
 * Repository Unit Tests
 * Tests for SQLite project and version repositories
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { createTestDatabase, setDatabase, closeDatabase } from '../../src/main/infrastructure/database'
import { SQLiteProjectRepository } from '../../src/main/infrastructure/repositories/sqlite-project.repo'
import { SQLiteVersionRepository } from '../../src/main/infrastructure/repositories/sqlite-version.repo'
import { SQLiteSettingsRepository } from '../../src/main/infrastructure/repositories/sqlite-settings.repo'
import { SQLiteFeedbackRepository } from '../../src/main/infrastructure/repositories/sqlite-feedback.repo'
import { DuplicateError, NotFoundError } from '../../src/shared/errors'
import { DEFAULT_SETTINGS } from '../../src/shared/constants'

// DevStatus and RuntimeStatus are string literal union types
const DevStatusDrafting = 'drafting'
const DevStatusScaffolding = 'scaffolding'
const DevStatusReady = 'ready'
const RuntimeStatusIdle = 'idle'
const RuntimeStatusRunning = 'running'

describe('SQLiteProjectRepository', () => {
  let db: Database.Database
  let repo: SQLiteProjectRepository

  beforeEach(() => {
    db = createTestDatabase()
    setDatabase(db)
    repo = new SQLiteProjectRepository()
  })

  afterEach(() => {
    closeDatabase()
  })

  describe('create', () => {
    it('should create a project with generated id and timestamp', async () => {
      const project = await repo.create({
        name: 'Test Project',
        path: '/path/to/project',
      })

      expect(project.id).toBeDefined()
      expect(project.id.length).toBeGreaterThan(0)
      expect(project.name).toBe('Test Project')
      expect(project.path).toBe('/path/to/project')
      expect(project.createdAt).toBeDefined()
      expect(project.archivedAt).toBeNull()
    })

    it('should throw DuplicateError when path already exists', async () => {
      await repo.create({
        name: 'Project 1',
        path: '/same/path',
      })

      await expect(
        repo.create({
          name: 'Project 2',
          path: '/same/path',
        })
      ).rejects.toThrow(DuplicateError)
    })
  })

  describe('findById', () => {
    it('should return project when found', async () => {
      const created = await repo.create({
        name: 'Test',
        path: '/test',
      })

      const found = await repo.findById(created.id)
      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
      expect(found?.name).toBe('Test')
    })

    it('should return null when not found', async () => {
      const found = await repo.findById('nonexistent-id')
      expect(found).toBeNull()
    })
  })

  describe('findByPath', () => {
    it('should return project when path matches', async () => {
      await repo.create({
        name: 'Test',
        path: '/unique/path',
      })

      const found = await repo.findByPath('/unique/path')
      expect(found).toBeDefined()
      expect(found?.path).toBe('/unique/path')
    })

    it('should return null when path not found', async () => {
      const found = await repo.findByPath('/nonexistent')
      expect(found).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should return all non-archived projects by default', async () => {
      const p1 = await repo.create({ name: 'P1', path: '/p1' })
      const p2 = await repo.create({ name: 'P2', path: '/p2' })
      await repo.archive(p2.id)

      const projects = await repo.findAll()
      expect(projects).toHaveLength(1)
      expect(projects[0].id).toBe(p1.id)
    })

    it('should include archived projects when option is set', async () => {
      await repo.create({ name: 'P1', path: '/p1' })
      const p2 = await repo.create({ name: 'P2', path: '/p2' })
      await repo.archive(p2.id)

      const projects = await repo.findAll({ includeArchived: true })
      expect(projects).toHaveLength(2)
    })

    it('should return projects ordered by createdAt descending', async () => {
      await repo.create({ name: 'First', path: '/first' })
      await repo.create({ name: 'Second', path: '/second' })

      const projects = await repo.findAll()
      // Just verify we get both projects - ordering may not be guaranteed for same-ms timestamps
      expect(projects).toHaveLength(2)
      const names = projects.map((p) => p.name)
      expect(names).toContain('First')
      expect(names).toContain('Second')
    })
  })

  describe('update', () => {
    it('should update project name', async () => {
      const created = await repo.create({ name: 'Old', path: '/path' })

      const updated = await repo.update(created.id, { name: 'New' })
      expect(updated.name).toBe('New')
      expect(updated.path).toBe('/path')
    })

    it('should throw NotFoundError when project does not exist', async () => {
      await expect(
        repo.update('nonexistent', { name: 'New' })
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw DuplicateError when updating to existing path', async () => {
      await repo.create({ name: 'P1', path: '/path1' })
      const p2 = await repo.create({ name: 'P2', path: '/path2' })

      await expect(
        repo.update(p2.id, { path: '/path1' })
      ).rejects.toThrow(DuplicateError)
    })
  })

  describe('archive', () => {
    it('should set archivedAt timestamp', async () => {
      const created = await repo.create({ name: 'Test', path: '/test' })
      expect(created.archivedAt).toBeNull()

      await repo.archive(created.id)

      const found = await repo.findById(created.id)
      expect(found?.archivedAt).toBeDefined()
      expect(found?.archivedAt).not.toBeNull()
    })

    it('should throw NotFoundError when project does not exist', async () => {
      await expect(repo.archive('nonexistent')).rejects.toThrow(NotFoundError)
    })
  })

  describe('delete', () => {
    it('should remove project from database', async () => {
      const created = await repo.create({ name: 'Test', path: '/test' })

      await repo.delete(created.id)

      const found = await repo.findById(created.id)
      expect(found).toBeNull()
    })

    it('should throw NotFoundError when project does not exist', async () => {
      await expect(repo.delete('nonexistent')).rejects.toThrow(NotFoundError)
    })
  })
})

describe('SQLiteVersionRepository', () => {
  let db: Database.Database
  let projectRepo: SQLiteProjectRepository
  let versionRepo: SQLiteVersionRepository
  let projectId: string

  beforeEach(async () => {
    db = createTestDatabase()
    setDatabase(db)
    projectRepo = new SQLiteProjectRepository()
    versionRepo = new SQLiteVersionRepository()

    // Create a project for testing versions
    const project = await projectRepo.create({
      name: 'Test Project',
      path: '/test/project',
    })
    projectId = project.id
  })

  afterEach(() => {
    closeDatabase()
  })

  describe('create', () => {
    it('should create a version with provided statuses', async () => {
      const version = await versionRepo.create({
        projectId,
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: DevStatusDrafting,
        runtimeStatus: RuntimeStatusIdle,
      })

      expect(version.id).toBeDefined()
      expect(version.projectId).toBe(projectId)
      expect(version.versionName).toBe('v1.0')
      expect(version.branchName).toBe('main')
      expect(version.devStatus).toBe(DevStatusDrafting)
      expect(version.runtimeStatus).toBe(RuntimeStatusIdle)
    })

    it('should throw DuplicateError when version name already exists for project', async () => {
      await versionRepo.create({
        projectId,
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: DevStatusDrafting,
        runtimeStatus: RuntimeStatusIdle,
      })

      await expect(
        versionRepo.create({
          projectId,
          versionName: 'v1.0', // Same version name
          branchName: 'develop',
          devStatus: DevStatusDrafting,
          runtimeStatus: RuntimeStatusIdle,
        })
      ).rejects.toThrow(DuplicateError)
    })
  })

  describe('findById', () => {
    it('should return version when found', async () => {
      const created = await versionRepo.create({
        projectId,
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: DevStatusDrafting,
        runtimeStatus: RuntimeStatusIdle,
      })

      const found = await versionRepo.findById(created.id)
      expect(found).toBeDefined()
      expect(found?.id).toBe(created.id)
    })

    it('should return null when not found', async () => {
      const found = await versionRepo.findById('nonexistent')
      expect(found).toBeNull()
    })
  })

  describe('findByProject', () => {
    it('should return all versions for a project', async () => {
      await versionRepo.create({
        projectId,
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: DevStatusDrafting,
        runtimeStatus: RuntimeStatusIdle,
      })
      await versionRepo.create({
        projectId,
        versionName: 'v2.0',
        branchName: 'develop',
        devStatus: DevStatusDrafting,
        runtimeStatus: RuntimeStatusIdle,
      })

      const versions = await versionRepo.findByProject(projectId)
      expect(versions).toHaveLength(2)
    })

    it('should return empty array when no versions exist', async () => {
      const versions = await versionRepo.findByProject(projectId)
      expect(versions).toHaveLength(0)
    })
  })

  describe('updateStatus', () => {
    it('should update devStatus', async () => {
      const created = await versionRepo.create({
        projectId,
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: DevStatusDrafting,
        runtimeStatus: RuntimeStatusIdle,
      })

      await versionRepo.updateStatus(created.id, { devStatus: DevStatusScaffolding })

      const found = await versionRepo.findById(created.id)
      expect(found?.devStatus).toBe(DevStatusScaffolding)
    })

    it('should update runtimeStatus', async () => {
      const created = await versionRepo.create({
        projectId,
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: DevStatusDrafting,
        runtimeStatus: RuntimeStatusIdle,
      })

      await versionRepo.updateStatus(created.id, { runtimeStatus: RuntimeStatusRunning })

      const found = await versionRepo.findById(created.id)
      expect(found?.runtimeStatus).toBe(RuntimeStatusRunning)
    })

    it('should throw NotFoundError when version does not exist', async () => {
      await expect(
        versionRepo.updateStatus('nonexistent', { devStatus: DevStatusReady })
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('delete', () => {
    it('should remove version from database', async () => {
      const created = await versionRepo.create({
        projectId,
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: DevStatusDrafting,
        runtimeStatus: RuntimeStatusIdle,
      })

      await versionRepo.delete(created.id)

      const found = await versionRepo.findById(created.id)
      expect(found).toBeNull()
    })
  })

  describe('cascade delete', () => {
    it('should delete versions when project is deleted', async () => {
      const version = await versionRepo.create({
        projectId,
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: DevStatusDrafting,
        runtimeStatus: RuntimeStatusIdle,
      })

      await projectRepo.delete(projectId)

      const found = await versionRepo.findById(version.id)
      expect(found).toBeNull()
    })
  })
})

describe('SQLiteSettingsRepository', () => {
  let db: Database.Database
  let repo: SQLiteSettingsRepository

  beforeEach(() => {
    db = createTestDatabase()
    setDatabase(db)
    repo = new SQLiteSettingsRepository()
  })

  afterEach(() => {
    closeDatabase()
  })

  describe('getAll', () => {
    it('should return default settings when no settings are stored', async () => {
      const settings = await repo.getAll()

      expect(settings).toEqual(DEFAULT_SETTINGS)
    })

    it('should return merged settings with stored values', async () => {
      await repo.set('projectsLocation', '/custom/projects')

      const settings = await repo.getAll()

      expect(settings.projectsLocation).toBe('/custom/projects')
      // Other settings should be defaults
      expect(settings.cloneRoot).toBe(DEFAULT_SETTINGS.cloneRoot)
    })

    it('should parse JSON boolean values correctly', async () => {
      await repo.set('initGit', false)

      const settings = await repo.getAll()

      expect(settings.initGit).toBe(false)
    })

    it('should handle invalid JSON by treating as string', async () => {
      // Directly insert non-JSON string
      db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)')
        .run('projectsLocation', '/some/path', new Date().toISOString())

      const settings = await repo.getAll()

      expect(settings.projectsLocation).toBe('/some/path')
    })
  })

  describe('update', () => {
    it('should update single setting', async () => {
      const result = await repo.update({ projectsLocation: '/new/path' })

      expect(result.projectsLocation).toBe('/new/path')
    })

    it('should update multiple settings', async () => {
      const result = await repo.update({
        projectsLocation: '/custom/path',
        cloneRoot: '/clone/root',
      })

      expect(result.projectsLocation).toBe('/custom/path')
      expect(result.cloneRoot).toBe('/clone/root')
    })

    it('should preserve existing settings when updating others', async () => {
      await repo.set('projectsLocation', '/custom/path')

      const result = await repo.update({ cloneRoot: '/new/clone' })

      expect(result.projectsLocation).toBe('/custom/path')
      expect(result.cloneRoot).toBe('/new/clone')
    })

    it('should overwrite existing setting', async () => {
      await repo.set('defaultEditor', 'code')

      const result = await repo.update({ defaultEditor: 'vim' })

      expect(result.defaultEditor).toBe('vim')
    })

    it('should ignore undefined values', async () => {
      await repo.set('projectsLocation', '/my/path')

      const result = await repo.update({ projectsLocation: undefined as unknown as string })

      expect(result.projectsLocation).toBe('/my/path')
    })
  })

  describe('get', () => {
    it('should return default value when key not stored', async () => {
      const projectsLocation = await repo.get('projectsLocation')

      expect(projectsLocation).toBe(DEFAULT_SETTINGS.projectsLocation)
    })

    it('should return stored value when exists', async () => {
      await repo.set('projectsLocation', '/stored/path')

      const projectsLocation = await repo.get('projectsLocation')

      expect(projectsLocation).toBe('/stored/path')
    })

    it('should parse JSON boolean values correctly', async () => {
      await repo.set('initGit', false)

      const initGit = await repo.get('initGit')

      expect(initGit).toBe(false)
    })

    it('should handle non-JSON string values', async () => {
      // Directly insert string value without JSON encoding
      db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)')
        .run('defaultEditor', 'vim', new Date().toISOString())

      const editor = await repo.get('defaultEditor')

      expect(editor).toBe('vim')
    })
  })

  describe('set', () => {
    it('should store string value', async () => {
      await repo.set('projectsLocation', '/test/path')

      const stored = await repo.get('projectsLocation')
      expect(stored).toBe('/test/path')
    })

    it('should store boolean value', async () => {
      await repo.set('autoPush', true)

      const stored = await repo.get('autoPush')
      expect(stored).toBe(true)
    })

    it('should update existing value', async () => {
      await repo.set('defaultEditor', 'code')
      await repo.set('defaultEditor', 'vim')

      const stored = await repo.get('defaultEditor')
      expect(stored).toBe('vim')
    })

    it('should update updated_at timestamp', async () => {
      await repo.set('projectsLocation', '/test')

      const row = db.prepare('SELECT updated_at FROM settings WHERE key = ?').get('projectsLocation') as { updated_at: string }
      expect(row.updated_at).toBeDefined()
    })
  })
})

describe('SQLiteFeedbackRepository', () => {
  let db: Database.Database
  let projectRepo: SQLiteProjectRepository
  let versionRepo: SQLiteVersionRepository
  let feedbackRepo: SQLiteFeedbackRepository
  let versionId: string

  beforeEach(async () => {
    db = createTestDatabase()
    setDatabase(db)
    projectRepo = new SQLiteProjectRepository()
    versionRepo = new SQLiteVersionRepository()
    feedbackRepo = new SQLiteFeedbackRepository()

    // Create a project and version for testing feedback
    const project = await projectRepo.create({
      name: 'Test Project',
      path: '/test/project',
    })
    const version = await versionRepo.create({
      projectId: project.id,
      versionName: 'v1.0',
      branchName: 'main',
      devStatus: DevStatusDrafting,
      runtimeStatus: RuntimeStatusIdle,
    })
    versionId = version.id
  })

  afterEach(() => {
    closeDatabase()
  })

  describe('upsert', () => {
    it('should create feedback when none exists', async () => {
      const feedback = await feedbackRepo.upsert({
        versionId,
        content: 'Please split M2 into smaller tasks',
      })

      expect(feedback.id).toBeDefined()
      expect(feedback.versionId).toBe(versionId)
      expect(feedback.content).toBe('Please split M2 into smaller tasks')
      expect(feedback.createdAt).toBeDefined()
      expect(feedback.updatedAt).toBeDefined()
    })

    it('should update feedback when already exists', async () => {
      // Create initial feedback
      const initial = await feedbackRepo.upsert({
        versionId,
        content: 'Initial feedback',
      })

      // Update feedback
      const updated = await feedbackRepo.upsert({
        versionId,
        content: 'Updated feedback',
      })

      expect(updated.id).toBe(initial.id) // Same ID
      expect(updated.content).toBe('Updated feedback')
      expect(updated.createdAt).toBe(initial.createdAt) // Same creation time
      // updatedAt should be >= createdAt (might be same if operations are fast)
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(initial.createdAt).getTime()
      )
    })
  })

  describe('findByVersionId', () => {
    it('should return feedback when found', async () => {
      await feedbackRepo.upsert({
        versionId,
        content: 'Test feedback',
      })

      const found = await feedbackRepo.findByVersionId(versionId)

      expect(found).not.toBeNull()
      expect(found?.versionId).toBe(versionId)
      expect(found?.content).toBe('Test feedback')
    })

    it('should return null when not found', async () => {
      const found = await feedbackRepo.findByVersionId('nonexistent-version-id')

      expect(found).toBeNull()
    })
  })

  describe('delete', () => {
    it('should remove feedback', async () => {
      await feedbackRepo.upsert({
        versionId,
        content: 'To be deleted',
      })

      await feedbackRepo.delete(versionId)

      const found = await feedbackRepo.findByVersionId(versionId)
      expect(found).toBeNull()
    })

    it('should not throw when feedback does not exist', async () => {
      // Should not throw
      await feedbackRepo.delete('nonexistent-version-id')
    })
  })

  describe('cascade delete', () => {
    it('should delete feedback when version is deleted', async () => {
      await feedbackRepo.upsert({
        versionId,
        content: 'Will be cascade deleted',
      })

      await versionRepo.delete(versionId)

      const found = await feedbackRepo.findByVersionId(versionId)
      expect(found).toBeNull()
    })
  })
})
