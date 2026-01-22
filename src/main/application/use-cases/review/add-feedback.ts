/**
 * Add Feedback Use Case
 * Saves or updates feedback for a version
 */

import { IVersionRepository, IFeedbackRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'
import { ReviewAddFeedbackInput } from '@shared/types/ipc.types'
import { Feedback } from '@shared/types/execution.types'

export interface AddFeedbackDeps {
  versionRepo: IVersionRepository
  feedbackRepo: IFeedbackRepository
}

/**
 * Add or update feedback for a version
 *
 * @param input - versionId and feedback content
 * @param deps - repository dependencies
 * @returns Created or updated Feedback
 */
export async function addFeedback(
  input: ReviewAddFeedbackInput,
  deps: AddFeedbackDeps
): Promise<Feedback> {
  const { versionRepo, feedbackRepo } = deps

  // Validate input
  if (!input.versionId || input.versionId.trim() === '') {
    throw new ValidationError('Version ID is required', 'versionId')
  }

  if (!input.feedback || input.feedback.trim() === '') {
    throw new ValidationError('Feedback content is required', 'feedback')
  }

  // Get version to verify it exists
  const version = await versionRepo.findById(input.versionId)
  if (!version) {
    throw new NotFoundError('Version', input.versionId)
  }

  // Upsert feedback
  return feedbackRepo.upsert({
    versionId: input.versionId,
    content: input.feedback,
  })
}
