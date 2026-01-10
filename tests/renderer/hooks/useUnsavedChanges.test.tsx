/**
 * useUnsavedChanges Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useUnsavedChanges } from '../../../src/renderer/hooks/useUnsavedChanges'

// Mock react-router-dom
const mockProceed = vi.fn()
const mockReset = vi.fn()
let blockerState = 'unblocked'

vi.mock('react-router-dom', () => ({
  useBlocker: vi.fn(() => ({
    state: blockerState,
    proceed: mockProceed,
    reset: mockReset,
  })),
}))

describe('useUnsavedChanges', () => {
  let originalConfirm: typeof window.confirm
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    blockerState = 'unblocked'
    originalConfirm = window.confirm
    addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    window.confirm = originalConfirm
  })

  it('should not add beforeunload listener when hasUnsaved is false', () => {
    renderHook(() => useUnsavedChanges(false))

    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    )
  })

  it('should add beforeunload listener when hasUnsaved is true', () => {
    renderHook(() => useUnsavedChanges(true))

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    )
  })

  it('should remove beforeunload listener on unmount', () => {
    const { unmount } = renderHook(() => useUnsavedChanges(true))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    )
  })

  it('should use default message when none provided', () => {
    // This test just verifies the hook doesn't throw with default args
    expect(() => {
      renderHook(() => useUnsavedChanges(true))
    }).not.toThrow()
  })

  it('should accept custom message', () => {
    expect(() => {
      renderHook(() => useUnsavedChanges(true, 'Custom warning message'))
    }).not.toThrow()
  })

  it('should call blocker.proceed when user confirms navigation', async () => {
    blockerState = 'blocked'
    window.confirm = vi.fn(() => true)

    renderHook(() => useUnsavedChanges(true))

    expect(mockProceed).toHaveBeenCalled()
  })

  it('should call blocker.reset when user cancels navigation', async () => {
    blockerState = 'blocked'
    window.confirm = vi.fn(() => false)

    renderHook(() => useUnsavedChanges(true))

    expect(mockReset).toHaveBeenCalled()
  })

  it('should not call blocker methods when not blocked', () => {
    blockerState = 'unblocked'

    renderHook(() => useUnsavedChanges(true))

    expect(mockProceed).not.toHaveBeenCalled()
    expect(mockReset).not.toHaveBeenCalled()
  })
})
