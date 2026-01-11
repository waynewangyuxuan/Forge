/**
 * Activate Project Use Case
 * Clones a project from GitHub when local files don't exist
 */

import { Project } from '@shared/types/project.types'
import { IProjectRepository } from '@shared/interfaces/repositories'
import { IFileSystemAdapter, IGitHubAdapter } from '@shared/interfaces/adapters'
import { ValidationError, NotFoundError } from '@shared/errors'

export interface ActivateProjectDeps {
  projectRepo: IProjectRepository
  fs: IFileSystemAdapter
  github: IGitHubAdapter
}

export interface ActivateProjectInput {
  id: string
}

/**
 * Activate a project by cloning from GitHub
 *
 * This is used when a project exists in the database but the local files
 * have been deleted. It re-clones the repository from GitHub.
 */
export async function activateProject(
  input: ActivateProjectInput,
  deps: ActivateProjectDeps
): Promise<Project> {
  const { projectRepo, fs, github } = deps

  // Validate input
  if (!input.id || input.id.trim() === '') {
    throw new ValidationError('Project ID is required', 'id')
  }

  // Check project exists
  const project = await projectRepo.findById(input.id)
  if (!project) {
    throw new NotFoundError('Project', input.id)
  }

  // Check if GitHub info exists
  if (!project.githubOwner || !project.githubRepo) {
    throw new ValidationError('Project has no GitHub repository to clone from', 'github')
  }

  // Check if local files already exist
  const localExists = await fs.exists(project.path)
  if (localExists) {
    // Already active, just return the project with updated status
    return { ...project, hasLocalFiles: true }
  }

  // Ensure parent directory exists
  const parentDir = project.path.substring(0, project.path.lastIndexOf('/'))
  await fs.createDir(parentDir, true)

  // Clone from GitHub
  await github.cloneRepo(project.githubOwner, project.githubRepo, project.path)

  // Return project with updated status
  return { ...project, hasLocalFiles: true }
}
