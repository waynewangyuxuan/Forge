/**
 * Get Execution Status Use Case
 * Retrieves the current status of an execution
 */

import { IExecutionRepository } from '@shared/interfaces/repositories'
import { ValidationError, NotFoundError } from '@shared/errors'
import { ExecutionGetStatusInput } from '@shared/types/ipc.types'
import { Execution } from '@shared/types/execution.types'

export interface GetExecutionStatusDeps {
  executionRepo: IExecutionRepository
}

/**
 * Get execution status
 *
 * @param input - ExecutionGetStatusInput with executionId
 * @param deps - Dependencies
 * @returns Execution record
 */
export async function getExecutionStatus(
  input: ExecutionGetStatusInput,
  deps: GetExecutionStatusDeps
): Promise<Execution> {
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

  return execution
}
