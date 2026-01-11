/**
 * List Projects Use Case
 * Returns all projects, optionally including archived ones
 * Also checks if local files exist for each project
 */

import { Project } from '@shared/types/project.types'
import { IProjectRepository } from '@shared/interfaces/repositories'
import { IFileSystemAdapter } from '@shared/interfaces/adapters'

export interface ListProjectsDeps {
  projectRepo: IProjectRepository
  fs?: IFileSystemAdapter
}

export interface ListProjectsOptions {
  includeArchived?: boolean
}

/**
 * List all projects
 *
 * By default, only returns non-archived projects.
 * Pass { includeArchived: true } to include archived projects.
 * Also computes hasLocalFiles for each project.
 */
export async function listProjects(
  options: ListProjectsOptions,
  deps: ListProjectsDeps
): Promise<Project[]> {
  const { projectRepo, fs } = deps

  const projects = await projectRepo.findAll({
    includeArchived: options.includeArchived ?? false,
  })

  // Check if local files exist for each project
  if (fs) {
    const projectsWithStatus = await Promise.all(
      projects.map(async (project) => {
        const hasLocalFiles = project.path ? await fs.exists(project.path) : false
        return { ...project, hasLocalFiles }
      })
    )
    return projectsWithStatus
  }

  return projects
}
