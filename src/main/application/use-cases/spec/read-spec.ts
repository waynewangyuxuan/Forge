/**
 * Read Spec Use Case
 * Reads a spec file (PRODUCT.md, TECHNICAL.md, or REGULATION.md) from a project
 */

import * as path from 'path'
import { IProjectRepository, IVersionRepository } from '@shared/interfaces/repositories'
import { IFileSystemAdapter } from '@shared/interfaces/adapters'
import { ValidationError, NotFoundError, FileNotFoundError } from '@shared/errors'
import { SpecFile, SpecReadInput } from '@shared/types/ipc.types'

export interface ReadSpecDeps {
  projectRepo: IProjectRepository
  versionRepo: IVersionRepository
  fs: IFileSystemAdapter
}

/**
 * Read a spec file for a given version
 *
 * @param input - versionId and file name
 * @param deps - repository and filesystem dependencies
 * @returns file content as string, or empty string if file doesn't exist
 */
export async function readSpec(
  input: SpecReadInput,
  deps: ReadSpecDeps
): Promise<string> {
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

  // Read file, return empty string if it doesn't exist
  try {
    return await fs.readFile(filePath)
  } catch (error) {
    if (error instanceof FileNotFoundError) {
      // File doesn't exist yet, return empty string
      return ''
    }
    throw error
  }
}

/**
 * Type guard to validate spec file name
 */
function isValidSpecFile(file: string): file is SpecFile {
  return ['PRODUCT.md', 'TECHNICAL.md', 'REGULATION.md'].includes(file)
}
