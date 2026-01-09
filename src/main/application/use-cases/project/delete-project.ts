/**
 * Delete Project Use Case
 * Permanently deletes a project from the database (not filesystem)
 */

import { IProjectRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'

export interface DeleteProjectDeps {
  projectRepo: IProjectRepository
}

export interface DeleteProjectInput {
  id: string
}

/**
 * Permanently delete a project
 *
 * This removes the project and all related data (versions, executions, etc.)
 * from the database via cascade delete.
 *
 * NOTE: The project directory is NOT deleted from the filesystem.
 * This is by design - users may want to keep their code even after
 * removing it from Forge management.
 */
export async function deleteProject(
  input: DeleteProjectInput,
  deps: DeleteProjectDeps
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

  // Delete the project (cascade handles versions, executions, etc.)
  await projectRepo.delete(input.id)
}
