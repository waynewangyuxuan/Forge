/**
 * Save Spec Use Case
 * Saves a spec file (PRODUCT.md, TECHNICAL.md, or REGULATION.md) to a project
 */

import * as path from 'path'
import { IProjectRepository, IVersionRepository } from '@shared/interfaces/repositories'
import { IFileSystemAdapter } from '@shared/interfaces/adapters'
import { ValidationError, NotFoundError } from '@shared/errors'
import { SpecFile, SpecSaveInput } from '@shared/types/ipc.types'

export interface SaveSpecDeps {
  projectRepo: IProjectRepository
  versionRepo: IVersionRepository
  fs: IFileSystemAdapter
}

/**
 * Save a spec file for a given version
 *
 * @param input - versionId, file name, and content
 * @param deps - repository and filesystem dependencies
 */
export async function saveSpec(
  input: SpecSaveInput,
  deps: SaveSpecDeps
): Promise<void> {
  const { projectRepo, versionRepo, fs } = deps

  // Validate input
  if (!input.versionId || input.versionId.trim() === '') {
    throw new ValidationError('Version ID is required', 'versionId')
  }

  if (!input.file || !isValidSpecFile(input.file)) {
    throw new ValidationError(
      'File must be PRODUCT.md, TECHNICAL.md, or REGULATION.md',
      'file'
    )
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
  const filePath = path.join(project.path, 'META', 'CORE', input.file)

  // Write file (FileSystemAdapter.writeFile creates directories if needed)
  await fs.writeFile(filePath, input.content)
}

/**
 * Type guard to validate spec file name
 */
function isValidSpecFile(file: string): file is SpecFile {
  return ['PRODUCT.md', 'TECHNICAL.md', 'REGULATION.md'].includes(file)
}
