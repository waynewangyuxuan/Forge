/**
 * Get Feedback Use Case
 * Retrieves feedback for a version
 */

import { IVersionRepository, IFeedbackRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'
import { ReviewGetFeedbackInput } from '@shared/types/ipc.types'
import { Feedback } from '@shared/types/execution.types'

export interface GetFeedbackDeps {
  versionRepo: IVersionRepository
  feedbackRepo: IFeedbackRepository
}

/**
 * Get feedback for a version
 *
 * @param input - versionId
 * @param deps - repository dependencies
 * @returns Feedback or null if none exists
 */
export async function getFeedback(
  input: ReviewGetFeedbackInput,
  deps: GetFeedbackDeps
): Promise<Feedback | null> {
  const { versionRepo, feedbackRepo } = deps

  // Validate input
  if (!input.versionId || input.versionId.trim() === '') {
    throw new ValidationError('Version ID is required', 'versionId')
  }

  // Get version to verify it exists
  const version = await versionRepo.findById(input.versionId)
  if (!version) {
    throw new NotFoundError('Version', input.versionId)
  }

  // Return feedback (or null if none exists)
  return feedbackRepo.findByVersionId(input.versionId)
}
