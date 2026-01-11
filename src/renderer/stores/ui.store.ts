/**
 * UI Store - Manages pure UI state unrelated to business data
 * Handles modals, sidebar, confirmations, etc.
 */

import { create } from 'zustand'

/**
 * Modal names for type safety
 */
export type ModalName =
  | 'createProject'
  | 'createVersion'
  | 'confirmDelete'
  | 'deleteProject'
  | 'runtimeConfig'
  | 'addCredential'
  | 'settings'

/**
 * Confirm dialog state
 */
interface ConfirmState {
  open: boolean
  targetId?: string
  targetName?: string
  onConfirm?: () => void
}

/**
 * Delete project modal state
 */
interface DeleteProjectState {
  open: boolean
  projectId?: string
  projectName?: string
  hasGitHub?: boolean
}

/**
 * Modal states for each modal type
 */
interface ModalsState {
  createProject: boolean
  createVersion: boolean
  confirmDelete: ConfirmState
  deleteProject: DeleteProjectState
  runtimeConfig: boolean
  addCredential: boolean
  settings: boolean
}

/**
 * Toast notification
 */
export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number // ms, default 3000
}

/**
 * UI store state and actions
 */
interface UIStore {
  // ========== Modal State ==========

  modals: ModalsState

  // Open a modal
  openModal: (name: ModalName, data?: Record<string, unknown>) => void
  // Close a modal
  closeModal: (name: ModalName) => void

  // ========== Confirm Dialog ==========

  // Show confirmation dialog
  showConfirm: (options: {
    targetId: string
    targetName: string
    onConfirm: () => void
  }) => void
  // Hide confirmation dialog
  hideConfirm: () => void
  // Execute confirm callback and close
  confirmAction: () => void

  // ========== Sidebar ==========

  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // ========== Toasts ==========

  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void

  // ========== Theme ==========

  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

// Generate unique toast ID
let toastIdCounter = 0
function generateToastId(): string {
  return `toast-${++toastIdCounter}-${Date.now()}`
}

export const useUIStore = create<UIStore>((set, get) => ({
  // Initial state
  modals: {
    createProject: false,
    createVersion: false,
    confirmDelete: { open: false },
    deleteProject: { open: false },
    runtimeConfig: false,
    addCredential: false,
    settings: false,
  },
  sidebarCollapsed: false,
  toasts: [],
  theme: 'system',

  // ========== Modal Actions ==========

  openModal: (name: ModalName, data?: Record<string, unknown>) => {
    set((s) => {
      if (name === 'confirmDelete' && data) {
        return {
          modals: {
            ...s.modals,
            confirmDelete: {
              open: true,
              targetId: data.targetId as string,
              targetName: data.targetName as string,
              onConfirm: data.onConfirm as () => void,
            },
          },
        }
      }
      if (name === 'deleteProject' && data) {
        return {
          modals: {
            ...s.modals,
            deleteProject: {
              open: true,
              projectId: data.projectId as string,
              projectName: data.projectName as string,
              hasGitHub: data.hasGitHub as boolean,
            },
          },
        }
      }
      return {
        modals: {
          ...s.modals,
          [name]: name === 'confirmDelete' || name === 'deleteProject' ? { open: true, ...data } : true,
        },
      }
    })
  },

  closeModal: (name: ModalName) => {
    set((s) => ({
      modals: {
        ...s.modals,
        [name]: name === 'confirmDelete' || name === 'deleteProject' ? { open: false } : false,
      },
    }))
  },

  // ========== Confirm Dialog Actions ==========

  showConfirm: ({ targetId, targetName, onConfirm }) => {
    set((s) => ({
      modals: {
        ...s.modals,
        confirmDelete: {
          open: true,
          targetId,
          targetName,
          onConfirm,
        },
      },
    }))
  },

  hideConfirm: () => {
    set((s) => ({
      modals: {
        ...s.modals,
        confirmDelete: { open: false },
      },
    }))
  },

  confirmAction: () => {
    const { modals } = get()
    const { onConfirm } = modals.confirmDelete
    if (onConfirm) {
      onConfirm()
    }
    set((s) => ({
      modals: {
        ...s.modals,
        confirmDelete: { open: false },
      },
    }))
  },

  // ========== Sidebar Actions ==========

  toggleSidebar: () => {
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }))
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed })
  },

  // ========== Toast Actions ==========

  showToast: (toast: Omit<Toast, 'id'>) => {
    const id = generateToastId()
    const newToast: Toast = { ...toast, id }

    set((s) => ({
      toasts: [...s.toasts, newToast],
    }))

    // Auto dismiss after duration
    const duration = toast.duration ?? 3000
    if (duration > 0) {
      setTimeout(() => {
        get().dismissToast(id)
      }, duration)
    }
  },

  dismissToast: (id: string) => {
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    }))
  },

  // ========== Theme Actions ==========

  setTheme: (theme: 'light' | 'dark' | 'system') => {
    set({ theme })
  },
}))

/**
 * Hook to check if a modal is open
 */
export function useModalOpen(name: ModalName): boolean {
  return useUIStore((s) => {
    const modal = s.modals[name]
    if (typeof modal === 'boolean') return modal
    return modal.open
  })
}

/**
 * Hook to get confirm dialog state
 */
export function useConfirmDialog(): ConfirmState {
  return useUIStore((s) => s.modals.confirmDelete)
}

/**
 * Hook to get delete project modal state
 */
export function useDeleteProjectModal(): DeleteProjectState {
  return useUIStore((s) => s.modals.deleteProject)
}

/**
 * Hook to get sidebar state
 */
export function useSidebar(): { collapsed: boolean; toggle: () => void } {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggle = useUIStore((s) => s.toggleSidebar)
  return { collapsed, toggle }
}

/**
 * Hook to get toasts
 */
export function useToasts(): Toast[] {
  return useUIStore((s) => s.toasts)
}
