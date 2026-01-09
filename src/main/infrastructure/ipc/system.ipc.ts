/**
 * System IPC Handlers
 * Handles system:* IPC channels
 */

import { ipcMain, dialog, app } from 'electron'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { getAppDataPath } from '../database'
import { serializeError } from '@shared/errors'
import { SQLiteSettingsRepository } from '../repositories/sqlite-settings.repo'
import type {
  SystemSelectFolderInput,
  SystemSelectFolderOutput,
  SystemCheckClaudeOutput,
  SystemAppInfoOutput,
} from '@shared/types/ipc.types'
import type { Settings } from '@shared/types/runtime.types'

const execAsync = promisify(exec)

// Settings repository singleton
const settingsRepo = new SQLiteSettingsRepository()

/**
 * Register all system IPC handlers
 */
export function registerSystemHandlers(): void {
  // system:getSettings - Get application settings
  ipcMain.handle('system:getSettings', async () => {
    try {
      return await settingsRepo.getAll()
    } catch (error) {
      throw serializeError(error)
    }
  })

  // system:updateSettings - Update application settings
  ipcMain.handle('system:updateSettings', async (_event, updates: Partial<Settings>) => {
    try {
      return await settingsRepo.update(updates)
    } catch (error) {
      throw serializeError(error)
    }
  })

  // system:selectFolder - Open folder selection dialog
  ipcMain.handle('system:selectFolder', async (_event, input: SystemSelectFolderInput) => {
    try {
      const result = await dialog.showOpenDialog({
        title: input?.title ?? 'Select Folder',
        defaultPath: input?.defaultPath,
        properties: ['openDirectory', 'createDirectory'],
      })

      const output: SystemSelectFolderOutput = {
        path: result.canceled ? null : result.filePaths[0] ?? null,
      }

      return output
    } catch (error) {
      throw serializeError(error)
    }
  })

  // system:checkClaude - Check if Claude CLI is available
  ipcMain.handle('system:checkClaude', async () => {
    try {
      const result = await checkClaudeCLI()
      return result
    } catch (error) {
      throw serializeError(error)
    }
  })

  // system:getAppInfo - Get application information
  ipcMain.handle('system:getAppInfo', async () => {
    try {
      const output: SystemAppInfoOutput = {
        version: app.getVersion(),
        dataPath: getAppDataPath(),
      }
      return output
    } catch (error) {
      throw serializeError(error)
    }
  })
}

/**
 * Check if Claude CLI is available and get version
 */
async function checkClaudeCLI(): Promise<SystemCheckClaudeOutput> {
  try {
    const { stdout } = await execAsync('claude --version')
    const version = stdout.trim()
    return {
      available: true,
      version,
    }
  } catch {
    return {
      available: false,
    }
  }
}
