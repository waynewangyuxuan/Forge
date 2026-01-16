/**
 * Scaffold IPC Handlers
 * Handles scaffold:* IPC channels
 */

import { ipcMain, BrowserWindow } from 'electron'
import { SQLiteProjectRepository } from '../repositories/sqlite-project.repo'
import { SQLiteVersionRepository } from '../repositories/sqlite-version.repo'
import { getFileSystemAdapter } from '../adapters/file-system.adapter'
import { getClaudeAdapter } from '../adapters/claude.adapter'
import { serializeError } from '@shared/errors'
import { generateScaffold } from '../../application/use-cases/scaffold'
import type {
  IPCResult,
  ScaffoldProgressEvent,
  ScaffoldCompletedEvent,
  ScaffoldErrorEvent,
} from '@shared/types/ipc.types'
import type { GenerateScaffoldInput, GenerateScaffoldResult } from '@shared/types/scaffold.types'

// Initialize dependencies
const projectRepo = new SQLiteProjectRepository()
const versionRepo = new SQLiteVersionRepository()
const fs = getFileSystemAdapter()
const claude = getClaudeAdapter()

/**
 * Send an event to all browser windows
 */
function sendToAllWindows(channel: string, payload: unknown): void {
  const windows = BrowserWindow.getAllWindows()
  for (const window of windows) {
    window.webContents.send(channel, payload)
  }
}

/**
 * Register all scaffold IPC handlers
 */
export function registerScaffoldHandlers(): void {
  // scaffold:generate - Generate scaffold from spec files
  ipcMain.handle(
    'scaffold:generate',
    async (_event, input: GenerateScaffoldInput): Promise<IPCResult<GenerateScaffoldResult>> => {
      try {
        const result = await generateScaffold(input, {
          projectRepo,
          versionRepo,
          fs,
          claude,
          emitProgress: (event: ScaffoldProgressEvent) => {
            sendToAllWindows('scaffold:progress', event)
          },
          emitCompleted: (event: ScaffoldCompletedEvent) => {
            sendToAllWindows('scaffold:completed', event)
          },
          emitError: (event: ScaffoldErrorEvent) => {
            sendToAllWindows('scaffold:error', event)
          },
        })

        return { ok: true, data: result }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )

  // scaffold:checkClaudeAvailable - Check if Claude CLI is available
  ipcMain.handle(
    'scaffold:checkClaudeAvailable',
    async (): Promise<IPCResult<{ available: boolean; version: string | null }>> => {
      try {
        const available = await claude.isAvailable()
        const version = available ? await claude.getVersion() : null
        return { ok: true, data: { available, version } }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )
}
