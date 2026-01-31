/**
 * Server Store - Manages all data fetched via IPC
 * Handles projects, versions, credentials, settings
 */

import { create } from 'zustand'
import type { Project, Version, CreateProjectInput, CreateVersionInput } from '@shared/types/project.types'
import type { Credential, AddCredentialInput, Settings } from '@shared/types/runtime.types'
import type { Execution } from '@shared/types/execution.types'
import type { IPCResult, ProjectDeleteOutput } from '@shared/types/ipc.types'
import { invokeTyped, unwrapResult } from '../lib/ipc'

/**
 * Loading states for different data types
 */
interface LoadingState {
  projects: boolean
  versions: boolean
  credentials: boolean
  settings: boolean
  staleExecutions: boolean
}

/**
 * Server store state and actions
 */
interface ServerStore {
  // ========== Data ==========

  // Projects
  projects: Project[]

  // Versions (projectId -> versions)
  versions: Record<string, Version[]>
  // Current active version per project (projectId -> versionId)
  currentVersionId: Record<string, string>

  // Credentials
  credentials: Credential[]

  // Settings
  settings: Settings | null

  // Stale executions (for startup recovery)
  staleExecutions: Execution[]

  // Loading states
  loading: LoadingState

  // ========== Project Actions ==========
  // Pattern A (fetch): uses unwrapResult internally, throws on error
  // Pattern B (mutations): returns IPCResult<T> for UI error handling

  fetchProjects: () => Promise<void>  // Pattern A
  createProject: (input: CreateProjectInput) => Promise<IPCResult<Project>>  // Pattern B
  archiveProject: (id: string) => Promise<IPCResult<void>>  // Pattern B
  deleteProject: (id: string, options?: { deleteFromGitHub?: boolean; deleteLocalFiles?: boolean }) => Promise<IPCResult<ProjectDeleteOutput>>  // Pattern B
  activateProject: (id: string) => Promise<IPCResult<Project>>  // Pattern B

  // ========== Version Actions ==========

  fetchVersions: (projectId: string) => Promise<void>  // Pattern A
  createVersion: (input: CreateVersionInput) => Promise<IPCResult<Version>>  // Pattern B
  setCurrentVersion: (projectId: string, versionId: string) => void

  // ========== Credentials Actions ==========

  fetchCredentials: () => Promise<void>  // Pattern A
  addCredential: (input: AddCredentialInput) => Promise<IPCResult<Credential>>  // Pattern B
  updateCredential: (id: string, value: string) => Promise<IPCResult<void>>  // Pattern B
  deleteCredential: (id: string) => Promise<IPCResult<void>>  // Pattern B

  // ========== Settings Actions ==========

  fetchSettings: () => Promise<void>  // Pattern A
  updateSettings: (updates: Partial<Settings>) => Promise<IPCResult<Settings>>  // Pattern B

  // ========== Stale Executions Actions ==========

  checkStaleExecutions: () => Promise<void>  // Pattern A
  clearStaleExecution: (executionId: string) => void
}

