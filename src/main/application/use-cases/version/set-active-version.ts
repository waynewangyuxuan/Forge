/**
 * Set Active Version Use Case
 * Sets a version as the active one for runtime (when runtime is configured)
 */

import { Version } from '@shared/types/project.types'
import { IVersionRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'

export interface SetActiveVersionDeps {
  versionRepo: IVersionRepository
}

export interface SetActiveVersionInput {
  id: string
}

/**
 * Set a version as active
 *
 * This marks the version that should be used for runtime operations.
 * In the current implementation, this is a validation-only operation
 * that confirms the version exists and returns it.
 *
 * Future: This could update runtime_configs or emit an event
 * to switch which version is actively running.
 */
export async function setActiveVersion(
  input: SetActiveVersionInput,
  deps: SetActiveVersionDeps
): Promise<Version> {
  const { versionRepo } = deps

  // Validate input
  if (!input.id || input.id.trim() === '') {
    throw new ValidationError('Version ID is required', 'id')
  }

  // Check version exists
  const version = await versionRepo.findById(input.id)
  if (!version) {
    throw new NotFoundError('Version', input.id)
  }

  // For now, we just return the version.
  // The frontend will store which version is "current" in its state.
  // When runtime config exists, this could update which version is
  // associated with active scheduled jobs.

  return version
}
