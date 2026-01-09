/**
 * Base Repository Class
 * Provides common functionality for all SQLite repositories
 */

import Database from 'better-sqlite3'
import { getDatabase } from '../database'

/**
 * Generate a UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Get current timestamp in ISO 8601 format
 */
export function nowISO(): string {
  return new Date().toISOString()
}

/**
 * Base repository class with common database operations
 */
export abstract class BaseRepository {
  protected get db(): Database.Database {
    return getDatabase()
  }

  /**
   * Run a query and return all results
   */
  protected query<T>(sql: string, params?: unknown[]): T[] {
    const stmt = this.db.prepare(sql)
    return (params ? stmt.all(...params) : stmt.all()) as T[]
  }

  /**
   * Run a query and return the first result
   */
  protected queryOne<T>(sql: string, params?: unknown[]): T | undefined {
    const stmt = this.db.prepare(sql)
    return (params ? stmt.get(...params) : stmt.get()) as T | undefined
  }

  /**
   * Run a mutation (INSERT, UPDATE, DELETE)
   */
  protected run(sql: string, params?: unknown[]): Database.RunResult {
    const stmt = this.db.prepare(sql)
    return params ? stmt.run(...params) : stmt.run()
  }

  /**
   * Run multiple statements in a transaction
   */
  protected transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)()
  }
}
