/**
 * SQLite Settings Repository
 * Persists application settings to database
 */

import { Settings } from '@shared/types/runtime.types'
import { DEFAULT_SETTINGS } from '@shared/constants'
import { BaseRepository, nowISO } from './base.repo'

/**
 * Database row type for settings table
 */
interface SettingRow {
  key: string
  value: string
  updated_at: string
}

/**
 * SQLite implementation of settings persistence
 */
export class SQLiteSettingsRepository extends BaseRepository {
  /**
   * Get all settings, merged with defaults
   */
  async getAll(): Promise<Settings> {
    const rows = this.query<SettingRow>('SELECT * FROM settings')

    // Start with defaults
    const settings: Settings = { ...DEFAULT_SETTINGS }

    // Override with persisted values
    for (const row of rows) {
      if (row.key in settings) {
        const key = row.key as keyof Settings
        // Parse JSON for complex values, use raw value for strings
        try {
          const parsed = JSON.parse(row.value)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(settings as any)[key] = parsed
        } catch {
          // If not valid JSON, treat as string
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(settings as any)[key] = row.value
        }
      }
    }

    return settings
  }

  /**
   * Update settings (partial update)
   */
  async update(updates: Partial<Settings>): Promise<Settings> {
    const now = nowISO()

    this.transaction(() => {
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          // Serialize value to JSON for consistency
          const serialized = typeof value === 'string' ? value : JSON.stringify(value)

          this.run(
            `INSERT INTO settings (key, value, updated_at)
             VALUES (?, ?, ?)
             ON CONFLICT(key) DO UPDATE SET
               value = excluded.value,
               updated_at = excluded.updated_at`,
            [key, serialized, now]
          )
        }
      }
    })

    return this.getAll()
  }

  /**
   * Get a single setting value
   */
  async get<K extends keyof Settings>(key: K): Promise<Settings[K]> {
    const row = this.queryOne<SettingRow>(
      'SELECT * FROM settings WHERE key = ?',
      [key]
    )

    if (!row) {
      return DEFAULT_SETTINGS[key]
    }

    try {
      return JSON.parse(row.value)
    } catch {
      return row.value as Settings[K]
    }
  }

  /**
   * Set a single setting value
   */
  async set<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    const now = nowISO()

    this.run(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at`,
      [key, serialized, now]
    )
  }
}
