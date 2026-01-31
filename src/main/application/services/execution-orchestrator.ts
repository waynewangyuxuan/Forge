/**
 * Execution Orchestrator
 * Manages the async execution loop for code generation tasks
 *
 * Key responsibilities:
 * - Execute tasks sequentially
 * - Handle pause/resume/abort
 * - Emit progress events
 * - Persist state to SQLite for crash recovery
 */

import * as path from 'path'
import {
  IProjectRepository,
  IVersionRepository,
  IExecutionRepository,
  ITaskAttemptRepository,
} from '@shared/interfaces/repositories'
import { IFileSystemAdapter, IClaudeAdapter } from '@shared/interfaces/adapters'
import { Execution, ExecutionPlan, Task, Milestone } from '@shared/types/execution.types'
import {
  ExecutionProgressEvent,
  ExecutionTaskStartEvent,
  ExecutionTaskDoneEvent,
  ExecutionTaskFailedEvent,
  ExecutionPausedEvent,
  ExecutionResumedEvent,
  ExecutionBlockedEvent,
  ExecutionCompletedEvent,
  ExecutionErrorEvent,
} from '@shared/types/ipc.types'
import {
  getNextTask,
  getProgress,
  NextTaskResult,
} from '../../domain'
import {
  extractTaskOutputJson,
  validateTaskOutput,
  writeTaskOutput,
  atomicUpdateTodoStatus,
} from '../../domain'
import { parseExecutionPlan } from '../../domain'
import { renderPrompt } from '../../domain'
import { loadPromptConfig } from '../../infrastructure/config-loader'
import { nowISO } from '../../infrastructure/repositories/base.repo'

/**
 * Event emitters for execution progress
 */
export interface ExecutionEventEmitters {
  emitProgress: (data: ExecutionProgressEvent) => void
  emitTaskStart: (data: ExecutionTaskStartEvent) => void
  emitTaskDone: (data: ExecutionTaskDoneEvent) => void
  emitTaskFailed: (data: ExecutionTaskFailedEvent) => void
  emitPaused: (data: ExecutionPausedEvent) => void
  emitResumed: (data: ExecutionResumedEvent) => void
  emitBlocked: (data: ExecutionBlockedEvent) => void
  emitCompleted: (data: ExecutionCompletedEvent) => void
  emitError: (data: ExecutionErrorEvent) => void
}

/**
 * Dependencies for execution orchestrator
 */
export interface ExecutionOrchestratorDeps {
  projectRepo: IProjectRepository
  versionRepo: IVersionRepository
  executionRepo: IExecutionRepository
  taskAttemptRepo: ITaskAttemptRepository
  fs: IFileSystemAdapter
  claude: IClaudeAdapter
  events: ExecutionEventEmitters
}

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  taskTimeout: number // seconds
  maxRetries: number
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  taskTimeout: 300, // 5 minutes
  maxRetries: 3,
}

/**
 * Load execution plan from project META folder
 */
async function loadPlan(
  projectPath: string,
  fs: IFileSystemAdapter
): Promise<ExecutionPlan> {
  const metaPath = path.join(projectPath, 'META')
  const todoPath = path.join(metaPath, 'TODO.md')
  const milestonesPath = path.join(metaPath, 'MILESTONES')

  // Read TODO.md
  const todoContent = await fs.readFile(todoPath)

  // Read milestone files
  const milestoneFiles: Array<{ filename: string; content: string }> = []

  if (await fs.exists(milestonesPath)) {
    const files = await fs.readDir(milestonesPath)
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(milestonesPath, file))
        milestoneFiles.push({ filename: file, content })
      }
    }
  }

  return parseExecutionPlan(todoContent, milestoneFiles)
}

/**
 * Build prompt for executing a task
 */
