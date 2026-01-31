/**
 * Retry Task Use Case
 * Retries a failed task in a paused execution
 */

import { IExecutionRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'
import { ExecutionRetryInput } from '@shared/types/ipc.types'

export interface RetryTaskDeps {
  executionRepo: IExecutionRepository
}

/**
 * Retry a failed task
 *
 * This clears the paused state so the orchestrator will retry the task.
 * The orchestrator is responsible for actually re-executing the task.
 *
 * @param input - ExecutionRetryInput with executionId and taskId
 * @param deps - Dependencies
 */
export async function retryTask(
  input: ExecutionRetryInput,
  deps: RetryTaskDeps
): Promise<void> {
  const { executionRepo } = deps

  // Validate input
  if (!input.executionId || input.executionId.trim() === '') {
    throw new ValidationError('Execution ID is required', 'executionId')
  }

  if (!input.taskId || input.taskId.trim() === '') {
    throw new ValidationError('Task ID is required', 'taskId')
  }

  // Get execution
  const execution = await executionRepo.findById(input.executionId)
  if (!execution) {
    throw new NotFoundError('Execution', input.executionId)
  }

  // Validate execution is paused (which happens when a task fails)
  if (!execution.isPaused && execution.status !== 'paused') {
    throw new ValidationError(
      'Execution must be paused to retry a task',
      'status'
    )
  }

  // Clear paused state - orchestrator will pick up and retry the current task
  await executionRepo.setPaused(input.executionId, false)
}
