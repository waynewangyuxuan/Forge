/**
 * Start Execution Use Case
 * Initiates code execution for a version in ready state
 */

import * as path from 'path'
import {
  IProjectRepository,
  IVersionRepository,
  IExecutionRepository,
} from '@shared/interfaces/repositories'
import { IFileSystemAdapter, IGitAdapter, IClaudeAdapter } from '@shared/interfaces/adapters'
import { ValidationError, NotFoundError } from '@shared/errors'
import { ExecutionStartInput } from '@shared/types/ipc.types'
import { Execution } from '@shared/types/execution.types'
import { Settings } from '@shared/types/runtime.types'
import { createStateMachine } from '../../../domain'
import { loadDevFlowStateMachine } from '../../../infrastructure/config-loader'
import { parseTodoIndex } from '../../../domain'
import { nowISO } from '../../../infrastructure/repositories/base.repo'

export interface StartExecutionDeps {
  projectRepo: IProjectRepository
  versionRepo: IVersionRepository
  executionRepo: IExecutionRepository
  fs: IFileSystemAdapter
  git: IGitAdapter
  claude: IClaudeAdapter
  settings: Settings
}

/**
 * Start execution for a version
 *
 * Steps:
 * 1. Validate version is in 'ready' state
 * 2. Check for existing running execution (idempotent)
 * 3. Check Claude availability
 * 4. Handle dirty working tree
 * 5. Create pre-execution snapshot commit
 * 6. Create Execution record
 * 7. Transition version to 'executing' state
 *
 * @param input - ExecutionStartInput with versionId
 * @param deps - Dependencies
 * @returns Created Execution record
 */
export async function startExecution(
  input: ExecutionStartInput,
  deps: StartExecutionDeps
): Promise<Execution> {
  const { projectRepo, versionRepo, executionRepo, fs, git, claude, settings } = deps

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

  // Validate current state is 'ready'
  if (version.devStatus !== 'ready') {
    throw new ValidationError(
      `Cannot start execution from state '${version.devStatus}'. Must be in 'ready' state.`,
      'devStatus'
    )
  }

  // Check for existing running execution (idempotent - return existing)
  const existingExecutions = await executionRepo.findByVersion(input.versionId)
  const runningExecution = existingExecutions.find(
    (e) => e.status === 'running' || e.status === 'paused'
  )
  if (runningExecution) {
    return runningExecution
  }

  // Check Claude availability
  const claudeAvailable = await claude.isAvailable()
  if (!claudeAvailable) {
    throw new ValidationError(
      'Claude CLI is not available. Please install it and try again.',
      'claude'
    )
  }

  // Count total tasks from TODO.md
  const todoPath = path.join(project.path, 'META', 'TODO.md')
  const todoExists = await fs.exists(todoPath)
  if (!todoExists) {
    throw new ValidationError('Cannot start: TODO.md does not exist', 'todo')
  }

  const todoContent = await fs.readFile(todoPath)
  const todoIndex = parseTodoIndex(todoContent)
  const totalTasks = todoIndex.milestones.reduce(
    (sum: number, m) => sum + m.tasks.length,
    0
  )
  const completedTasks = todoIndex.milestones.reduce(
    (sum: number, m) => sum + m.tasks.filter((t) => t.completed).length,
    0
  )

  if (totalTasks === 0) {
    throw new ValidationError('Cannot start: no tasks found in TODO.md', 'tasks')
  }

  // Handle dirty working tree
  let preExecutionCommit: string | null = null

  if (await git.isRepo(project.path)) {
    const status = await git.status(project.path)
    const isDirty =
      status.staged.length > 0 ||
      status.unstaged.length > 0 ||
      status.untracked.length > 0

    if (isDirty) {
      if (settings.autoCommitBeforeExecution) {
        // Auto-commit with snapshot message
        await git.add(project.path, ['.'])
        await git.commit(project.path, 'chore: snapshot before execution')
      } else {
        throw new ValidationError(
          'Working tree has uncommitted changes. Commit or stash first, or enable auto-commit in settings.',
          'git'
        )
      }
    }

    // Create pre-execution snapshot commit (empty if tree is clean)
    try {
      preExecutionCommit = await git.commitWithOptions(
        project.path,
        'chore(execution): pre-execution snapshot',
        { allowEmpty: true }
      )
    } catch {
      // If commit fails, continue without snapshot (can't rollback on abort)
      preExecutionCommit = null
    }
  }

  // Create Execution record
  const execution = await executionRepo.create({
    versionId: input.versionId,
    startedAt: nowISO(),
    completedAt: null,
    status: 'running',
    totalTasks,
    completedTasks,
    currentTaskId: null,
    preExecutionCommit,
    isPaused: false,
  })

  // Transition version to 'executing' state
  const executingState = stateMachine.transition(version.devStatus, 'START')
  await versionRepo.updateStatus(input.versionId, { devStatus: executingState })

  return execution
}
