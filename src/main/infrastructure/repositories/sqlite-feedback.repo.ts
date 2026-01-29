/**
 * SQLite Feedback Repository
 * Implements IFeedbackRepository for SQLite storage
 */

import { Feedback } from '@shared/types/execution.types'
import { IFeedbackRepository } from '@shared/interfaces/repositories'
import { BaseRepository, generateId, nowISO } from './base.repo'

/**
 * Database row type for feedback table
 */
interface FeedbackRow {
  id: string
  version_id: string
  content: string
  created_at: string
  updated_at: string
}

/**
 * Convert database row to Feedback entity
 */
function rowToFeedback(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    versionId: row.version_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * SQLite implementation of IFeedbackRepository
 */
export class SQLiteFeedbackRepository
  extends BaseRepository
  implements IFeedbackRepository
{
  async findByVersionId(versionId: string): Promise<Feedback | null> {
    const row = this.queryOne<FeedbackRow>(
      'SELECT * FROM feedback WHERE version_id = ?',
      [versionId]
    )
    return row ? rowToFeedback(row) : null
  }

  async upsert(input: { versionId: string; content: string }): Promise<Feedback> {
    const existing = await this.findByVersionId(input.versionId)
    const now = nowISO()

    if (existing) {
      // Update existing feedback
      this.run(
        'UPDATE feedback SET content = ?, updated_at = ? WHERE version_id = ?',
        [input.content, now, input.versionId]
      )

      return {
        ...existing,
        content: input.content,
        updatedAt: now,
      }
    } else {
      // Create new feedback
      const id = generateId()

      this.run(
        `INSERT INTO feedback (id, version_id, content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, input.versionId, input.content, now, now]
      )

      return {
        id,
        versionId: input.versionId,
        content: input.content,
        createdAt: now,
        updatedAt: now,
      }
    }
  }

  async delete(versionId: string): Promise<void> {
    this.run('DELETE FROM feedback WHERE version_id = ?', [versionId])
  }
}
