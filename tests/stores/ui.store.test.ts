/**
 * UI Store Unit Tests
 * Tests for UI state management (modals, toasts, sidebar)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../../src/renderer/stores/ui.store'

describe('UIStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      modals: {
        createProject: false,
        createVersion: false,
        confirmDelete: { open: false },
        runtimeConfig: false,
        addCredential: false,
        settings: false,
      },
      sidebarCollapsed: false,
      toasts: [],
      theme: 'system',
    })
  })

  describe('modals', () => {
    it('should open a modal', () => {
      const { openModal } = useUIStore.getState()
      openModal('createProject')

      const { modals } = useUIStore.getState()
      expect(modals.createProject).toBe(true)
    })

    it('should close a modal', () => {
      const { openModal, closeModal } = useUIStore.getState()
      openModal('createProject')
      closeModal('createProject')

      const { modals } = useUIStore.getState()
      expect(modals.createProject).toBe(false)
    })

    it('should open confirm dialog with data', () => {
      const { showConfirm } = useUIStore.getState()
      const mockCallback = () => {}

      showConfirm({
        targetId: 'project-123',
        targetName: 'My Project',
        onConfirm: mockCallback,
      })

      const { modals } = useUIStore.getState()
      expect(modals.confirmDelete.open).toBe(true)
      expect(modals.confirmDelete.targetId).toBe('project-123')
      expect(modals.confirmDelete.targetName).toBe('My Project')
    })

    it('should execute confirm callback and close dialog', () => {
      let callbackExecuted = false
      const { showConfirm, confirmAction } = useUIStore.getState()

      showConfirm({
        targetId: 'test',
        targetName: 'Test',
        onConfirm: () => {
          callbackExecuted = true
        },
      })

      confirmAction()

      const { modals } = useUIStore.getState()
      expect(callbackExecuted).toBe(true)
      expect(modals.confirmDelete.open).toBe(false)
    })

    it('should hide confirm dialog without executing callback', () => {
      let callbackExecuted = false
      const { showConfirm, hideConfirm } = useUIStore.getState()

      showConfirm({
        targetId: 'test',
        targetName: 'Test',
        onConfirm: () => {
          callbackExecuted = true
        },
      })

      hideConfirm()

      const { modals } = useUIStore.getState()
      expect(callbackExecuted).toBe(false)
      expect(modals.confirmDelete.open).toBe(false)
    })
  })

  describe('sidebar', () => {
    it('should toggle sidebar collapsed state', () => {
      const { toggleSidebar } = useUIStore.getState()

      expect(useUIStore.getState().sidebarCollapsed).toBe(false)

      toggleSidebar()
      expect(useUIStore.getState().sidebarCollapsed).toBe(true)

      toggleSidebar()
      expect(useUIStore.getState().sidebarCollapsed).toBe(false)
    })

    it('should set sidebar collapsed state directly', () => {
      const { setSidebarCollapsed } = useUIStore.getState()

      setSidebarCollapsed(true)
      expect(useUIStore.getState().sidebarCollapsed).toBe(true)

      setSidebarCollapsed(false)
      expect(useUIStore.getState().sidebarCollapsed).toBe(false)
    })
  })

  describe('toasts', () => {
    it('should show a toast', () => {
      const { showToast } = useUIStore.getState()

      showToast({
        type: 'success',
        message: 'Operation successful',
      })

      const { toasts } = useUIStore.getState()
      expect(toasts).toHaveLength(1)
      expect(toasts[0].type).toBe('success')
      expect(toasts[0].message).toBe('Operation successful')
      expect(toasts[0].id).toBeDefined()
    })

    it('should dismiss a toast by id', () => {
      const { showToast, dismissToast } = useUIStore.getState()

      showToast({
        type: 'error',
        message: 'Error occurred',
        duration: 0, // Disable auto-dismiss
      })

      const { toasts: toastsAfterShow } = useUIStore.getState()
      const toastId = toastsAfterShow[0].id

      dismissToast(toastId)

      const { toasts: toastsAfterDismiss } = useUIStore.getState()
      expect(toastsAfterDismiss).toHaveLength(0)
    })

    it('should show multiple toasts', () => {
      const { showToast } = useUIStore.getState()

      showToast({ type: 'success', message: 'Toast 1', duration: 0 })
      showToast({ type: 'info', message: 'Toast 2', duration: 0 })
      showToast({ type: 'warning', message: 'Toast 3', duration: 0 })

      const { toasts } = useUIStore.getState()
      expect(toasts).toHaveLength(3)
    })
  })

  describe('theme', () => {
    it('should set theme', () => {
      const { setTheme } = useUIStore.getState()

      setTheme('dark')
      expect(useUIStore.getState().theme).toBe('dark')

      setTheme('light')
      expect(useUIStore.getState().theme).toBe('light')

      setTheme('system')
      expect(useUIStore.getState().theme).toBe('system')
    })
  })

  describe('openModal with confirmDelete and data', () => {
    it('should open confirmDelete modal via openModal with data', () => {
      const { openModal } = useUIStore.getState()
      const mockCallback = () => {}

      openModal('confirmDelete', {
        targetId: 'project-456',
        targetName: 'Another Project',
        onConfirm: mockCallback,
      })

      const { modals } = useUIStore.getState()
      expect(modals.confirmDelete.open).toBe(true)
      expect(modals.confirmDelete.targetId).toBe('project-456')
      expect(modals.confirmDelete.targetName).toBe('Another Project')
    })

    it('should open confirmDelete modal via openModal without data', () => {
      const { openModal } = useUIStore.getState()

      openModal('confirmDelete')

      const { modals } = useUIStore.getState()
      expect(modals.confirmDelete.open).toBe(true)
    })

    it('should close confirmDelete modal', () => {
      const { openModal, closeModal } = useUIStore.getState()

      openModal('confirmDelete', { targetId: 'test', targetName: 'Test' })
      closeModal('confirmDelete')

      const { modals } = useUIStore.getState()
      expect(modals.confirmDelete.open).toBe(false)
    })
  })

  describe('confirmAction without callback', () => {
    it('should close confirm dialog even without callback', () => {
      useUIStore.setState({
        modals: {
          ...useUIStore.getState().modals,
          confirmDelete: {
            open: true,
            targetId: 'test',
            targetName: 'Test',
            // No onConfirm callback
          },
        },
      })

      const { confirmAction } = useUIStore.getState()
      confirmAction()

      const { modals } = useUIStore.getState()
      expect(modals.confirmDelete.open).toBe(false)
    })
  })
})

describe('UI Store Selectors', () => {
  beforeEach(() => {
    useUIStore.setState({
      modals: {
        createProject: false,
        createVersion: false,
        confirmDelete: { open: false },
        runtimeConfig: false,
        addCredential: false,
        settings: false,
      },
      sidebarCollapsed: false,
      toasts: [],
      theme: 'system',
    })
  })

  describe('modal open selector', () => {
    it('should return false when modal is closed', () => {
      const state = useUIStore.getState()
      const result = state.modals.createProject
      expect(result).toBe(false)
    })

    it('should return true when modal is open', () => {
      useUIStore.getState().openModal('createProject')

      const state = useUIStore.getState()
      const result = state.modals.createProject
      expect(result).toBe(true)
    })

    it('should return open state for confirmDelete modal', () => {
      useUIStore.getState().showConfirm({
        targetId: 'test',
        targetName: 'Test',
        onConfirm: () => {},
      })

      const state = useUIStore.getState()
      const result = state.modals.confirmDelete.open
      expect(result).toBe(true)
    })
  })

  describe('confirm dialog selector', () => {
    it('should return confirm dialog state', () => {
      useUIStore.getState().showConfirm({
        targetId: 'project-1',
        targetName: 'Project One',
        onConfirm: () => {},
      })

      const result = useUIStore.getState().modals.confirmDelete

      expect(result.open).toBe(true)
      expect(result.targetId).toBe('project-1')
      expect(result.targetName).toBe('Project One')
    })
  })

  describe('sidebar selector', () => {
    it('should return sidebar state', () => {
      const collapsed = useUIStore.getState().sidebarCollapsed
      const toggle = useUIStore.getState().toggleSidebar

      expect(collapsed).toBe(false)
      expect(typeof toggle).toBe('function')
    })

    it('should toggle sidebar', () => {
      expect(useUIStore.getState().sidebarCollapsed).toBe(false)

      useUIStore.getState().toggleSidebar()
      expect(useUIStore.getState().sidebarCollapsed).toBe(true)
    })
  })

  describe('toasts selector', () => {
    it('should return empty array when no toasts', () => {
      const toasts = useUIStore.getState().toasts
      expect(toasts).toEqual([])
    })

    it('should return toasts when present', () => {
      useUIStore.getState().showToast({
        type: 'success',
        message: 'Test toast',
        duration: 0,
      })

      const toasts = useUIStore.getState().toasts
      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe('Test toast')
    })
  })
})
