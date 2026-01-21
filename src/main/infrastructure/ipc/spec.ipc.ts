/**
 * Spec IPC Handlers
 * Handles spec:* IPC channels for reading and saving spec files
 */

import { ipcMain } from 'electron'
import { SQLiteProjectRepository } from '../repositories/sqlite-project.repo'
import { SQLiteVersionRepository } from '../repositories/sqlite-version.repo'
import { getFileSystemAdapter } from '../adapters/file-system.adapter'
import { serializeError } from '@shared/errors'
import { readSpec, saveSpec } from '../../application/use-cases/spec'
import type { SpecReadInput, SpecSaveInput, IPCResult } from '@shared/types/ipc.types'

// Initialize dependencies
const projectRepo = new SQLiteProjectRepository()
const versionRepo = new SQLiteVersionRepository()
const fs = getFileSystemAdapter()

/**
 * Register all spec IPC handlers
 */
export function registerSpecHandlers(): void {
  // spec:read - Read a spec file
  ipcMain.handle('spec:read', async (_event, input: SpecReadInput): Promise<IPCResult<string>> => {
    try {
      const data = await readSpec(input, { projectRepo, versionRepo, fs })
      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: serializeError(error) }
    }
  })

  // spec:save - Save a spec file
  ipcMain.handle('spec:save', async (_event, input: SpecSaveInput): Promise<IPCResult<void>> => {
    try {
      await saveSpec(input, { projectRepo, versionRepo, fs })
      return { ok: true, data: undefined }
    } catch (error) {
      return { ok: false, error: serializeError(error) }
    }
  })
}
