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
} from '@shared/types/ipc.types'

/**
 * Register all GitHub IPC handlers
 */
export function registerGitHubHandlers(): void {
  const github = getGitHubAdapter()

  // github:checkAuth - Check if gh CLI is available and authenticated
  ipcMain.handle('github:checkAuth', async (): Promise<GitHubCheckAuthOutput> => {
    try {
      const available = await github.isAvailable()

      if (!available) {
        return {
          available: false,
          auth: { authenticated: false },
        }
      }

      const auth = await github.checkAuth()

      return {
        available: true,
        auth,
      }
    } catch (error) {
      throw serializeError(error)
    }
  })

  // github:createRepo - Create a new GitHub repository
  ipcMain.handle('github:createRepo', async (_event, input: GitHubCreateRepoInput) => {
    try {
      const repo = await github.createRepo(input.name, input.options)
      return repo
    } catch (error) {
      throw serializeError(error)
    }
  })

  // github:cloneRepo - Clone a repository to local path
  ipcMain.handle('github:cloneRepo', async (_event, input: GitHubCloneRepoInput) => {
    try {
      await github.cloneRepo(input.owner, input.repo, input.destPath)
    } catch (error) {
      throw serializeError(error)
    }
  })
}
