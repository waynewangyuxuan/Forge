/**
 * Clear Feedback Use Case
 * Deletes feedback for a version
 */

import { IVersionRepository, IFeedbackRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'
import { ReviewClearFeedbackInput } from '@shared/types/ipc.types'

export interface ClearFeedbackDeps {
  versionRepo: IVersionRepository
  feedbackRepo: IFeedbackRepository
}

/**
 * Clear feedback for a version
 *
 * @param input - versionId
 * @param deps - repository dependencies
 */
export async function clearFeedback(
  input: ReviewClearFeedbackInput,
  deps: ClearFeedbackDeps
): Promise<void> {
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

  // Delete feedback (no-op if doesn't exist)
  await feedbackRepo.delete(input.versionId)
}