async function buildTaskPrompt(
  task: Task,
  milestone: Milestone,
  projectPath: string,
  fs: IFileSystemAdapter
): Promise<string> {
  // Load prompt template
  const promptConfig = loadPromptConfig('code-executor')

  // Load CLAUDE.md for project context
  let projectContext = ''
  const claudeMdPath = path.join(projectPath, 'META', 'CLAUDE.md')
  if (await fs.exists(claudeMdPath)) {
    projectContext = await fs.readFile(claudeMdPath)
  }

  // Render prompt with variables
  return renderPrompt(promptConfig.template, {
    task_id: task.id,
    task_title: task.title,
    task_description: task.description || '',
    task_verification: task.verification || '',
    milestone_id: milestone.id,
    milestone_name: milestone.name,
    project_context: projectContext,
    relevant_files: '', // TODO: Add relevant files based on task context
  })
}

/**
 * Check if execution should pause (check DB for isPaused flag)
 */
async function shouldPause(
  executionId: string,
  executionRepo: IExecutionRepository
): Promise<boolean> {
  const execution = await executionRepo.findById(executionId)
  return execution?.isPaused ?? false
}

/**
 * Run the execution loop for a given execution
 *
 * This is the main orchestration logic that:
 * 1. Loads the execution plan
 * 2. Finds the next task
 * 3. Executes it with Claude
 * 4. Handles success/failure
 * 5. Repeats until complete/paused/aborted
 */
