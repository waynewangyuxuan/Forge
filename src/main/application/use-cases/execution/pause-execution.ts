/**
 * Pause Execution Use Case
 * Pauses a running execution (current task will complete first)
 */

import { IExecutionRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'
import { ExecutionPauseInput } from '@shared/types/ipc.types'

export interface PauseExecutionDeps {
  executionRepo: IExecutionRepository
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
  const { executionRepo } = deps

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

  // Set paused flag - orchestrator will check this after current task
  await executionRepo.setPaused(input.executionId, true)
}
