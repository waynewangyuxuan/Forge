/**
 * Server Store - Manages all data fetched via IPC
 * Handles projects, versions, credentials, settings
 */

import { create } from 'zustand'
import type { Project, Version, CreateProjectInput, CreateVersionInput } from '@shared/types/project.types'
import type { Credential, AddCredentialInput, Settings } from '@shared/types/runtime.types'
import type { IPCError, IPCResult, ProjectDeleteOutput } from '@shared/types/ipc.types'
import { invokeTyped } from '../lib/ipc'
import { isSerializedError, serializeError } from '@shared/errors'

/**
 * Loading states for different data types
 */
interface LoadingState {
  projects: boolean
  versions: boolean
  credentials: boolean
  settings: boolean
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

  // Loading states
  loading: LoadingState

  // ========== Project Actions ==========

  fetchProjects: () => Promise<void>
  createProject: (input: CreateProjectInput) => Promise<Project>
  archiveProject: (id: string) => Promise<void>
  deleteProject: (id: string, options?: { deleteFromGitHub?: boolean; deleteLocalFiles?: boolean }) => Promise<IPCResult<ProjectDeleteOutput>>
  activateProject: (id: string) => Promise<Project>

  // ========== Version Actions ==========

  fetchVersions: (projectId: string) => Promise<void>
  createVersion: (input: CreateVersionInput) => Promise<Version>
  setCurrentVersion: (projectId: string, versionId: string) => void

  // ========== Credentials Actions ==========

  fetchCredentials: () => Promise<void>
  addCredential: (input: AddCredentialInput) => Promise<Credential>
  updateCredential: (id: string, value: string) => Promise<void>
  deleteCredential: (id: string) => Promise<void>

  // ========== Settings Actions ==========

  fetchSettings: () => Promise<void>
  updateSettings: (updates: Partial<Settings>) => Promise<Settings>
}

export const useServerStore = create<ServerStore>((set) => ({
  // Initial state
  projects: [],
  versions: {},
  currentVersionId: {},
  credentials: [],
  settings: null,
  loading: {
    projects: false,
    versions: false,
    credentials: false,
    settings: false,
  },

  // ========== Project Actions ==========

  fetchProjects: async () => {
    set((s) => ({ loading: { ...s.loading, projects: true } }))
    try {
      const projects = (await window.api.invoke('project:list', {})) as Project[]
      set({ projects })
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      throw error
    } finally {
      set((s) => ({ loading: { ...s.loading, projects: false } }))
    }
  },

  createProject: async (input: CreateProjectInput) => {
    try {
      const project = (await window.api.invoke('project:create', input)) as Project
      set((s) => ({ projects: [...s.projects, project] }))
      return project
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  },

  archiveProject: async (id: string) => {
    try {
      await window.api.invoke('project:archive', { id })
      set((s) => ({
        projects: s.projects.map((p) =>
          p.id === id ? { ...p, archivedAt: new Date().toISOString() } : p
        ),
      }))
    } catch (error) {
      console.error('Failed to archive project:', error)
      throw error
    }
  },

  deleteProject: async (id: string, options?: { deleteFromGitHub?: boolean; deleteLocalFiles?: boolean }) => {
    let result: IPCResult<ProjectDeleteOutput>

    try {
      result = await invokeTyped('project:delete', {
        id,
        deleteFromGitHub: options?.deleteFromGitHub,
        deleteLocalFiles: options?.deleteLocalFiles,
      })
    } catch (error) {
      const ipcError: IPCError = isSerializedError(error)
        ? (error as IPCError)
        : (serializeError(error) as IPCError)
      return { ok: false, error: ipcError }
    }

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
    try {
      const project = (await window.api.invoke('project:activate', { id })) as Project
      // Update the project in the list with new hasLocalFiles status
      set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? project : p)),
      }))
      return project
    } catch (error) {
      console.error('Failed to activate project:', error)
      throw error
    }
  },

  // ========== Version Actions ==========

  fetchVersions: async (projectId: string) => {
    set((s) => ({ loading: { ...s.loading, versions: true } }))
    try {
      const versions = (await window.api.invoke('version:list', { projectId })) as Version[]
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
    try {
      const version = (await window.api.invoke('version:create', input)) as Version
      set((s) => ({
        versions: {
          ...s.versions,
          [input.projectId]: [...(s.versions[input.projectId] || []), version],
        },
      }))
      return version
    } catch (error) {
      console.error('Failed to create version:', error)
      throw error
    }
  },

  setCurrentVersion: (projectId: string, versionId: string) => {
    set((s) => ({
      currentVersionId: { ...s.currentVersionId, [projectId]: versionId },
    }))
    // Also update on server
    window.api.invoke('version:setActive', { id: versionId }).catch((error) => {
      console.error('Failed to set active version:', error)
    })
  },

  // ========== Credentials Actions ==========

  fetchCredentials: async () => {
    set((s) => ({ loading: { ...s.loading, credentials: true } }))
    try {
      const credentials = (await window.api.invoke('credentials:list')) as Credential[]
      set({ credentials })
    } catch (error) {
      console.error('Failed to fetch credentials:', error)
      throw error
    } finally {
      set((s) => ({ loading: { ...s.loading, credentials: false } }))
    }
  },

  addCredential: async (input: AddCredentialInput) => {
    try {
      const credential = (await window.api.invoke('credentials:add', input)) as Credential
      set((s) => ({ credentials: [...s.credentials, credential] }))
      return credential
    } catch (error) {
      console.error('Failed to add credential:', error)
      throw error
    }
  },

  updateCredential: async (id: string, value: string) => {
    try {
      await window.api.invoke('credentials:update', { id, value })
    } catch (error) {
      console.error('Failed to update credential:', error)
      throw error
    }
  },

  deleteCredential: async (id: string) => {
    try {
      await window.api.invoke('credentials:delete', { id })
      set((s) => ({
        credentials: s.credentials.filter((c) => c.id !== id),
      }))
    } catch (error) {
      console.error('Failed to delete credential:', error)
      throw error
    }
  },

  // ========== Settings Actions ==========

  fetchSettings: async () => {
    set((s) => ({ loading: { ...s.loading, settings: true } }))
    try {
      const settings = (await window.api.invoke('system:getSettings')) as Settings
      set({ settings })
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      throw error
    } finally {
      set((s) => ({ loading: { ...s.loading, settings: false } }))
    }
  },

  updateSettings: async (updates: Partial<Settings>) => {
    try {
      const settings = (await window.api.invoke('system:updateSettings', updates)) as Settings
      set({ settings })
      return settings
    } catch (error) {
      console.error('Failed to update settings:', error)
      throw error
    }
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
