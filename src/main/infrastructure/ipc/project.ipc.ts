/**
 * Project IPC Handlers
 * Handles project:* IPC channels
 */

import { ipcMain } from 'electron'
import { SQLiteProjectRepository } from '../repositories/sqlite-project.repo'
import { SQLiteVersionRepository } from '../repositories/sqlite-version.repo'
import { getFileSystemAdapter } from '../adapters/file-system.adapter'
import { serializeError } from '@shared/errors'
import {
  createProject,
  listProjects,
  getProject,
  archiveProject,
  deleteProject,
} from '../../application/use-cases/project'
import type {
  ProjectListInput,
  ProjectGetInput,
  ProjectArchiveInput,
  ProjectDeleteInput,
} from '@shared/types/ipc.types'
import type { CreateProjectInput } from '@shared/types/project.types'

// Initialize dependencies
const projectRepo = new SQLiteProjectRepository()
const versionRepo = new SQLiteVersionRepository()
const fs = getFileSystemAdapter()

/**
 * Register all project IPC handlers
 */
export function registerProjectHandlers(): void {
  // project:list - Get all projects
  ipcMain.handle('project:list', async (_event, input: ProjectListInput) => {
    try {
      return await listProjects(
        { includeArchived: input?.includeArchived },
        { projectRepo }
      )
    } catch (error) {
      throw serializeError(error)
    }
  })

  // project:get - Get a single project by ID
  ipcMain.handle('project:get', async (_event, input: ProjectGetInput) => {
    try {
      return await getProject({ id: input.id }, { projectRepo })
    } catch (error) {
      throw serializeError(error)
    }
  })

  // project:create - Create a new project
  ipcMain.handle('project:create', async (_event, input: CreateProjectInput) => {
    try {
      const result = await createProject(
        { name: input.name, path: input.path },
        { projectRepo, versionRepo, fs }
      )
      // Return just the project (version is created automatically)
      return result.project
    } catch (error) {
      throw serializeError(error)
    }
  })

  // project:archive - Archive a project
  ipcMain.handle('project:archive', async (_event, input: ProjectArchiveInput) => {
    try {
      await archiveProject({ id: input.id }, { projectRepo })
    } catch (error) {
      throw serializeError(error)
    }
  })

  // project:delete - Delete a project
  ipcMain.handle('project:delete', async (_event, input: ProjectDeleteInput) => {
    try {
      await deleteProject({ id: input.id }, { projectRepo })
    } catch (error) {
      throw serializeError(error)
    }
  })
}
