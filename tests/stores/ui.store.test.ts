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
})
