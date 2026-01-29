/**
 * Approve Review Use Case
 * Transitions version status from reviewing → ready
 */

import * as path from 'path'
import { IProjectRepository, IVersionRepository } from '@shared/interfaces/repositories'
import { IFileSystemAdapter } from '@shared/interfaces/adapters'
import { ValidationError, NotFoundError } from '@shared/errors'
import { ReviewApproveInput } from '@shared/types/ipc.types'
import { createStateMachine } from '../../../domain/engines/state-machine'
import { loadDevFlowStateMachine } from '../../../infrastructure/config-loader'
import { parseTodoIndex } from '../../../domain/engines/todo-parser'

export interface ApproveReviewDeps {
  projectRepo: IProjectRepository
  versionRepo: IVersionRepository
  fs: IFileSystemAdapter
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
  const { projectRepo, versionRepo, fs } = deps

  // Validate input
  if (!input.versionId || input.versionId.trim() === '') {
    throw new ValidationError('Version ID is required', 'versionId')
  }

  // Get version
  const version = await versionRepo.findById(input.versionId)
  if (!version) {
    throw new NotFoundError('Version', input.versionId)
  }

  // Get project
  const project = await projectRepo.findById(version.projectId)
  if (!project) {
    throw new NotFoundError('Project', version.projectId)
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

  // Validate that TODO.md exists and has tasks
  const todoPath = path.join(project.path, 'META', 'TODO.md')
  const todoExists = await fs.exists(todoPath)
  if (!todoExists) {
    throw new ValidationError('Cannot approve: TODO.md does not exist', 'todo')
  }

  const todoContent = await fs.readFile(todoPath)
  const todoIndex = parseTodoIndex(todoContent)
  const totalTasks = todoIndex.milestones.reduce((sum, m) => sum + m.tasks.length, 0)
  if (totalTasks === 0) {
    throw new ValidationError('Cannot approve: no tasks found in TODO.md', 'tasks')
  }

  // Transition to ready state using state machine
  // APPROVE: reviewing → ready
  const readyState = stateMachine.transition(version.devStatus, 'APPROVE')
  await versionRepo.updateStatus(input.versionId, { devStatus: readyState })
}
