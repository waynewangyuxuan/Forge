/**
 * GitHub Adapter
 * Implements IGitHubAdapter using GitHub CLI (gh)
 */

import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import {
  IGitHubAdapter,
  GitHubAuthStatus,
  GitHubUser,
  GitHubRepo,
  CreateRepoOptions,
} from '@shared/interfaces/adapters'
import {
  GitHubCLINotFoundError,
  GitHubNotAuthenticatedError,
  GitHubOperationError,
  GitHubRepoExistsError,
} from '@shared/errors'

const execAsync = promisify(exec)

/**
 * GitHub adapter using gh CLI
 */
export class GitHubAdapter implements IGitHubAdapter {
  /**
   * Check if gh CLI is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('gh --version')
      return true
    } catch {
      return false
    }
  }

  /**
   * Check authentication status
   */
  async checkAuth(): Promise<GitHubAuthStatus> {
    try {
      // gh auth status exits with 0 if authenticated, non-zero otherwise
      await execAsync('gh auth status --hostname github.com 2>&1')

      // If we get here without error, user is authenticated
      // Try to get user info
      const user = await this.getAuthenticatedUser()

      return {
        authenticated: true,
        user: user ?? undefined,
      }
    } catch (error) {
      const errorMessage = (error as { stderr?: string; stdout?: string }).stderr ||
                          (error as { stderr?: string; stdout?: string }).stdout || ''

      // Check if it's a "not logged in" error vs a "gh not found" error
      if (errorMessage.includes('not logged in') || errorMessage.includes('not authenticated')) {
        return { authenticated: false }
      }

      // If gh command itself failed, it might not be installed
      if (errorMessage.includes('command not found') || errorMessage.includes('not recognized')) {
        return { authenticated: false }
      }

      // Default to not authenticated for other errors
      return { authenticated: false }
    }
  }

  /**
   * Get authenticated user info
   */
  async getAuthenticatedUser(): Promise<GitHubUser | null> {
    try {
      const { stdout } = await execAsync('gh api user --jq ".login, .name, .avatar_url"')
      const lines = stdout.trim().split('\n')

      if (lines.length >= 3) {
        return {
          login: lines[0],
          name: lines[1] || lines[0], // Use login as fallback if name is empty
          avatarUrl: lines[2],
        }
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Create a new GitHub repository
   */
  async createRepo(name: string, options?: CreateRepoOptions): Promise<GitHubRepo> {
    // Ensure gh CLI is available
    if (!(await this.isAvailable())) {
      throw new GitHubCLINotFoundError()
    }

    // Ensure user is authenticated
    const authStatus = await this.checkAuth()
    if (!authStatus.authenticated) {
      throw new GitHubNotAuthenticatedError()
    }

    // Build the gh repo create command
    const visibility = options?.private ? '--private' : '--public'
    const description = options?.description ? `--description "${options.description}"` : ''

    // Note: gh repo create without --clone creates repo on GitHub only
    const command = `gh repo create ${name} ${visibility} ${description} --confirm`.trim()

    try {
      const { stdout } = await execAsync(command)

      // Parse the created repo URL from output
      const urlMatch = stdout.match(/https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)/)
      if (!urlMatch) {
        // Try to get repo info directly
        return await this.getRepoInfo(authStatus.user!.login, name)
      }

      const owner = urlMatch[1]
      const repoName = urlMatch[2]

      return await this.getRepoInfo(owner, repoName)
    } catch (error) {
      const errorMessage = (error as { stderr?: string }).stderr || ''

      if (errorMessage.includes('already exists') || errorMessage.includes('Name already exists')) {
        throw new GitHubRepoExistsError(name)
      }

      throw new GitHubOperationError('createRepo', errorMessage || 'Unknown error')
    }
  }

  /**
   * Clone a repository to the specified path
   */
  async cloneRepo(owner: string, repo: string, destPath: string): Promise<void> {
    // Ensure gh CLI is available
    if (!(await this.isAvailable())) {
      throw new GitHubCLINotFoundError()
    }

    // Ensure user is authenticated
    const authStatus = await this.checkAuth()
    if (!authStatus.authenticated) {
      throw new GitHubNotAuthenticatedError()
    }

    try {
      // gh repo clone handles auth automatically
      await execAsync(`gh repo clone ${owner}/${repo} "${destPath}"`)
    } catch (error) {
      const errorMessage = (error as { stderr?: string }).stderr || ''
      throw new GitHubOperationError('cloneRepo', errorMessage || 'Failed to clone repository')
    }
  }

  /**
   * Get repository info by owner and name
   */
  private async getRepoInfo(owner: string, repo: string): Promise<GitHubRepo> {
    try {
      const { stdout } = await execAsync(
        `gh api repos/${owner}/${repo} --jq ".id, .name, .full_name, .html_url, .clone_url, .ssh_url"`
      )
      const lines = stdout.trim().split('\n')

      if (lines.length >= 6) {
        return {
          id: String(lines[0]),
          name: lines[1],
          fullName: lines[2],
          htmlUrl: lines[3],
          cloneUrl: lines[4],
          sshUrl: lines[5],
        }
      }

      throw new Error('Invalid response from GitHub API')
    } catch (error) {
      throw new GitHubOperationError(
        'getRepoInfo',
        (error as Error).message || 'Failed to get repository info'
      )
    }
  }
}

/**
 * Singleton instance
 */
let instance: GitHubAdapter | null = null

export function getGitHubAdapter(): GitHubAdapter {
  if (!instance) {
    instance = new GitHubAdapter()
  }
  return instance
}
