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
} from '@shared/types/ipc.types'
import type { CreateVersionInput } from '@shared/types/project.types'

// Initialize dependencies
const projectRepo = new SQLiteProjectRepository()
const versionRepo = new SQLiteVersionRepository()

/**
 * Register all version IPC handlers
 */
export function registerVersionHandlers(): void {
  // version:list - Get all versions for a project
  ipcMain.handle('version:list', async (_event, input: VersionListInput) => {
    try {
      return await listVersions(
        { projectId: input.projectId },
        { projectRepo, versionRepo }
      )
    } catch (error) {
      throw serializeError(error)
    }
  })

  // version:get - Get a single version by ID
  ipcMain.handle('version:get', async (_event, input: VersionGetInput) => {
    try {
      return await getVersion({ id: input.id }, { versionRepo })
    } catch (error) {
      throw serializeError(error)
    }
  })

  // version:create - Create a new version
  ipcMain.handle('version:create', async (_event, input: CreateVersionInput) => {
    try {
      return await createVersion(
        {
          projectId: input.projectId,
          versionName: input.versionName,
          branchName: input.branchName,
        },
        { projectRepo, versionRepo }
      )
    } catch (error) {
      throw serializeError(error)
    }
  })

  // version:setActive - Set a version as active (for runtime)
  ipcMain.handle('version:setActive', async (_event, input: VersionSetActiveInput) => {
    try {
      return await setActiveVersion({ id: input.id }, { versionRepo })
    } catch (error) {
      throw serializeError(error)
    }
  })
}
