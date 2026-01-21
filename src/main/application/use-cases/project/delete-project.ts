/**
 * Delete Project Use Case
 * Permanently deletes a project from the database, and optionally from GitHub and local filesystem
 *
 * Outcomes:
 * - 'deleted': Full delete (DB + GitHub + local files)
 * - 'deactivated': Local files removed only (project remains in DB as inactive)
 * - 'removed': Removed from Forge only (DB deleted, files/GitHub preserved)
 */

import { Project } from '@shared/types/project.types'
import { IProjectRepository } from '@shared/interfaces/repositories'
import { IFileSystemAdapter, IGitHubAdapter } from '@shared/interfaces/adapters'
import { ValidationError, NotFoundError, GitHubRepoNotFoundError } from '@shared/errors'
import { WarningCodes } from '@shared/constants'
import type { IPCWarning, DeleteOutcome } from '@shared/types/ipc.types'

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

export interface DeleteProjectOutput {
  outcome: DeleteOutcome
  project?: Project
  warnings?: IPCWarning[]
}

/**
 * Delete a project with explicit outcome
 *
 * Returns structured result indicating what happened:
 * - 'deleted': Full delete (DB + optional GitHub/local)
 * - 'deactivated': Local files only (project stays in DB, marked inactive)
 * - 'removed': Remove from Forge only (DB deleted, files/GitHub preserved)
 */
export async function deleteProject(
  input: DeleteProjectInput,
  deps: DeleteProjectDeps
): Promise<DeleteProjectOutput> {
  const { projectRepo, fs, github } = deps
  const warnings: IPCWarning[] = []

  // Validate input
  if (!input.id?.trim()) {
    throw new ValidationError('Project ID is required', 'id')
  }

  // Invariant: deleteFromGitHub implies deleteLocalFiles
  if (input.deleteFromGitHub && !input.deleteLocalFiles) {
    throw new ValidationError(
      'Deleting from GitHub requires also deleting local files',
      'deleteLocalFiles'
    )
  }

  // Check project exists
  const project = await projectRepo.findById(input.id)
  if (!project) {
    throw new NotFoundError('Project', input.id)
  }

  // Delete from GitHub if requested (fails fast on error, except for "already deleted")
  if (input.deleteFromGitHub && github && project.githubOwner && project.githubRepo) {
    try {
      await github.deleteRepo(project.githubOwner, project.githubRepo)
    } catch (error) {
      // Idempotency: "already deleted" is success + warning
      if (error instanceof GitHubRepoNotFoundError) {
        warnings.push({
          code: WarningCodes.GITHUB_ALREADY_DELETED,
          message: 'GitHub repository was already deleted',
          details: { owner: project.githubOwner, repo: project.githubRepo },
        })
      } else {
        // Re-throw scope errors and other failures
        throw error
      }
    }
  }

  // Delete local files if requested
  if (input.deleteLocalFiles && fs && project.path) {
    try {
      const exists = await fs.exists(project.path)
      if (exists) {
        await fs.remove(project.path)
      } else {
        warnings.push({
          code: WarningCodes.LOCAL_ALREADY_MISSING,
          message: 'Local files were already missing',
          details: { path: project.path },
        })
      }
    } catch (error) {
      // Local delete failure is a warning, not an error
      warnings.push({
        code: WarningCodes.LOCAL_DELETE_FAILED,
        message: `Failed to delete local files: ${(error as Error).message}`,
        details: { path: project.path },
      })
    }
  }

  // Determine outcome and apply changes
  if (input.deleteLocalFiles && !input.deleteFromGitHub) {
    // Deactivate: keep in DB, local files removed
    // Data-driven: check actual filesystem state instead of assuming success
    const stillExists = fs && project.path ? await fs.exists(project.path) : false
    return {
      outcome: 'deactivated',
      project: { ...project, hasLocalFiles: stillExists },
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  // Full delete or remove from Forge - delete from database
  await projectRepo.delete(input.id)
  return {
    outcome: input.deleteFromGitHub ? 'deleted' : 'removed',
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}
