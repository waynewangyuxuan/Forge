/**
 * Create Version Use Case
 * Creates a new version for an existing project (used for iteration)
 */

import { Version, CreateVersionInput } from '@shared/types/project.types'
import { DevStatus, RuntimeStatus } from '@shared/constants'
import { IProjectRepository, IVersionRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'

export interface CreateVersionDeps {
  projectRepo: IProjectRepository
  versionRepo: IVersionRepository
}

/**
 * Create a new version for a project
 *
 * This is used when iterating on an existing project.
 * The new version starts in 'drafting' status.
 */
export async function createVersion(
  input: CreateVersionInput,
  deps: CreateVersionDeps
): Promise<Version> {
  const { projectRepo, versionRepo } = deps

  // Validate input
  if (!input.projectId || input.projectId.trim() === '') {
    throw new ValidationError('Project ID is required', 'projectId')
  }

  if (!input.versionName || input.versionName.trim() === '') {
    throw new ValidationError('Version name is required', 'versionName')
  }

  if (!input.branchName || input.branchName.trim() === '') {
    throw new ValidationError('Branch name is required', 'branchName')
  }

  // Check project exists
  const project = await projectRepo.findById(input.projectId)
  if (!project) {
    throw new NotFoundError('Project', input.projectId)
  }

  // Check project is not archived
  if (project.archivedAt) {
    throw new ValidationError(
      'Cannot create version for archived project',
      'projectId'
    )
  }

  // Create the version
  const version = await versionRepo.create({
    projectId: input.projectId,
    versionName: input.versionName.trim(),
    branchName: input.branchName.trim(),
    devStatus: 'drafting' as DevStatus,
    runtimeStatus: 'not_configured' as RuntimeStatus,
  })

  return version
}
