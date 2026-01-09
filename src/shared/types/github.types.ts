/**
 * GitHub integration types
 * Used for GitHub-first project creation
 */

/**
 * GitHub authentication status
 */
export interface GitHubAuthStatus {
  authenticated: boolean
  user?: GitHubUser
}

/**
 * GitHub user information
 */
export interface GitHubUser {
  login: string
  name: string
  avatarUrl: string
}

/**
 * GitHub repository information
 */
export interface GitHubRepo {
  id: string
  name: string
  fullName: string // e.g., "waynewang/kindle-anki"
  htmlUrl: string
  cloneUrl: string
  sshUrl: string
}

/**
 * GitHub Project (for organizing repos)
 */
export interface GitHubProject {
  id: string
  name: string
  number: number
}

/**
 * Options for creating a GitHub repository
 */
export interface CreateRepoOptions {
  description?: string
  private?: boolean
  autoInit?: boolean
}
