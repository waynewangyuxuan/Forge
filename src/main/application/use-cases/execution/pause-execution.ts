/**
 * Pause Execution Use Case
 * Pauses a running execution (current task will complete first)
 */

import { IExecutionRepository, IVersionRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'
import { ExecutionPauseInput } from '@shared/types/ipc.types'
import { createStateMachine } from '../../../domain'
import { loadDevFlowStateMachine } from '../../../infrastructure/config-loader'

export interface PauseExecutionDeps {
  executionRepo: IExecutionRepository
  versionRepo: IVersionRepository
}

/**
 * Pause an execution
 *
 * Note: The current task will complete before the pause takes effect.
 * The orchestrator checks isPaused flag after each task completes.
 *
 * @param input - ExecutionPauseInput with executionId
 * @param deps - Dependencies
 */
export async function pauseExecution(
  input: ExecutionPauseInput,
  deps: PauseExecutionDeps
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

  // Validate current state is 'running'
  if (execution.status !== 'running') {
    throw new ValidationError(
      `Cannot pause execution in state '${execution.status}'. Must be 'running'.`,
      'status'
    )
  }

  // Get version to update devStatus via state machine
  const version = await versionRepo.findById(execution.versionId)
  if (!version) {
    throw new NotFoundError('Version', execution.versionId)
  }

  // Transition version to paused state via state machine
  const stateMachineConfig = loadDevFlowStateMachine()
  const stateMachine = createStateMachine(stateMachineConfig)
  const pausedState = stateMachine.transition(version.devStatus, 'PAUSE')
  await versionRepo.updateStatus(version.id, { devStatus: pausedState })

  // Set paused flag - orchestrator will check this after current task
  await executionRepo.setPaused(input.executionId, true)
}
