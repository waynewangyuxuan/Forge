/**
 * SQLite Project Repository
 * Implements IProjectRepository for SQLite storage
 */

import { Project } from '@shared/types/project.types'
import { IProjectRepository } from '@shared/interfaces/repositories'
import { DuplicateError, NotFoundError } from '@shared/errors'
import { BaseRepository, generateId, nowISO } from './base.repo'

/**
 * Database row type for projects table
 */
interface ProjectRow {
  id: string
  name: string
  path: string
  created_at: string
  archived_at: string | null
}

/**
 * Convert database row to Project entity
 */
function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    path: row.path,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
  }
}

/**
 * SQLite implementation of IProjectRepository
 */
export class SQLiteProjectRepository
  extends BaseRepository
  implements IProjectRepository
{
  async findById(id: string): Promise<Project | null> {
    const row = this.queryOne<ProjectRow>(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    )
    return row ? rowToProject(row) : null
  }

  async findByPath(path: string): Promise<Project | null> {
    const row = this.queryOne<ProjectRow>(
      'SELECT * FROM projects WHERE path = ?',
      [path]
    )
    return row ? rowToProject(row) : null
  }

  async findAll(options?: { includeArchived?: boolean }): Promise<Project[]> {
    const includeArchived = options?.includeArchived ?? false

    const sql = includeArchived
      ? 'SELECT * FROM projects ORDER BY created_at DESC'
      : 'SELECT * FROM projects WHERE archived_at IS NULL ORDER BY created_at DESC'

    const rows = this.query<ProjectRow>(sql)
    return rows.map(rowToProject)
  }

  async create(
    input: Omit<Project, 'id' | 'createdAt' | 'archivedAt'>
  ): Promise<Project> {
    // Check for duplicate path
    const existing = await this.findByPath(input.path)
    if (existing) {
      throw new DuplicateError('Project', 'path')
    }

    const id = generateId()
    const createdAt = nowISO()

    this.run(
      `INSERT INTO projects (id, name, path, created_at, archived_at)
       VALUES (?, ?, ?, ?, NULL)`,
      [id, input.name, input.path, createdAt]
    )

    return {
      id,
      name: input.name,
      path: input.path,
      createdAt,
      archivedAt: null,
    }
  }

  async update(
    id: string,
    data: Partial<Omit<Project, 'id' | 'createdAt'>>
  ): Promise<Project> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('Project', id)
    }

    // Build dynamic update query
    const updates: string[] = []
    const params: unknown[] = []

    if (data.name !== undefined) {
      updates.push('name = ?')
      params.push(data.name)
    }

    if (data.path !== undefined) {
      // Check for duplicate path
      const pathExists = await this.findByPath(data.path)
      if (pathExists && pathExists.id !== id) {
        throw new DuplicateError('Project', 'path')
      }
      updates.push('path = ?')
      params.push(data.path)
    }

    if (data.archivedAt !== undefined) {
      updates.push('archived_at = ?')
      params.push(data.archivedAt)
    }

    if (updates.length > 0) {
      params.push(id)
      this.run(
        `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
        params
      )
    }

    // Return updated project
    const updated = await this.findById(id)
    return updated!
  }

  async archive(id: string): Promise<void> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('Project', id)
    }

    this.run('UPDATE projects SET archived_at = ? WHERE id = ?', [
      nowISO(),
      id,
    ])
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('Project', id)
    }

    // Cascade delete is handled by foreign key constraints
    this.run('DELETE FROM projects WHERE id = ?', [id])
  }
}
