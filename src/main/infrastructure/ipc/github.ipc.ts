/**
 * GitHub IPC Handlers
 * Handles github:* IPC channels
 */

import { ipcMain } from 'electron'
import { getGitHubAdapter } from '../adapters/github.adapter'
import { serializeError } from '@shared/errors'
import type {
  GitHubCheckAuthOutput,
  GitHubCreateRepoInput,
  GitHubCloneRepoInput,
  IPCResult,
} from '@shared/types/ipc.types'
import type { GitHubRepo } from '@shared/types/github.types'

/**
 * Register all GitHub IPC handlers
 */
export function registerGitHubHandlers(): void {
  const github = getGitHubAdapter()

  // github:checkAuth - Check if gh CLI is available and authenticated
  ipcMain.handle('github:checkAuth', async (): Promise<IPCResult<GitHubCheckAuthOutput>> => {
    try {
      const available = await github.isAvailable()

      if (!available) {
        return {
          ok: true,
          data: {
            available: false,
            auth: { authenticated: false },
          },
        }
      }

      const auth = await github.checkAuth()

      return {
        ok: true,
        data: {
          available: true,
          auth,
        },
      }
    } catch (error) {
      return { ok: false, error: serializeError(error) }
    }
  })

  // github:createRepo - Create a new GitHub repository
  ipcMain.handle('github:createRepo', async (_event, input: GitHubCreateRepoInput): Promise<IPCResult<GitHubRepo>> => {
    try {
      const data = await github.createRepo(input.name, input.options)
      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: serializeError(error) }
    }
  })

  // github:cloneRepo - Clone a repository to local path
  ipcMain.handle('github:cloneRepo', async (_event, input: GitHubCloneRepoInput): Promise<IPCResult<void>> => {
    try {
      await github.cloneRepo(input.owner, input.repo, input.destPath)
      return { ok: true, data: undefined }
    } catch (error) {
      return { ok: false, error: serializeError(error) }
    }
  })
}
