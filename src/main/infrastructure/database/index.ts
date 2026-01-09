/**
 * Database Module
 * Handles SQLite database initialization and access
 */

import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'node:path'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { ALL_TABLES, SCHEMA_VERSION } from './schema'

const DB_FILENAME = 'forge.db'

let db: Database.Database | null = null

/**
 * Get the app data directory path (cross-platform)
 * - macOS: ~/Library/Application Support/Forge/
 * - Windows: %APPDATA%/Forge/
 * - Linux: ~/.config/Forge/
 */
export function getAppDataPath(): string {
  return app.getPath('userData')
}

/**
 * Get the full path to the database file
 */
export function getDatabasePath(): string {
  return join(getAppDataPath(), DB_FILENAME)
}

/**
 * Initialize the database
 * Creates the database file and tables if they don't exist
 */
export function initializeDatabase(): Database.Database {
  if (db) {
    return db
  }

  const appDataPath = getAppDataPath()

  // Ensure app data directory exists
  if (!existsSync(appDataPath)) {
    mkdirSync(appDataPath, { recursive: true })
  }

  const dbPath = getDatabasePath()

  // Create database connection
  db = new Database(dbPath)

  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL')

  // Initialize schema
  initializeSchema(db)

  return db
}

/**
 * Get the database instance
 * Throws if database is not initialized
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.')
  }
  return db
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

/**
 * Initialize the database schema
 * Creates all tables if they don't exist
 */
function initializeSchema(database: Database.Database): void {
  const currentVersion = getSchemaVersion(database)

  if (currentVersion === 0) {
    // Fresh database, create all tables
    for (const tableSQL of ALL_TABLES) {
      database.exec(tableSQL)
    }

    // Record schema version
    database
      .prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)')
      .run(SCHEMA_VERSION, new Date().toISOString())
  } else if (currentVersion < SCHEMA_VERSION) {
    // Run migrations (to be implemented when needed)
    runMigrations(database, currentVersion, SCHEMA_VERSION)
  }
}

/**
 * Get the current schema version from the database
 */
function getSchemaVersion(database: Database.Database): number {
  try {
    // Check if schema_version table exists
    const tableExists = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'"
      )
      .get()

    if (!tableExists) {
      return 0
    }

    const row = database
      .prepare('SELECT MAX(version) as version FROM schema_version')
      .get() as { version: number | null } | undefined

    return row?.version ?? 0
  } catch {
    return 0
  }
}

/**
 * Run database migrations
 * Currently a placeholder - migrations will be added as needed
 */
function runMigrations(
  database: Database.Database,
  fromVersion: number,
  toVersion: number
): void {
  // Migrations will be implemented here as the schema evolves
  // For now, just log the migration intent
  console.log(`Migrating database from version ${fromVersion} to ${toVersion}`)

  // After migrations are applied, update the schema version
  database
    .prepare('INSERT INTO schema_version (version, applied_at) VALUES (?, ?)')
    .run(toVersion, new Date().toISOString())
}

/**
 * Check if the database is initialized and ready
 */
export function isDatabaseReady(): boolean {
  return db !== null
}

/**
 * Get database statistics (for debugging)
 */
export function getDatabaseStats(): {
  path: string
  size: number
  tables: string[]
} {
  const database = getDatabase()
  const dbPath = getDatabasePath()

  const tables = database
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all() as Array<{ name: string }>

  // Get file size
  const stats = statSync(dbPath)

  return {
    path: dbPath,
    size: stats.size,
    tables: tables.map((t) => t.name),
  }
}
