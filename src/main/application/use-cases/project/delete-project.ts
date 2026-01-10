/**
 * Delete Project Use Case
 * Permanently deletes a project from the database, and optionally from GitHub and local filesystem
 */

import { IProjectRepository } from '@shared/interfaces/repositories'
import { IFileSystemAdapter, IGitHubAdapter } from '@shared/interfaces/adapters'
import { ValidationError, NotFoundError } from '@shared/errors'

export interface DeleteProjectDeps {
  projectRepo: IProjectRepository
  fs?: IFileSystemAdapter
  github?: IGitHubAdapter
}

export interface DeleteProjectInput {
  id: string
  deleteFromGitHub?: boolean
  deleteLocalFiles?: boolean
}

/**
 * Permanently delete a project
 *
 * This removes the project and all related data (versions, executions, etc.)
 * from the database via cascade delete.
 *
 * Optional: Also deletes from GitHub and/or local filesystem.
 */
export async function deleteProject(
  input: DeleteProjectInput,
  deps: DeleteProjectDeps
): Promise<void> {
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

  // Delete from GitHub if requested
  if (input.deleteFromGitHub && github && project.githubOwner && project.githubRepo) {
    try {
      await github.deleteRepo(project.githubOwner, project.githubRepo)
    } catch (error) {
      // Log error but continue with deletion
      console.error('Failed to delete GitHub repository:', error)
      // Re-throw if it's a critical error (not authenticated, etc.)
      if ((error as { code?: string }).code === 'GITHUB_NOT_AUTHENTICATED') {
        throw error
      }
    }
  }

  // Delete local files if requested
  if (input.deleteLocalFiles && fs && project.path) {
    try {
      await fs.remove(project.path)
    } catch (error) {
      // Log error but continue with deletion
      console.error('Failed to delete local files:', error)
    }
  }

  // Delete the project from database (cascade handles versions, executions, etc.)
  await projectRepo.delete(input.id)
}
