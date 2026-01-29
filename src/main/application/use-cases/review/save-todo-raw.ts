/**
 * Save Todo Raw Use Case
 * Saves the raw content of TODO.md
 */

import * as path from 'path'
import { IProjectRepository, IVersionRepository } from '@shared/interfaces/repositories'
import { IFileSystemAdapter } from '@shared/interfaces/adapters'
import { ValidationError, NotFoundError } from '@shared/errors'
import { ReviewSaveTodoRawInput } from '@shared/types/ipc.types'

export interface SaveTodoRawDeps {
  projectRepo: IProjectRepository
  versionRepo: IVersionRepository
  fs: IFileSystemAdapter
}

/**
 * Save raw TODO.md content
 *
 * @param input - versionId and content
 * @param deps - repository and filesystem dependencies
 */
export async function saveTodoRaw(
  input: ReviewSaveTodoRawInput,
  deps: SaveTodoRawDeps
): Promise<void> {
  const { projectRepo, versionRepo, fs } = deps

  // Validate input
  if (!input.versionId || input.versionId.trim() === '') {
    throw new ValidationError('Version ID is required', 'versionId')
  }

  if (input.content === undefined || input.content === null) {
    throw new ValidationError('Content is required', 'content')
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

  // Write file (FileSystemAdapter.writeFile creates directories if needed)
  await fs.writeFile(filePath, input.content)
}
