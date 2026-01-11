/**
 * Project and Version entity types
 * These represent the core domain entities stored in SQLite
 */

import { DevStatus, RuntimeStatus } from '../constants'

/**
 * A Forge project, corresponding to a local directory
 * Every project is bound to a GitHub repository
 */
export interface Project {
  id: string
  name: string
  path: string // Absolute path to project directory
  githubRepo: string | null // GitHub repository name (e.g., "kindle-anki")
  githubOwner: string | null // GitHub owner/username (e.g., "waynewang")
  createdAt: string // ISO 8601
  archivedAt: string | null // ISO 8601, null if not archived
  hasLocalFiles?: boolean // Whether local files exist at path (computed at runtime)
}

/**
 * A version of a project, corresponding to a Git branch
 */
export interface Version {
  id: string
  projectId: string
  versionName: string // e.g., "v1.0", "v2.0"
  branchName: string // Git branch name
  devStatus: DevStatus
  runtimeStatus: RuntimeStatus
  createdAt: string // ISO 8601
}

/**
 * Input for creating a new project
 * GitHub-first: name is used as repo name, path is derived from cloneRoot
 */
export interface CreateProjectInput {
  name: string // Also used as GitHub repo name
  description?: string // Optional repo description
  private?: boolean // Private repo (default: false)
}

/**
 * Input for creating a new version
 */
export interface CreateVersionInput {
  projectId: string
  versionName: string
  branchName: string
}
