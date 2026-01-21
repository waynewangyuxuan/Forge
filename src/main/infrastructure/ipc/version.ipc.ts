/**
 * Version IPC Handlers
 * Handles version:* IPC channels
 */

import { ipcMain } from 'electron'
import { SQLiteProjectRepository } from '../repositories/sqlite-project.repo'
import { SQLiteVersionRepository } from '../repositories/sqlite-version.repo'
import { serializeError } from '@shared/errors'
import {
  createVersion,
  listVersions,
  getVersion,
  setActiveVersion,
} from '../../application/use-cases/version'
import type {
  VersionListInput,
  VersionGetInput,
  VersionSetActiveInput,
  IPCResult,
} from '@shared/types/ipc.types'
import type { CreateVersionInput, Version } from '@shared/types/project.types'

// Initialize dependencies
const projectRepo = new SQLiteProjectRepository()
const versionRepo = new SQLiteVersionRepository()

/**
 * Register all version IPC handlers
 */
export function registerVersionHandlers(): void {
  // version:list - Get all versions for a project
  ipcMain.handle('version:list', async (_event, input: VersionListInput): Promise<IPCResult<Version[]>> => {
    try {
      const data = await listVersions(
        { projectId: input.projectId },
        { projectRepo, versionRepo }
      )
      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: serializeError(error) }
    }
  })

  // version:get - Get a single version by ID
  ipcMain.handle('version:get', async (_event, input: VersionGetInput): Promise<IPCResult<Version | null>> => {
    try {
      const data = await getVersion({ id: input.id }, { versionRepo })
      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: serializeError(error) }
    }
  })

  // version:create - Create a new version
  ipcMain.handle('version:create', async (_event, input: CreateVersionInput): Promise<IPCResult<Version>> => {
    try {
      const data = await createVersion(
        {
          projectId: input.projectId,
          versionName: input.versionName,
          branchName: input.branchName,
        },
        { projectRepo, versionRepo }
      )
      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: serializeError(error) }
    }
  })

  // version:setActive - Set a version as active (for runtime)
  ipcMain.handle('version:setActive', async (_event, input: VersionSetActiveInput): Promise<IPCResult<void>> => {
    try {
      await setActiveVersion({ id: input.id }, { versionRepo })
      return { ok: true, data: undefined }
    } catch (error) {
      return { ok: false, error: serializeError(error) }
    }
  })
}
