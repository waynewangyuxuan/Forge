/**
 * useGitHubAuth Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useGitHubAuth } from '../../../src/renderer/hooks/useGitHubAuth'

describe('useGitHubAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should start with loading state', () => {
    // Setup: never resolve
    ;(window.api.invoke as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useGitHubAuth())

    expect(result.current.loading).toBe(true)
    expect(result.current.available).toBe(false)
    expect(result.current.authenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('should set available and authenticated when github is connected', async () => {
    ;(window.api.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      available: true,
      auth: {
        authenticated: true,
        user: {
          login: 'testuser',
          name: 'Test User',
          avatarUrl: 'https://example.com/avatar.png',
        },
      },
    })

    const { result } = renderHook(() => useGitHubAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.available).toBe(true)
    expect(result.current.authenticated).toBe(true)
    expect(result.current.user).toEqual({
      login: 'testuser',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
    })
    expect(result.current.error).toBeNull()
  })

  it('should handle github not available', async () => {
    ;(window.api.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      available: false,
      auth: {
        authenticated: false,
      },
    })

    const { result } = renderHook(() => useGitHubAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.available).toBe(false)
    expect(result.current.authenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('should handle github available but not authenticated', async () => {
    ;(window.api.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      available: true,
      auth: {
        authenticated: false,
      },
    })

    const { result } = renderHook(() => useGitHubAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.available).toBe(true)
    expect(result.current.authenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('should handle error', async () => {
    ;(window.api.invoke as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useGitHubAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.available).toBe(false)
    expect(result.current.authenticated).toBe(false)
    expect(result.current.error).toBe('Network error')
  })

  it('should call github:checkAuth on mount', async () => {
    ;(window.api.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      available: true,
      auth: { authenticated: true, user: null },
    })

    renderHook(() => useGitHubAuth())

    await waitFor(() => {
      expect(window.api.invoke).toHaveBeenCalledWith('github:checkAuth')
    })
  })

  it('should provide refresh function', async () => {
    ;(window.api.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      available: true,
      auth: { authenticated: true, user: null },
    })

    const { result } = renderHook(() => useGitHubAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(typeof result.current.refresh).toBe('function')
  })

  it('should call checkAuth when refresh is called', async () => {
    ;(window.api.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      available: true,
      auth: { authenticated: true, user: null },
    })

    const { result } = renderHook(() => useGitHubAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear mock to track new calls
    ;(window.api.invoke as ReturnType<typeof vi.fn>).mockClear()

    await act(async () => {
      await result.current.refresh()
    })

    expect(window.api.invoke).toHaveBeenCalledWith('github:checkAuth')
  })

  it('should handle error without message', async () => {
    ;(window.api.invoke as ReturnType<typeof vi.fn>).mockRejectedValue({})

    const { result } = renderHook(() => useGitHubAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to check GitHub authentication')
  })
})
