/**
 * Version IPC Handlers
 * Handles version:* IPC channels
 */

import { ipcMain } from 'electron'
import { SQLiteVersionRepository } from '../repositories/sqlite-version.repo'
import { serializeError } from '@shared/errors'
import type {
  VersionListInput,
  VersionGetInput,
  VersionSetActiveInput,
} from '@shared/types/ipc.types'
import type { CreateVersionInput } from '@shared/types/project.types'

const versionRepo = new SQLiteVersionRepository()

/**
 * Register all version IPC handlers
 */
export function registerVersionHandlers(): void {
  // version:list - Get all versions for a project
  ipcMain.handle('version:list', async (_event, input: VersionListInput) => {
    try {
      return await versionRepo.findByProject(input.projectId)
    } catch (error) {
      throw serializeError(error)
    }
  })

  // version:get - Get a single version by ID
  ipcMain.handle('version:get', async (_event, input: VersionGetInput) => {
    try {
      return await versionRepo.findById(input.id)
    } catch (error) {
      throw serializeError(error)
    }
  })

  // version:create - Create a new version
  ipcMain.handle('version:create', async (_event, input: CreateVersionInput) => {
    try {
      return await versionRepo.create({
        projectId: input.projectId,
        versionName: input.versionName,
        branchName: input.branchName,
        devStatus: 'drafting',
        runtimeStatus: 'not_configured',
      })
    } catch (error) {
      throw serializeError(error)
    }
  })

  // version:setActive - Set a version as active (for runtime)
  // Note: This is a placeholder - actual implementation would update runtime config
  ipcMain.handle('version:setActive', async (_event, input: VersionSetActiveInput) => {
    try {
      // For now, just verify the version exists
      const version = await versionRepo.findById(input.id)
      if (!version) {
        throw new Error(`Version not found: ${input.id}`)
      }
      // TODO: Update runtime config to point to this version
    } catch (error) {
      throw serializeError(error)
    }
  })
}
