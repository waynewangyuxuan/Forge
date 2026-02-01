/**
 * Skip Task Use Case
 * Skips a failed or blocked task in an execution
 */

import * as path from 'path'
import { IProjectRepository, IVersionRepository, IExecutionRepository } from '@shared/interfaces/repositories'
import { IFileSystemAdapter } from '@shared/interfaces/adapters'
import { ValidationError, NotFoundError } from '@shared/errors'
import { ExecutionSkipInput } from '@shared/types/ipc.types'
import { atomicUpdateTodoStatus, createStateMachine } from '../../../domain'
import { loadDevFlowStateMachine } from '../../../infrastructure/config-loader'

export interface SkipTaskDeps {
  projectRepo: IProjectRepository
  versionRepo: IVersionRepository
  executionRepo: IExecutionRepository
  fs: IFileSystemAdapter
}

/**
 * Skip a task
 *
 * Marks the task as skipped in TODO.md and clears paused state.
 * Note: Skipped tasks do NOT satisfy dependencies.
 *
 * @param input - ExecutionSkipInput with executionId and taskId
 * @param deps - Dependencies
 */
export async function skipTask(
  input: ExecutionSkipInput,
  deps: SkipTaskDeps
): Promise<void> {
  const { projectRepo, versionRepo, executionRepo, fs } = deps

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

  // Get version and project
  const version = await versionRepo.findById(execution.versionId)
  if (!version) {
    throw new NotFoundError('Version', execution.versionId)
  }

  const project = await projectRepo.findById(version.projectId)
  if (!project) {
    throw new NotFoundError('Project', version.projectId)
  }

  // Validate execution is paused
  if (!execution.isPaused && execution.status !== 'paused') {
    throw new ValidationError(
      'Execution must be paused to skip a task',
      'status'
    )
  }

  // Update TODO.md to mark task as skipped
  const todoPath = path.join(project.path, 'META', 'TODO.md')
  await atomicUpdateTodoStatus(fs, todoPath, input.taskId, 'skipped')

  // Update execution progress
  await executionRepo.updateProgress(input.executionId, {
    completedTasks: execution.completedTasks + 1,
    currentTaskId: null,
  })

  // Transition version to executing state via state machine (RESUME from paused)
  const stateMachineConfig = loadDevFlowStateMachine()
  const stateMachine = createStateMachine(stateMachineConfig)
  const executingState = stateMachine.transition(version.devStatus, 'RESUME')
  await versionRepo.updateStatus(version.id, { devStatus: executingState })

  // Clear paused state - orchestrator will move to next task
  await executionRepo.setPaused(input.executionId, false)
}
