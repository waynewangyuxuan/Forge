/**
 * Execution IPC Handlers
 * Handles all execution-related IPC channels
 */

import { ipcMain, BrowserWindow } from 'electron'
import { serializeError } from '@shared/errors'
import { IPCResult } from '@shared/types/ipc.types'
import { Execution } from '@shared/types/execution.types'
import {
  startExecution,
  pauseExecution,
  resumeExecution,
  abortExecution,
  retryTask,
  skipTask,
  getExecutionStatus,
  getStaleExecutions,
} from '../../application/use-cases/execution'
import { runExecutionLoop, ExecutionEventEmitters } from '../../application/services/execution-orchestrator'
import {
  SQLiteProjectRepository,
  SQLiteVersionRepository,
  SQLiteExecutionRepository,
  SQLiteTaskAttemptRepository,
  SQLiteSettingsRepository,
} from '../repositories'
import { getFileSystemAdapter } from '../adapters/file-system.adapter'
import { getGitAdapter } from '../adapters/git.adapter'
import { getClaudeAdapter } from '../adapters/claude.adapter'
import { loadExecutionConfig } from '../config-loader'

/**
 * Track running execution loops
 * Used to detect if a stale execution needs its loop restarted
 */
const runningExecutions = new Set<string>()

/**
 * Send event to all renderer windows
 */
function sendToAllWindows(channel: string, data: unknown): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send(channel, data)
  })
}

/**
 * Create event emitters that send to renderer
 */
function createEventEmitters(): ExecutionEventEmitters {
  return {
    emitProgress: (data) => sendToAllWindows('execution:progress', data),
    emitTaskStart: (data) => sendToAllWindows('execution:task:start', data),
    emitTaskDone: (data) => sendToAllWindows('execution:task:done', data),
    emitTaskFailed: (data) => sendToAllWindows('execution:task:failed', data),
    emitPaused: (data) => sendToAllWindows('execution:paused', data),
    emitResumed: (data) => sendToAllWindows('execution:resumed', data),
    emitBlocked: (data) => sendToAllWindows('execution:blocked', data),
    emitCompleted: (data) => sendToAllWindows('execution:completed', data),
    emitError: (data) => sendToAllWindows('execution:error', data),
  }
}

/**
 * Register all execution IPC handlers
 */
export function registerExecutionHandlers(): void {
  const projectRepo = new SQLiteProjectRepository()
  const versionRepo = new SQLiteVersionRepository()
  const executionRepo = new SQLiteExecutionRepository()
  const taskAttemptRepo = new SQLiteTaskAttemptRepository()
  const settingsRepo = new SQLiteSettingsRepository()
  const fs = getFileSystemAdapter()
  const git = getGitAdapter()
  const claude = getClaudeAdapter()

  // execution:start
  ipcMain.handle(
    'execution:start',
    async (_event, input): Promise<IPCResult<Execution>> => {
      try {
        // Get current settings
        const settings = await settingsRepo.getAll()

        const execution = await startExecution(input, {
          projectRepo,
          versionRepo,
          executionRepo,
          fs,
          git,
          claude,
          settings,
        })

        // Start the execution loop asynchronously
        const events = createEventEmitters()
        const executionConfig = loadExecutionConfig()
        runningExecutions.add(execution.id)
        runExecutionLoop(execution, {
          projectRepo,
          versionRepo,
          executionRepo,
          taskAttemptRepo,
          fs,
          claude,
          events,
        }, {
          taskTimeout: executionConfig.taskTimeout,
          maxRetries: executionConfig.maxRetries,
        })
          .catch((error) => {
            // Handle any unhandled errors in the loop
            events.emitError({
              executionId: execution.id,
              error: error instanceof Error ? error.message : String(error),
            })
          })
          .finally(() => {
            runningExecutions.delete(execution.id)
          })

        return { ok: true, data: execution }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )

  // execution:pause
  ipcMain.handle(
    'execution:pause',
    async (_event, input): Promise<IPCResult<void>> => {
      try {
        await pauseExecution(input, { executionRepo, versionRepo })
        return { ok: true, data: undefined }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )

  // execution:resume
  ipcMain.handle(
    'execution:resume',
    async (_event, input): Promise<IPCResult<void>> => {
      try {
        await resumeExecution(input, { executionRepo, versionRepo })

        // If the execution loop is not running (e.g., after app restart), restart it
        if (!runningExecutions.has(input.executionId)) {
          const execution = await executionRepo.findById(input.executionId)
          if (execution && execution.status === 'running') {
            const events = createEventEmitters()
            const executionConfig = loadExecutionConfig()
            runningExecutions.add(execution.id)
            runExecutionLoop(execution, {
              projectRepo,
              versionRepo,
              executionRepo,
              taskAttemptRepo,
              fs,
              claude,
              events,
            }, {
              taskTimeout: executionConfig.taskTimeout,
              maxRetries: executionConfig.maxRetries,
            })
              .catch((error) => {
                events.emitError({
                  executionId: execution.id,
                  error: error instanceof Error ? error.message : String(error),
                })
              })
              .finally(() => {
                runningExecutions.delete(execution.id)
              })
          }
        }

        return { ok: true, data: undefined }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )

  // execution:abort
  ipcMain.handle(
    'execution:abort',
    async (_event, input): Promise<IPCResult<void>> => {
      try {
        const result = await abortExecution(input, {
          projectRepo,
          versionRepo,
          executionRepo,
          git,
          claude,
        })

        // If git reset failed, send error event but still return success
        if (result.resetFailed) {
          sendToAllWindows('execution:error', {
            executionId: input.executionId,
            error: `Git reset failed: ${result.resetError}. Files may be in partial state.`,
          })
        }

        return { ok: true, data: undefined }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )

  // execution:retry
  ipcMain.handle(
    'execution:retry',
    async (_event, input): Promise<IPCResult<void>> => {
      try {
        await retryTask(input, { executionRepo, versionRepo })
        return { ok: true, data: undefined }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )

  // execution:skip
  ipcMain.handle(
    'execution:skip',
    async (_event, input): Promise<IPCResult<void>> => {
      try {
        await skipTask(input, {
          projectRepo,
          versionRepo,
          executionRepo,
          fs,
        })

        // Emit progress event after skip
        const execution = await executionRepo.findById(input.executionId)
        if (execution) {
          // Emit task done (skipped)
          sendToAllWindows('execution:task:done', {
            executionId: input.executionId,
            taskId: input.taskId,
          })

          // Emit progress update
          const percent = execution.totalTasks > 0
            ? Math.round((execution.completedTasks / execution.totalTasks) * 100)
            : 0
          sendToAllWindows('execution:progress', {
            executionId: input.executionId,
            completed: execution.completedTasks,
            total: execution.totalTasks,
            percent,
          })
        }

        return { ok: true, data: undefined }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )

  // execution:getStatus
  ipcMain.handle(
    'execution:getStatus',
    async (_event, input): Promise<IPCResult<Execution>> => {
      try {
        const execution = await getExecutionStatus(input, { executionRepo })
        return { ok: true, data: execution }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )

  // execution:getStale
  ipcMain.handle(
    'execution:getStale',
    async (): Promise<IPCResult<Execution[]>> => {
      try {
        const executions = await getStaleExecutions({ executionRepo })
        return { ok: true, data: executions }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )
}
