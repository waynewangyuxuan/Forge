/**
 * Resume Execution Use Case
 * Resumes a paused execution
 */

import { IExecutionRepository, IVersionRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'
import { ExecutionResumeInput } from '@shared/types/ipc.types'
import { createStateMachine } from '../../../domain'
import { loadDevFlowStateMachine } from '../../../infrastructure/config-loader'

export interface ResumeExecutionDeps {
  executionRepo: IExecutionRepository
  versionRepo: IVersionRepository
}

/**
 * Resume a paused execution
 *
 * @param input - ExecutionResumeInput with executionId
 * @param deps - Dependencies
 */
export async function resumeExecution(
  input: ExecutionResumeInput,
  deps: ResumeExecutionDeps
): Promise<void> {
  const { executionRepo, versionRepo } = deps

  // Validate input
  if (!input.executionId || input.executionId.trim() === '') {
    throw new ValidationError('Execution ID is required', 'executionId')
  }

  // Get execution
  const execution = await executionRepo.findById(input.executionId)
  if (!execution) {
    throw new NotFoundError('Execution', input.executionId)
  }

  // Validate current state is 'paused'
  if (execution.status !== 'paused' && !execution.isPaused) {
    throw new ValidationError(
      `Cannot resume execution in state '${execution.status}'. Must be 'paused'.`,
      'status'
    )
  }

  // Get version to update devStatus via state machine
  const version = await versionRepo.findById(execution.versionId)
  if (!version) {
    throw new NotFoundError('Version', execution.versionId)
  }

  // Transition version to executing state via state machine
  const stateMachineConfig = loadDevFlowStateMachine()
  const stateMachine = createStateMachine(stateMachineConfig)
  const executingState = stateMachine.transition(version.devStatus, 'RESUME')
  await versionRepo.updateStatus(version.id, { devStatus: executingState })

  // Clear paused flag and update status
  await executionRepo.setPaused(input.executionId, false)
}
