/**
 * Review IPC Handlers
 * Handles review:* IPC channels for TODO review and feedback
 */

import { ipcMain, BrowserWindow } from 'electron'
import { SQLiteProjectRepository } from '../repositories/sqlite-project.repo'
import { SQLiteVersionRepository } from '../repositories/sqlite-version.repo'
import { SQLiteFeedbackRepository } from '../repositories/sqlite-feedback.repo'
import { SQLiteSettingsRepository } from '../repositories/sqlite-settings.repo'
import { getFileSystemAdapter } from '../adapters/file-system.adapter'
import { getClaudeAdapter } from '../adapters/claude.adapter'
import { getGitAdapter } from '../adapters/git.adapter'
import { serializeError } from '@shared/errors'
import {
  getTodo,
  readTodoRaw,
  saveTodoRaw,
  addFeedback,
  getFeedback,
  clearFeedback,
  approveReview,
} from '../../application/use-cases/review'
import { generateScaffold } from '../../application/use-cases/scaffold'
import type {
  IPCResult,
  ReviewGetTodoInput,
  ReviewReadTodoRawInput,
  ReviewSaveTodoRawInput,
  ReviewAddFeedbackInput,
  ReviewGetFeedbackInput,
  ReviewClearFeedbackInput,
  ReviewRegenerateInput,
  ReviewApproveInput,
  ScaffoldProgressEvent,
  ScaffoldCompletedEvent,
  ScaffoldErrorEvent,
} from '@shared/types/ipc.types'
import type { ExecutionPlan, Feedback } from '@shared/types/execution.types'

// Initialize dependencies
const projectRepo = new SQLiteProjectRepository()
const versionRepo = new SQLiteVersionRepository()
const feedbackRepo = new SQLiteFeedbackRepository()
const settingsRepo = new SQLiteSettingsRepository()
const fs = getFileSystemAdapter()
const claude = getClaudeAdapter()
const git = getGitAdapter()

/**
 * Send an event to all browser windows
 */
function sendToAllWindows(channel: string, payload: unknown): void {
  const windows = BrowserWindow.getAllWindows()
  for (const window of windows) {
    window.webContents.send(channel, payload)
  }
}

/**
 * Register all review IPC handlers
 */
export function registerReviewHandlers(): void {
  // review:getTodo - Get parsed execution plan
  ipcMain.handle(
    'review:getTodo',
    async (_event, input: ReviewGetTodoInput): Promise<IPCResult<ExecutionPlan>> => {
      try {
        const data = await getTodo(input, { projectRepo, versionRepo, fs })
        return { ok: true, data }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )

  // review:readTodoRaw - Read raw TODO.md content
  ipcMain.handle(
    'review:readTodoRaw',
    async (_event, input: ReviewReadTodoRawInput): Promise<IPCResult<string>> => {
      try {
        const data = await readTodoRaw(input, { projectRepo, versionRepo, fs })
        return { ok: true, data }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )

  // review:saveTodoRaw - Save raw TODO.md content
  ipcMain.handle(
    'review:saveTodoRaw',
    async (_event, input: ReviewSaveTodoRawInput): Promise<IPCResult<void>> => {
      try {
        await saveTodoRaw(input, { projectRepo, versionRepo, fs })
        return { ok: true, data: undefined }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )

  // review:getFeedback - Get feedback for a version
  ipcMain.handle(
    'review:getFeedback',
    async (_event, input: ReviewGetFeedbackInput): Promise<IPCResult<Feedback | null>> => {
      try {
        const data = await getFeedback(input, { versionRepo, feedbackRepo })
        return { ok: true, data }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )

  // review:addFeedback - Add or update feedback
  ipcMain.handle(
    'review:addFeedback',
    async (_event, input: ReviewAddFeedbackInput): Promise<IPCResult<Feedback>> => {
      try {
        const data = await addFeedback(input, { versionRepo, feedbackRepo })
        return { ok: true, data }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )

  // review:clearFeedback - Clear feedback for a version
  ipcMain.handle(
    'review:clearFeedback',
    async (_event, input: ReviewClearFeedbackInput): Promise<IPCResult<void>> => {
      try {
        await clearFeedback(input, { versionRepo, feedbackRepo })
        return { ok: true, data: undefined }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )

  // review:regenerate - Regenerate scaffold based on feedback
  ipcMain.handle(
    'review:regenerate',
    async (_event, input: ReviewRegenerateInput): Promise<IPCResult<void>> => {
      try {
        // Load settings for git operations
        const settings = await settingsRepo.getAll()

        // Backward compat: if pushStrategy missing, derive from autoPush
        const pushStrategy = settings.pushStrategy ?? (settings.autoPush ? 'auto' : 'disabled')

        // Call generateScaffold - it detects regeneration by checking devStatus === 'reviewing'
        const result = await generateScaffold(
          { versionId: input.versionId },
          {
            projectRepo,
            versionRepo,
            feedbackRepo,
            fs,
            claude,
            git,
            settings: {
              commitOnScaffold: settings.commitOnScaffold ?? true,
              pushStrategy: pushStrategy as 'auto' | 'manual' | 'disabled',
            },
            emitProgress: (event: ScaffoldProgressEvent) => {
              sendToAllWindows('scaffold:progress', event)
            },
            emitCompleted: (event: ScaffoldCompletedEvent) => {
              sendToAllWindows('scaffold:completed', event)
            },
            emitError: (event: ScaffoldErrorEvent) => {
              sendToAllWindows('scaffold:error', event)
            },
          }
        )

        if (!result.success) {
          throw new Error(result.error || 'Regeneration failed')
        }

        return { ok: true, data: undefined }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )

  // review:approve - Approve review and transition to ready state
  ipcMain.handle(
    'review:approve',
    async (_event, input: ReviewApproveInput): Promise<IPCResult<void>> => {
      try {
        await approveReview(input, { versionRepo })
        return { ok: true, data: undefined }
      } catch (error) {
        return { ok: false, error: serializeError(error) }
      }
    }
  )
}
