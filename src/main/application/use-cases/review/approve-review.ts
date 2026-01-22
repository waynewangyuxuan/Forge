/**
 * Approve Review Use Case
 * Transitions version status from reviewing → ready
 */

import { IVersionRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'
import { ReviewApproveInput } from '@shared/types/ipc.types'
import { createStateMachine } from '../../../domain/engines/state-machine'
import { loadDevFlowStateMachine } from '../../../infrastructure/config-loader'

export interface ApproveReviewDeps {
  versionRepo: IVersionRepository
}

/**
 * Approve the review, transitioning version to ready state
 *
 * @param input - versionId
 * @param deps - repository dependencies
 */
export async function approveReview(
  input: ReviewApproveInput,
  deps: ApproveReviewDeps
): Promise<void> {
  const { versionRepo } = deps

  // Validate input
  if (!input.versionId || input.versionId.trim() === '') {
    throw new ValidationError('Version ID is required', 'versionId')
  }

  // Get version
  const version = await versionRepo.findById(input.versionId)
  if (!version) {
    throw new NotFoundError('Version', input.versionId)
  }

  // Load state machine for dev flow
  const stateMachineConfig = loadDevFlowStateMachine()
  const stateMachine = createStateMachine(stateMachineConfig)

  // Validate current state is reviewing
  if (version.devStatus !== 'reviewing') {
    throw new ValidationError(
      `Cannot approve from state '${version.devStatus}'. Must be in 'reviewing' state.`,
      'devStatus'
    )
  }

  // Transition to ready state using state machine
  // APPROVE: reviewing → ready
  const readyState = stateMachine.transition(version.devStatus, 'APPROVE')
  await versionRepo.updateStatus(input.versionId, { devStatus: readyState })
}
