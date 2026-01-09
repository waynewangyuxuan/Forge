/**
 * SQLite Version Repository
 * Implements IVersionRepository for SQLite storage
 */

import { Version } from '@shared/types/project.types'
import { DevStatus, RuntimeStatus } from '@shared/constants'
import { IVersionRepository } from '@shared/interfaces/repositories'
import { DuplicateError, NotFoundError } from '@shared/errors'
import { BaseRepository, generateId, nowISO } from './base.repo'

/**
 * Database row type for versions table
 */
interface VersionRow {
  id: string
  project_id: string
  version_name: string
  branch_name: string
  dev_status: string
  runtime_status: string
  created_at: string
}

/**
 * Convert database row to Version entity
 */
function rowToVersion(row: VersionRow): Version {
  return {
    id: row.id,
    projectId: row.project_id,
    versionName: row.version_name,
    branchName: row.branch_name,
    devStatus: row.dev_status as DevStatus,
    runtimeStatus: row.runtime_status as RuntimeStatus,
    createdAt: row.created_at,
  }
}

/**
 * SQLite implementation of IVersionRepository
 */
export class SQLiteVersionRepository
  extends BaseRepository
  implements IVersionRepository
{
  async findById(id: string): Promise<Version | null> {
    const row = this.queryOne<VersionRow>(
      'SELECT * FROM versions WHERE id = ?',
      [id]
    )
    return row ? rowToVersion(row) : null
  }

  async findByProject(projectId: string): Promise<Version[]> {
    const rows = this.query<VersionRow>(
      'SELECT * FROM versions WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    )
    return rows.map(rowToVersion)
  }

  async create(input: Omit<Version, 'id' | 'createdAt'>): Promise<Version> {
    // Check for duplicate version name within project
    const existing = this.queryOne<VersionRow>(
      'SELECT * FROM versions WHERE project_id = ? AND version_name = ?',
      [input.projectId, input.versionName]
    )

    if (existing) {
      throw new DuplicateError('Version', 'versionName')
    }

    const id = generateId()
    const createdAt = nowISO()

    this.run(
      `INSERT INTO versions (id, project_id, version_name, branch_name, dev_status, runtime_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.projectId,
        input.versionName,
        input.branchName,
        input.devStatus,
        input.runtimeStatus,
        createdAt,
      ]
    )

    return {
      id,
      projectId: input.projectId,
      versionName: input.versionName,
      branchName: input.branchName,
      devStatus: input.devStatus,
      runtimeStatus: input.runtimeStatus,
      createdAt,
    }
  }

  async updateStatus(
    id: string,
    update: { devStatus?: string; runtimeStatus?: string }
  ): Promise<void> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('Version', id)
    }

    const updates: string[] = []
    const params: unknown[] = []

    if (update.devStatus !== undefined) {
      updates.push('dev_status = ?')
      params.push(update.devStatus)
    }

    if (update.runtimeStatus !== undefined) {
      updates.push('runtime_status = ?')
      params.push(update.runtimeStatus)
    }

    if (updates.length > 0) {
      params.push(id)
      this.run(
        `UPDATE versions SET ${updates.join(', ')} WHERE id = ?`,
        params
      )
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('Version', id)
    }

    // Cascade delete is handled by foreign key constraints
    this.run('DELETE FROM versions WHERE id = ?', [id])
  }
}