export async function runExecutionLoop(
  execution: Execution,
  deps: ExecutionOrchestratorDeps,
  config: OrchestratorConfig = DEFAULT_CONFIG
): Promise<void> {
  const {
    projectRepo,
    versionRepo,
    executionRepo,
    taskAttemptRepo,
    fs,
    claude,
    events,
  } = deps

  // Get project and version info
  const version = await versionRepo.findById(execution.versionId)
  if (!version) {
    events.emitError({ executionId: execution.id, error: 'Version not found' })
    return
  }

  const project = await projectRepo.findById(version.projectId)
  if (!project) {
    events.emitError({ executionId: execution.id, error: 'Project not found' })
    return
  }

  const todoPath = path.join(project.path, 'META', 'TODO.md')

  // Main execution loop
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Check if paused
    if (await shouldPause(execution.id, executionRepo)) {
      events.emitPaused({ executionId: execution.id })

      // Wait for resume (poll every second)
      while (await shouldPause(execution.id, executionRepo)) {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Check if aborted while paused
        const currentExecution = await executionRepo.findById(execution.id)
        if (!currentExecution || currentExecution.status === 'aborted') {
          return
        }
      }

      events.emitResumed({ executionId: execution.id })
    }

    // Check if aborted
    const currentExecution = await executionRepo.findById(execution.id)
    if (!currentExecution || currentExecution.status === 'aborted') {
      return
    }

    // Load fresh plan
    let plan: ExecutionPlan
    try {
      plan = await loadPlan(project.path, fs)
    } catch (error) {
      events.emitError({
        executionId: execution.id,
        error: `Failed to load execution plan: ${error instanceof Error ? error.message : String(error)}`,
      })
      await executionRepo.complete(execution.id, 'failed')
      return
    }

    // Get next task
    const nextResult: NextTaskResult = getNextTask(plan)

    if (nextResult.reason === 'all_completed') {
      // All tasks done
      await executionRepo.complete(execution.id, 'completed')
      await versionRepo.updateStatus(execution.versionId, { devStatus: 'completed' })
      events.emitCompleted({ executionId: execution.id })
      return
    }

    if (nextResult.reason === 'blocked') {
      // All pending tasks are blocked
      events.emitBlocked({
        executionId: execution.id,
        blockedTaskIds: nextResult.blockedBy || [],
      })

      // Pause and wait for user to skip blocked tasks
      await executionRepo.setPaused(execution.id, true)
      continue // Will check isPaused at top of loop
    }

    if (nextResult.reason === 'no_pending' || !nextResult.task || !nextResult.milestone) {
      // No more tasks
      await executionRepo.complete(execution.id, 'completed')
      await versionRepo.updateStatus(execution.versionId, { devStatus: 'completed' })
      events.emitCompleted({ executionId: execution.id })
      return
    }

    // Execute the task
    const task = nextResult.task
    const milestone = nextResult.milestone

    // Update current task in execution
    await executionRepo.updateProgress(execution.id, {
      completedTasks: currentExecution?.completedTasks || 0,
      currentTaskId: task.id,
    })

    // Emit task start
    events.emitTaskStart({
      executionId: execution.id,
      taskId: task.id,
      description: task.title,
    })

    // Create task attempt record
    const attempt = await taskAttemptRepo.create({
      executionId: execution.id,
      taskId: task.id,
      attemptNumber: 1, // TODO: Track retries
      startedAt: nowISO(),
      completedAt: null,
      status: 'running',
      errorMessage: null,
    })

    // Build prompt
    let prompt: string
    try {
      prompt = await buildTaskPrompt(task, milestone, project.path, fs)
    } catch (error) {
      const errorMsg = `Failed to build prompt: ${error instanceof Error ? error.message : String(error)}`
      await taskAttemptRepo.complete(attempt.id, 'failed', errorMsg)
      await executionRepo.setPaused(execution.id, true)
      events.emitTaskFailed({
        executionId: execution.id,
        taskId: task.id,
        error: errorMsg,
      })
      continue
    }

    // Execute with Claude
    let result: { success: boolean; output: string; error?: string }
    try {
      result = await claude.execute({
        prompt,
        workingDirectory: project.path,
        timeout: config.taskTimeout,
        sessionId: execution.id,
        allowedTools: ['Read', 'Write', 'Glob', 'Grep'],
      })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      await taskAttemptRepo.complete(attempt.id, 'failed', errorMsg)
      await executionRepo.setPaused(execution.id, true)
      events.emitTaskFailed({
        executionId: execution.id,
        taskId: task.id,
        error: errorMsg,
      })
      continue
    }

    if (!result.success) {
      await taskAttemptRepo.complete(attempt.id, 'failed', result.error || 'Claude execution failed')
      await executionRepo.setPaused(execution.id, true)
      events.emitTaskFailed({
        executionId: execution.id,
        taskId: task.id,
        error: result.error || 'Claude execution failed',
      })
      continue
    }

    // Parse structured output
    const taskOutput = extractTaskOutputJson(result.output)
    if (!taskOutput) {
      const errorMsg = 'Failed to parse structured output from Claude'
      await taskAttemptRepo.complete(attempt.id, 'failed', errorMsg)
      await executionRepo.setPaused(execution.id, true)
      events.emitTaskFailed({
        executionId: execution.id,
        taskId: task.id,
        error: errorMsg,
      })
      continue
    }

    // Validate output
    const validation = validateTaskOutput(taskOutput)
    if (!validation.valid) {
      const errorMsg = `Invalid task output: ${validation.errors.join(', ')}`
      await taskAttemptRepo.complete(attempt.id, 'failed', errorMsg)
      await executionRepo.setPaused(execution.id, true)
      events.emitTaskFailed({
        executionId: execution.id,
        taskId: task.id,
        error: errorMsg,
      })
      continue
    }

    // Write files
    const writeResult = await writeTaskOutput(taskOutput, project.path, fs)
    if (!writeResult.success) {
      const errorMsg = `Failed to write files: ${writeResult.errors.map((e: { path: string; error: string }) => `${e.path}: ${e.error}`).join(', ')}`
      await taskAttemptRepo.complete(attempt.id, 'failed', errorMsg)
      await executionRepo.setPaused(execution.id, true)
      events.emitTaskFailed({
        executionId: execution.id,
        taskId: task.id,
        error: errorMsg,
      })
      continue
    }

    // Mark task as complete in TODO.md
    await atomicUpdateTodoStatus(fs, todoPath, task.id, 'completed')

    // Mark attempt as completed
    await taskAttemptRepo.complete(attempt.id, 'completed')

    // Update execution progress
    const refreshedExecution = await executionRepo.findById(execution.id)
    const newCompletedCount = (refreshedExecution?.completedTasks || 0) + 1
    await executionRepo.updateProgress(execution.id, {
      completedTasks: newCompletedCount,
      currentTaskId: null,
    })

    // Emit task done
    events.emitTaskDone({
      executionId: execution.id,
      taskId: task.id,
    })

    // Emit progress
    const freshPlan = await loadPlan(project.path, fs)
    const progress = getProgress(freshPlan)
    events.emitProgress({
      executionId: execution.id,
      completed: progress.completed,
      total: progress.total,
      percent: progress.percent,
    })
  }
}
