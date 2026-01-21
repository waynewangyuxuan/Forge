/**
 * Git Adapter
 * Implements IGitAdapter using simple-git library
 */

import simpleGit, { SimpleGit, StatusResult } from 'simple-git'
import type { IGitAdapter, GitStatus } from '@shared/interfaces/adapters'
import { GitNotRepoError, GitNoRemoteError, GitOperationError } from '@shared/errors'

export class GitAdapter implements IGitAdapter {
  /**
   * Create a simple-git instance for a path
   */
  private getGit(path: string): SimpleGit {
    return simpleGit(path)
  }

  /**
   * Initialize a new git repository
   */
  async init(path: string): Promise<void> {
    try {
      const git = this.getGit(path)
      await git.init()
    } catch (error) {
      throw new GitOperationError('init', (error as Error).message)
    }
  }

  /**
   * Check if a path is a git repository
   */
  async isRepo(path: string): Promise<boolean> {
    try {
      const git = this.getGit(path)
      return await git.checkIsRepo()
    } catch {
      return false
    }
  }

  /**
   * Get repository status
   */
  async status(path: string): Promise<GitStatus> {
    await this.ensureRepo(path)

    try {
      const git = this.getGit(path)
      const result: StatusResult = await git.status()

      return {
        staged: [...result.staged, ...result.renamed.map((r) => r.to)],
        unstaged: result.modified.filter((f) => !result.staged.includes(f)),
        untracked: result.not_added,
        deleted: result.deleted,
        branch: result.current || 'main',
        ahead: result.ahead,
        behind: result.behind,
      }
    } catch (error) {
      throw new GitOperationError('status', (error as Error).message)
    }
  }

  /**
   * Stage files for commit
   */
  async add(path: string, files: string[]): Promise<void> {
    await this.ensureRepo(path)

    try {
      const git = this.getGit(path)
      await git.add(files)
    } catch (error) {
      throw new GitOperationError('add', (error as Error).message)
    }
  }

  /**
   * Create a commit and return the commit hash
   */
  async commit(path: string, message: string): Promise<string> {
    await this.ensureRepo(path)

    try {
      const git = this.getGit(path)
      const result = await git.commit(message)
      return result.commit || ''
    } catch (error) {
      throw new GitOperationError('commit', (error as Error).message)
    }
  }

  /**
   * Push to remote
   */
  async push(path: string, remote?: string): Promise<void> {
    await this.ensureRepo(path)

    if (!(await this.hasRemote(path))) {
      throw new GitNoRemoteError(path)
    }

    try {
      const git = this.getGit(path)
      await git.push(remote || 'origin')
    } catch (error) {
      throw new GitOperationError('push', (error as Error).message)
    }
  }

  /**
   * Create a new branch and checkout
   */
  async createBranch(path: string, branch: string): Promise<void> {
    await this.ensureRepo(path)

    try {
      const git = this.getGit(path)
      await git.checkoutLocalBranch(branch)
    } catch (error) {
      throw new GitOperationError('createBranch', (error as Error).message)
    }
  }

  /**
   * Checkout an existing branch
   */
  async checkout(path: string, branch: string): Promise<void> {
    await this.ensureRepo(path)

    try {
      const git = this.getGit(path)
      await git.checkout(branch)
    } catch (error) {
      throw new GitOperationError('checkout', (error as Error).message)
    }
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(path: string): Promise<string> {
    await this.ensureRepo(path)

    try {
      const git = this.getGit(path)
      const result = await git.branchLocal()
      return result.current || 'main'
    } catch (error) {
      throw new GitOperationError('getCurrentBranch', (error as Error).message)
    }
  }

  /**
   * Check if repository has a remote configured
   */
  async hasRemote(path: string): Promise<boolean> {
    await this.ensureRepo(path)

    try {
      const git = this.getGit(path)
      const remotes = await git.getRemotes()
      return remotes.length > 0
    } catch {
      return false
    }
  }

  /**
   * Get the URL of the origin remote
   */
  async getRemoteUrl(path: string): Promise<string | null> {
    await this.ensureRepo(path)

    try {
      const git = this.getGit(path)
      const remotes = await git.getRemotes(true)
      const origin = remotes.find((r) => r.name === 'origin')
      return origin?.refs.fetch || null
    } catch {
      return null
    }
  }

  /**
   * Helper to ensure path is a git repository
   */
  private async ensureRepo(path: string): Promise<void> {
    if (!(await this.isRepo(path))) {
      throw new GitNotRepoError(path)
    }
  }
}

// Singleton instance
let instance: GitAdapter | null = null

/**
 * Get the singleton GitAdapter instance
 */
export function getGitAdapter(): GitAdapter {
  if (!instance) {
    instance = new GitAdapter()
  }
  return instance
}
