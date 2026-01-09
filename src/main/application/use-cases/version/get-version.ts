/**
 * Get Version Use Case
 * Retrieves a single version by ID
 */

import { Version } from '@shared/types/project.types'
import { IVersionRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'

export interface GetVersionDeps {
  versionRepo: IVersionRepository
}

export interface GetVersionInput {
  id: string
}

/**
 * Get a version by ID
 *
 * Throws NotFoundError if version doesn't exist
 */
export async function getVersion(
  input: GetVersionInput,
  deps: GetVersionDeps
): Promise<Version> {
  const { versionRepo } = deps

  // Validate input
  if (!input.id || input.id.trim() === '') {
    throw new ValidationError('Version ID is required', 'id')
  }

  const version = await versionRepo.findById(input.id)

  if (!version) {
    throw new NotFoundError('Version', input.id)
  }

  return version
}
