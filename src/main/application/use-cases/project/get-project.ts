/**
 * Get Project Use Case
 * Retrieves a single project by ID
 */

import { Project } from '@shared/types/project.types'
import { IProjectRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'

export interface GetProjectDeps {
  projectRepo: IProjectRepository
}

export interface GetProjectInput {
  id: string
}

/**
 * Get a project by ID
 *
 * Throws NotFoundError if project doesn't exist
 */
export async function getProject(
  input: GetProjectInput,
  deps: GetProjectDeps
): Promise<Project> {
  const { projectRepo } = deps

  // Validate input
  if (!input.id || input.id.trim() === '') {
    throw new ValidationError('Project ID is required', 'id')
  }

  const project = await projectRepo.findById(input.id)

  if (!project) {
    throw new NotFoundError('Project', input.id)
  }

  return project
}