export const useServerStore = create<ServerStore>((set) => ({
  // Initial state
  projects: [],
  versions: {},
  currentVersionId: {},
  credentials: [],
  settings: null,
  staleExecutions: [],
  loading: {
    projects: false,
    versions: false,
    credentials: false,
    settings: false,
    staleExecutions: false,
  },

  // ========== Project Actions ==========

  fetchProjects: async () => {
    set((s) => ({ loading: { ...s.loading, projects: true } }))
    try {
      const result = await invokeTyped('project:list', {})
      const projects = unwrapResult(result)  // throws if !ok
      set({ projects })
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      throw error
    } finally {
      set((s) => ({ loading: { ...s.loading, projects: false } }))
    }
  },

  createProject: async (input: CreateProjectInput) => {
    const result = await invokeTyped('project:create', input)
    if (result.ok) {
      set((s) => ({ projects: [...s.projects, result.data] }))
    }
    return result
  },

  archiveProject: async (id: string) => {
    const result = await invokeTyped('project:archive', { id })
    if (result.ok) {
      set((s) => ({
        projects: s.projects.map((p) =>
          p.id === id ? { ...p, archivedAt: new Date().toISOString() } : p
        ),
      }))
    }
    return result
  },

  deleteProject: async (id: string, options?: { deleteFromGitHub?: boolean; deleteLocalFiles?: boolean }) => {
    // All IPC handlers now return IPCResult, no throwing
    const result = await invokeTyped('project:delete', {
      id,
      deleteFromGitHub: options?.deleteFromGitHub,
      deleteLocalFiles: options?.deleteLocalFiles,
    })

    // Don't update state if operation failed
    if (!result.ok) {
      return result
    }

    // Apply state changes based on outcome
    switch (result.data.outcome) {
      case 'deleted':
      case 'removed':
        // Remove from state
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
        }))
        break
      case 'deactivated':
        // Update with returned project (marked as inactive)
        if (result.data.project) {
          set((s) => ({
            projects: s.projects.map((p) =>
              p.id === id ? result.data.project! : p
            ),
          }))
        }
        break
    }

    return result
  },

  activateProject: async (id: string) => {
    const result = await invokeTyped('project:activate', { id })
    if (result.ok) {
      // Update the project in the list with new hasLocalFiles status
      set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? result.data : p)),
      }))
    }
    return result
  },

  // ========== Version Actions ==========

  fetchVersions: async (projectId: string) => {
    set((s) => ({ loading: { ...s.loading, versions: true } }))
    try {
      const result = await invokeTyped('version:list', { projectId })
      const versions = unwrapResult(result)  // throws if !ok
      set((s) => ({
        versions: { ...s.versions, [projectId]: versions },
      }))
    } catch (error) {
      console.error('Failed to fetch versions:', error)
      throw error
    } finally {
      set((s) => ({ loading: { ...s.loading, versions: false } }))
    }
  },

  createVersion: async (input: CreateVersionInput) => {
    const result = await invokeTyped('version:create', input)
    if (result.ok) {
      set((s) => ({
        versions: {
          ...s.versions,
          [input.projectId]: [...(s.versions[input.projectId] || []), result.data],
        },
      }))
    }
    return result
  },

  setCurrentVersion: (projectId: string, versionId: string) => {
    set((s) => ({
      currentVersionId: { ...s.currentVersionId, [projectId]: versionId },
    }))
    // Fire-and-forget: update on server, check result but don't block
    invokeTyped('version:setActive', { id: versionId }).then((result) => {
      if (!result.ok) {
        console.error('Failed to set active version:', result.error.message)
      }
    })
  },

  // ========== Credentials Actions ==========

  fetchCredentials: async () => {
    set((s) => ({ loading: { ...s.loading, credentials: true } }))
    try {
      const result = await invokeTyped('credentials:list', undefined)
      const credentials = unwrapResult(result)  // throws if !ok
      set({ credentials })
    } catch (error) {
      console.error('Failed to fetch credentials:', error)
      throw error
    } finally {
      set((s) => ({ loading: { ...s.loading, credentials: false } }))
    }
  },

  addCredential: async (input: AddCredentialInput) => {
    const result = await invokeTyped('credentials:add', input)
    if (result.ok) {
      set((s) => ({ credentials: [...s.credentials, result.data] }))
    }
    return result
  },

  updateCredential: async (id: string, value: string) => {
    return await invokeTyped('credentials:update', { id, value })
  },

  deleteCredential: async (id: string) => {
    const result = await invokeTyped('credentials:delete', { id })
    if (result.ok) {
      set((s) => ({
        credentials: s.credentials.filter((c) => c.id !== id),
      }))
    }
    return result
  },

  // ========== Settings Actions ==========

  fetchSettings: async () => {
    set((s) => ({ loading: { ...s.loading, settings: true } }))
    try {
      const result = await invokeTyped('system:getSettings', undefined)
      const settings = unwrapResult(result)  // throws if !ok
      set({ settings })
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      throw error
    } finally {
      set((s) => ({ loading: { ...s.loading, settings: false } }))
    }
  },

  updateSettings: async (updates: Partial<Settings>) => {
    const result = await invokeTyped('system:updateSettings', updates)
    if (result.ok) {
      set({ settings: result.data })
    }
    return result
  },

  // ========== Stale Executions Actions ==========

  checkStaleExecutions: async () => {
    set((s) => ({ loading: { ...s.loading, staleExecutions: true } }))
    try {
      const result = await invokeTyped('execution:getStale', undefined)
      const staleExecutions = unwrapResult(result)  // throws if !ok
      set({ staleExecutions })
    } catch (error) {
      console.error('Failed to check stale executions:', error)
      // Don't throw - this is a non-critical check
      set({ staleExecutions: [] })
    } finally {
      set((s) => ({ loading: { ...s.loading, staleExecutions: false } }))
    }
  },

  clearStaleExecution: (executionId: string) => {
    set((s) => ({
      staleExecutions: s.staleExecutions.filter((e) => e.id !== executionId),
    }))
  },
}))

/**
 * Helper to get a project by ID
 */
export function useProject(projectId: string | undefined): Project | undefined {
  return useServerStore((s) => s.projects.find((p) => p.id === projectId))
}

/**
 * Helper to get versions for a project
 */
export function useVersions(projectId: string | undefined): Version[] {
  return useServerStore((s) => (projectId ? s.versions[projectId] || [] : []))
}

/**
 * Helper to get current version for a project
 */
export function useCurrentVersion(projectId: string | undefined): Version | undefined {
  return useServerStore((s) => {
    if (!projectId) return undefined
    const versionId = s.currentVersionId[projectId]
    if (!versionId) return undefined
    return s.versions[projectId]?.find((v) => v.id === versionId)
  })
}
