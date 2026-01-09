/**
 * List Projects Use Case
 * Returns all projects, optionally including archived ones
 */

import { Project } from '@shared/types/project.types'
import { IProjectRepository } from '@shared/interfaces/repositories'

export interface ListProjectsDeps {
  projectRepo: IProjectRepository
}

export interface ListProjectsOptions {
  includeArchived?: boolean
}

/**
 * List all projects
 *
 * By default, only returns non-archived projects.
 * Pass { includeArchived: true } to include archived projects.
 */
export async function listProjects(
  options: ListProjectsOptions,
  deps: ListProjectsDeps
): Promise<Project[]> {
  const { projectRepo } = deps

  return projectRepo.findAll({
    includeArchived: options.includeArchived ?? false,
  })
}
