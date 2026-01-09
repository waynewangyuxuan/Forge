/**
 * List Versions Use Case
 * Returns all versions for a project
 */

import { Version } from '@shared/types/project.types'
import { IProjectRepository, IVersionRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'

export interface ListVersionsDeps {
  projectRepo: IProjectRepository
  versionRepo: IVersionRepository
}

export interface ListVersionsInput {
  projectId: string
}

/**
 * List all versions for a project
 *
 * Returns versions ordered by creation date (newest first)
 */
export async function listVersions(
  input: ListVersionsInput,
  deps: ListVersionsDeps
): Promise<Version[]> {
  const { projectRepo, versionRepo } = deps

  // Validate input
  if (!input.projectId || input.projectId.trim() === '') {
    throw new ValidationError('Project ID is required', 'projectId')
  }

  // Check project exists
  const project = await projectRepo.findById(input.projectId)
  if (!project) {
    throw new NotFoundError('Project', input.projectId)
  }

  return versionRepo.findByProject(input.projectId)
}
