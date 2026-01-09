/**
 * Project and Version entity types
 * These represent the core domain entities stored in SQLite
 */

import { DevStatus, RuntimeStatus } from '../constants'

/**
 * A Forge project, corresponding to a local directory
 */
export interface Project {
  id: string
  name: string
  path: string // Absolute path to project directory
  createdAt: string // ISO 8601
  archivedAt: string | null // ISO 8601, null if not archived
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
 */
export interface CreateProjectInput {
  name: string
  path: string
}

/**
 * Input for creating a new version
 */
export interface CreateVersionInput {
  projectId: string
  versionName: string
  branchName: string
}
