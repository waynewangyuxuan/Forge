/**
 * Get Stale Executions Use Case
 * Retrieves executions that were interrupted (running/paused at app shutdown)
 */

import { IExecutionRepository } from '@shared/interfaces/repositories'
import { Execution } from '@shared/types/execution.types'

export interface GetStaleExecutionsDeps {
  executionRepo: IExecutionRepository
}

/**
 * Get stale executions
 *
 * Called on app startup to detect executions that need recovery.
 * Returns executions that are in 'running' or 'paused' state,
 * which indicates they were interrupted by app shutdown.
 *
 * @param deps - Dependencies
 * @returns Array of stale executions
 */
export async function getStaleExecutions(
  deps: GetStaleExecutionsDeps
): Promise<Execution[]> {
  const { executionRepo } = deps

  return await executionRepo.findRunningOrPaused()
}
