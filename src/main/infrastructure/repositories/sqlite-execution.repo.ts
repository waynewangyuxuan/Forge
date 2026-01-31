/**
 * SQLite Execution Repository
 * Implements IExecutionRepository for SQLite storage
 */

import { Execution, ExecutionStatus } from '@shared/types/execution.types'
import { IExecutionRepository } from '@shared/interfaces/repositories'
import { NotFoundError } from '@shared/errors'
import { BaseRepository, generateId, nowISO } from './base.repo'

/**
 * Database row type for executions table
 */
interface ExecutionRow {
  id: string
  version_id: string
  started_at: string
  completed_at: string | null
  status: ExecutionStatus
  total_tasks: number
  completed_tasks: number
  current_task_id: string | null
  pre_execution_commit: string | null
  is_paused: number // SQLite stores booleans as 0/1
}

/**
 * Convert database row to Execution entity
 */
function rowToExecution(row: ExecutionRow): Execution {
  return {
    id: row.id,
    versionId: row.version_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status,
    totalTasks: row.total_tasks,
    completedTasks: row.completed_tasks,
    currentTaskId: row.current_task_id,
    preExecutionCommit: row.pre_execution_commit,
    isPaused: row.is_paused === 1,
  }
}

/**
 * SQLite implementation of IExecutionRepository
 */
export class SQLiteExecutionRepository
  extends BaseRepository
  implements IExecutionRepository
{
  async findById(id: string): Promise<Execution | null> {
    const row = this.queryOne<ExecutionRow>(
      'SELECT * FROM executions WHERE id = ?',
      [id]
    )
    return row ? rowToExecution(row) : null
  }

  async findByVersion(versionId: string): Promise<Execution[]> {
    const rows = this.query<ExecutionRow>(
      'SELECT * FROM executions WHERE version_id = ? ORDER BY started_at DESC',
      [versionId]
    )
    return rows.map(rowToExecution)
  }

  async findRunning(): Promise<Execution[]> {
    const rows = this.query<ExecutionRow>(
      "SELECT * FROM executions WHERE status = 'running' ORDER BY started_at DESC"
    )
    return rows.map(rowToExecution)
  }

  async findRunningOrPaused(): Promise<Execution[]> {
    const rows = this.query<ExecutionRow>(
      "SELECT * FROM executions WHERE status IN ('running', 'paused') OR is_paused = 1 ORDER BY started_at DESC"
    )
    return rows.map(rowToExecution)
  }

  async create(input: Omit<Execution, 'id'>): Promise<Execution> {
    const id = generateId()

    this.run(
      `INSERT INTO executions (
        id, version_id, started_at, completed_at, status,
        total_tasks, completed_tasks, current_task_id,
        pre_execution_commit, is_paused
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.versionId,
        input.startedAt,
        input.completedAt,
        input.status,
        input.totalTasks,
        input.completedTasks,
        input.currentTaskId,
        input.preExecutionCommit,
        input.isPaused ? 1 : 0,
      ]
    )

    return {
      id,
      ...input,
    }
  }

  async updateProgress(
    id: string,
    update: { completedTasks: number; currentTaskId?: string | null }
  ): Promise<void> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('Execution', id)
    }

    this.run(
      'UPDATE executions SET completed_tasks = ?, current_task_id = ? WHERE id = ?',
      [update.completedTasks, update.currentTaskId ?? null, id]
    )
  }

  async complete(
    id: string,
    status: 'completed' | 'failed' | 'aborted'
  ): Promise<void> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('Execution', id)
    }

    this.run(
      'UPDATE executions SET status = ?, completed_at = ?, is_paused = 0 WHERE id = ?',
      [status, nowISO(), id]
    )
  }

  async setPaused(id: string, isPaused: boolean): Promise<void> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('Execution', id)
    }

    this.run(
      'UPDATE executions SET is_paused = ?, status = ? WHERE id = ?',
      [isPaused ? 1 : 0, isPaused ? 'paused' : 'running', id]
    )
  }

  async setPreExecutionCommit(id: string, commitSha: string): Promise<void> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('Execution', id)
    }

    this.run(
      'UPDATE executions SET pre_execution_commit = ? WHERE id = ?',
      [commitSha, id]
    )
  }

  async updateStatus(id: string, status: ExecutionStatus): Promise<void> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('Execution', id)
    }

    this.run('UPDATE executions SET status = ? WHERE id = ?', [status, id])
  }
}
