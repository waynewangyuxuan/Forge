/**
 * Abort Execution Use Case
 * Aborts execution and resets to pre-execution state
 */

import {
  IProjectRepository,
  IVersionRepository,
  IExecutionRepository,
} from '@shared/interfaces/repositories'
import { IGitAdapter, IClaudeAdapter } from '@shared/interfaces/adapters'
import { ValidationError, NotFoundError } from '@shared/errors'
import { ExecutionAbortInput } from '@shared/types/ipc.types'
import { createStateMachine } from '../../../domain'
import { loadDevFlowStateMachine } from '../../../infrastructure/config-loader'

export interface AbortExecutionDeps {
  projectRepo: IProjectRepository
  versionRepo: IVersionRepository
  executionRepo: IExecutionRepository
  git: IGitAdapter
  claude: IClaudeAdapter
}

export interface AbortExecutionResult {
  success: boolean
  resetFailed?: boolean
  resetError?: string
}

/**
 * Abort an execution and reset to pre-execution state
 *
 * @param input - ExecutionAbortInput with executionId
 * @param deps - Dependencies
 * @returns Result with reset status
 */
export async function abortExecution(
  input: ExecutionAbortInput,
  deps: AbortExecutionDeps
): Promise<AbortExecutionResult> {
  const { projectRepo, versionRepo, executionRepo, git, claude } = deps

  // Validate input
  if (!input.executionId || input.executionId.trim() === '') {
    throw new ValidationError('Execution ID is required', 'executionId')
  }

  // Get execution
  const execution = await executionRepo.findById(input.executionId)
  if (!execution) {
    throw new NotFoundError('Execution', input.executionId)
  }

  // Validate current state allows abort
  if (execution.status === 'completed' || execution.status === 'aborted') {
    throw new ValidationError(
      `Cannot abort execution in state '${execution.status}'.`,
      'status'
    )
  }

  // Get version and project for git reset
  const version = await versionRepo.findById(execution.versionId)
  if (!version) {
    throw new NotFoundError('Version', execution.versionId)
  }

  const project = await projectRepo.findById(version.projectId)
  if (!project) {
    throw new NotFoundError('Project', version.projectId)
  }

  // Try to abort running Claude process
  try {
    await claude.abort(input.executionId)
  } catch {
    // Ignore - process may not be running
  }

  // Try to reset git to pre-execution commit
  let resetFailed = false
  let resetError: string | undefined

  if (execution.preExecutionCommit && (await git.isRepo(project.path))) {
    try {
      await git.reset(project.path, execution.preExecutionCommit, 'hard')
    } catch (error) {
      resetFailed = true
      resetError = error instanceof Error ? error.message : String(error)
      // Don't throw - still mark as aborted
    }
  }

  // Mark execution as aborted
  await executionRepo.complete(input.executionId, 'aborted')

  // Transition version back to ready state
  const stateMachineConfig = loadDevFlowStateMachine()
  const stateMachine = createStateMachine(stateMachineConfig)

  try {
    const newState = stateMachine.transition(version.devStatus, 'ABORT')
    await versionRepo.updateStatus(execution.versionId, { devStatus: newState })
  } catch {
    // If transition fails, force to 'ready' state
    await versionRepo.updateStatus(execution.versionId, { devStatus: 'ready' })
  }

  return {
    success: true,
    resetFailed,
    resetError,
  }
}
