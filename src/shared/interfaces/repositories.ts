/**
 * Repository interfaces
 * Application layer depends on these interfaces, Infrastructure implements them
 */

import { Project, Version } from '../types/project.types'
import { Execution, TaskAttempt } from '../types/execution.types'
import { Run, RuntimeConfig } from '../types/runtime.types'

/**
 * Project repository interface
 */
export interface IProjectRepository {
  // Queries
  findById(id: string): Promise<Project | null>
  findByPath(path: string): Promise<Project | null>
  findAll(options?: { includeArchived?: boolean }): Promise<Project[]>

  // Commands
  create(input: Omit<Project, 'id' | 'createdAt' | 'archivedAt'>): Promise<Project>
  update(id: string, data: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<Project>
  archive(id: string): Promise<void>
  delete(id: string): Promise<void>
}

/**
 * Version repository interface
 */
export interface IVersionRepository {
  // Queries
  findById(id: string): Promise<Version | null>
  findByProject(projectId: string): Promise<Version[]>

  // Commands
  create(input: Omit<Version, 'id' | 'createdAt'>): Promise<Version>
  updateStatus(
    id: string,
    update: { devStatus?: string; runtimeStatus?: string }
  ): Promise<void>
  delete(id: string): Promise<void>
}

/**
 * Execution repository interface
 */
export interface IExecutionRepository {
  // Queries
  findById(id: string): Promise<Execution | null>
  findByVersion(versionId: string): Promise<Execution[]>
  findRunning(): Promise<Execution[]>

  // Commands
  create(input: Omit<Execution, 'id'>): Promise<Execution>
  updateProgress(
    id: string,
    update: { completedTasks: number; currentTaskId?: string | null }
  ): Promise<void>
  complete(id: string, status: 'completed' | 'failed' | 'aborted'): Promise<void>
}

/**
 * Task attempt repository interface
 */
export interface ITaskAttemptRepository {
  // Queries
  findById(id: string): Promise<TaskAttempt | null>
  findByExecution(executionId: string): Promise<TaskAttempt[]>
  findByTask(executionId: string, taskId: string): Promise<TaskAttempt[]>

  // Commands
  create(input: Omit<TaskAttempt, 'id'>): Promise<TaskAttempt>
  complete(
    id: string,
    status: 'completed' | 'failed' | 'skipped',
    errorMessage?: string
  ): Promise<void>
}

/**
 * Run repository interface
 */
export interface IRunRepository {
  // Queries
  findById(id: string): Promise<Run | null>
  findByVersion(versionId: string, limit?: number): Promise<Run[]>
  findRecent(limit: number): Promise<Run[]>

  // Commands
  create(input: Omit<Run, 'id'>): Promise<Run>
  complete(
    id: string,
    status: 'success' | 'failed',
    exitCode?: number
  ): Promise<void>
}

/**
 * Runtime config repository interface
 */
export interface IRuntimeConfigRepository {
  // Queries
  findByVersion(versionId: string): Promise<RuntimeConfig | null>
  findScheduled(): Promise<RuntimeConfig[]>
  findAlwaysRunning(): Promise<RuntimeConfig[]>

  // Commands
  upsert(config: RuntimeConfig): Promise<void>
  delete(versionId: string): Promise<void>
}

/**
 * Credential repository interface
 * Note: Actual credential values are stored in system keychain, not in DB
 */
export interface ICredentialRepository {
  // Queries
  findById(id: string): Promise<{ id: string; nickname: string; type: string; createdAt: string } | null>
  findByNickname(nickname: string): Promise<{ id: string; nickname: string; type: string; createdAt: string } | null>
  findAll(): Promise<Array<{ id: string; nickname: string; type: string; createdAt: string }>>

  // Commands
  create(input: { nickname: string; type: string }): Promise<{ id: string; nickname: string; type: string; createdAt: string }>
  delete(id: string): Promise<void>
}
