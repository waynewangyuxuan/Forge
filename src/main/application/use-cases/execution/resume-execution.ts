/**
 * Resume Execution Use Case
 * Resumes a paused execution
 */

import { IExecutionRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'
import { ExecutionResumeInput } from '@shared/types/ipc.types'

export interface ResumeExecutionDeps {
  executionRepo: IExecutionRepository
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

  // Validate current state is 'paused'
  if (execution.status !== 'paused' && !execution.isPaused) {
    throw new ValidationError(
      `Cannot resume execution in state '${execution.status}'. Must be 'paused'.`,
      'status'
    )
  }

  // Clear paused flag and update status
  await executionRepo.setPaused(input.executionId, false)
}
