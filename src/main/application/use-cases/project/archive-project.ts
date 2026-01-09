/**
 * Archive Project Use Case
 * Soft-deletes a project by setting archivedAt timestamp
 */

import { IProjectRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'

export interface ArchiveProjectDeps {
  projectRepo: IProjectRepository
}

export interface ArchiveProjectInput {
  id: string
}

/**
 * Archive a project
 *
 * This is a soft delete - the project and its data remain in the database,
 * but it won't appear in the default project list.
 *
 * The project directory is NOT deleted from the filesystem.
 */
export async function archiveProject(
  input: ArchiveProjectInput,
  deps: ArchiveProjectDeps
): Promise<void> {
  const { projectRepo } = deps

  // Validate input
  if (!input.id || input.id.trim() === '') {
    throw new ValidationError('Project ID is required', 'id')
  }

  // Check project exists
  const project = await projectRepo.findById(input.id)
  if (!project) {
    throw new NotFoundError('Project', input.id)
  }

  // Check if already archived
  if (project.archivedAt) {
    // Already archived, no-op
    return
  }

  // Archive the project
  await projectRepo.archive(input.id)
}
