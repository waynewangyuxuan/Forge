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
  IPCResult,
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
  ipcMain.handle('system:getSettings', async (): Promise<IPCResult<Settings>> => {
    try {
      const data = await settingsRepo.getAll()
      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: serializeError(error) }
    }
  })

  // system:updateSettings - Update application settings
  ipcMain.handle('system:updateSettings', async (_event, updates: Partial<Settings>): Promise<IPCResult<Settings>> => {
    try {
      const data = await settingsRepo.update(updates)
      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: serializeError(error) }
    }
  })

  // system:selectFolder - Open folder selection dialog
  ipcMain.handle('system:selectFolder', async (_event, input: SystemSelectFolderInput): Promise<IPCResult<SystemSelectFolderOutput>> => {
    try {
      const result = await dialog.showOpenDialog({
        title: input?.title ?? 'Select Folder',
        defaultPath: input?.defaultPath,
        properties: ['openDirectory', 'createDirectory'],
      })

      const data: SystemSelectFolderOutput = {
        path: result.canceled ? null : result.filePaths[0] ?? null,
      }

      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: serializeError(error) }
    }
  })

  // system:checkClaude - Check if Claude CLI is available
  ipcMain.handle('system:checkClaude', async (): Promise<IPCResult<SystemCheckClaudeOutput>> => {
    try {
      const data = await checkClaudeCLI()
      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: serializeError(error) }
    }
  })

  // system:getAppInfo - Get application information
  ipcMain.handle('system:getAppInfo', async (): Promise<IPCResult<SystemAppInfoOutput>> => {
    try {
      const data: SystemAppInfoOutput = {
        version: app.getVersion(),
        dataPath: getAppDataPath(),
      }
      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: serializeError(error) }
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
