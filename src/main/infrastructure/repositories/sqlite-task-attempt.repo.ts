/**
 * SQLite Task Attempt Repository
 * Implements ITaskAttemptRepository for SQLite storage
 */

import { TaskAttempt, TaskStatus } from '@shared/types/execution.types'
import { ITaskAttemptRepository } from '@shared/interfaces/repositories'
import { NotFoundError } from '@shared/errors'
import { BaseRepository, generateId, nowISO } from './base.repo'

/**
 * Database row type for task_attempts table
 */
interface TaskAttemptRow {
  id: string
  execution_id: string
  task_id: string
  attempt_number: number
  started_at: string
  completed_at: string | null
  status: TaskStatus
  error_message: string | null
}

/**
 * Convert database row to TaskAttempt entity
 */
function rowToTaskAttempt(row: TaskAttemptRow): TaskAttempt {
  return {
    id: row.id,
    executionId: row.execution_id,
    taskId: row.task_id,
    attemptNumber: row.attempt_number,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status,
    errorMessage: row.error_message,
  }
}

/**
 * SQLite implementation of ITaskAttemptRepository
 */
export class SQLiteTaskAttemptRepository
  extends BaseRepository
  implements ITaskAttemptRepository
{
  async findById(id: string): Promise<TaskAttempt | null> {
    const row = this.queryOne<TaskAttemptRow>(
      'SELECT * FROM task_attempts WHERE id = ?',
      [id]
    )
    return row ? rowToTaskAttempt(row) : null
  }

  async findByExecution(executionId: string): Promise<TaskAttempt[]> {
    const rows = this.query<TaskAttemptRow>(
      'SELECT * FROM task_attempts WHERE execution_id = ? ORDER BY started_at ASC',
      [executionId]
    )
    return rows.map(rowToTaskAttempt)
  }

  async findByTask(executionId: string, taskId: string): Promise<TaskAttempt[]> {
    const rows = this.query<TaskAttemptRow>(
      'SELECT * FROM task_attempts WHERE execution_id = ? AND task_id = ? ORDER BY attempt_number ASC',
      [executionId, taskId]
    )
    return rows.map(rowToTaskAttempt)
  }

  async create(input: Omit<TaskAttempt, 'id'>): Promise<TaskAttempt> {
    const id = generateId()

    this.run(
      `INSERT INTO task_attempts (
        id, execution_id, task_id, attempt_number,
        started_at, completed_at, status, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.executionId,
        input.taskId,
        input.attemptNumber,
        input.startedAt,
        input.completedAt,
        input.status,
        input.errorMessage,
      ]
    )

    return {
      id,
      ...input,
    }
  }

  async complete(
    id: string,
    status: 'completed' | 'failed' | 'skipped',
    errorMessage?: string
  ): Promise<void> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('TaskAttempt', id)
    }

    this.run(
      'UPDATE task_attempts SET status = ?, completed_at = ?, error_message = ? WHERE id = ?',
      [status, nowISO(), errorMessage ?? null, id]
    )
  }
}
