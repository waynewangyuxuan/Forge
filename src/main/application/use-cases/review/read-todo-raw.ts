/**
 * Read Todo Raw Use Case
 * Reads the raw content of TODO.md
 */

import * as path from 'path'
import { IProjectRepository, IVersionRepository } from '@shared/interfaces/repositories'
import { IFileSystemAdapter } from '@shared/interfaces/adapters'
import { ValidationError, NotFoundError, FileNotFoundError } from '@shared/errors'
import { ReviewReadTodoRawInput } from '@shared/types/ipc.types'

export interface ReadTodoRawDeps {
  projectRepo: IProjectRepository
  versionRepo: IVersionRepository
  fs: IFileSystemAdapter
}

/**
 * Read raw TODO.md content
 *
 * @param input - versionId
 * @param deps - repository and filesystem dependencies
 * @returns Raw TODO.md content as string, or empty string if file doesn't exist
 */
export async function readTodoRaw(
  input: ReviewReadTodoRawInput,
  deps: ReadTodoRawDeps
): Promise<string> {
  const { projectRepo, versionRepo, fs } = deps

  // Validate input
  if (!input.versionId || input.versionId.trim() === '') {
    throw new ValidationError('Version ID is required', 'versionId')
  }

  // Get version
  const version = await versionRepo.findById(input.versionId)
  if (!version) {
    throw new NotFoundError('Version', input.versionId)
  }

  // Get project
  const project = await projectRepo.findById(version.projectId)
  if (!project) {
    throw new NotFoundError('Project', version.projectId)
  }

  // Construct file path
  const filePath = path.join(project.path, 'META', 'TODO.md')

  // Read file, return empty string if it doesn't exist
  try {
    return await fs.readFile(filePath)
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      return ''
    }
    throw error
  }
}
