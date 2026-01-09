/**
 * Project IPC Handlers
 * Handles project:* IPC channels
 */

import { ipcMain } from 'electron'
import { SQLiteProjectRepository } from '../repositories/sqlite-project.repo'
import { SQLiteVersionRepository } from '../repositories/sqlite-version.repo'
import { serializeError } from '@shared/errors'
import type {
  ProjectListInput,
  ProjectGetInput,
  ProjectArchiveInput,
  ProjectDeleteInput,
} from '@shared/types/ipc.types'
import type { CreateProjectInput } from '@shared/types/project.types'

const projectRepo = new SQLiteProjectRepository()
const versionRepo = new SQLiteVersionRepository()

/**
 * Register all project IPC handlers
 */
export function registerProjectHandlers(): void {
  // project:list - Get all projects
  ipcMain.handle('project:list', async (_event, input: ProjectListInput) => {
    try {
      return await projectRepo.findAll({
        includeArchived: input?.includeArchived,
      })
    } catch (error) {
      throw serializeError(error)
    }
  })

  // project:get - Get a single project by ID
  ipcMain.handle('project:get', async (_event, input: ProjectGetInput) => {
    try {
      return await projectRepo.findById(input.id)
    } catch (error) {
      throw serializeError(error)
    }
  })

  // project:create - Create a new project
  ipcMain.handle('project:create', async (_event, input: CreateProjectInput) => {
    try {
      // Create the project
      const project = await projectRepo.create({
        name: input.name,
        path: input.path,
      })

      // Create initial version (v1.0 on main branch)
      await versionRepo.create({
        projectId: project.id,
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: 'drafting',
        runtimeStatus: 'not_configured',
      })

      return project
    } catch (error) {
      throw serializeError(error)
    }
  })

  // project:archive - Archive a project
  ipcMain.handle('project:archive', async (_event, input: ProjectArchiveInput) => {
    try {
      await projectRepo.archive(input.id)
    } catch (error) {
      throw serializeError(error)
    }
  })

  // project:delete - Delete a project
  ipcMain.handle('project:delete', async (_event, input: ProjectDeleteInput) => {
    try {
      await projectRepo.delete(input.id)
    } catch (error) {
      throw serializeError(error)
    }
  })
}
