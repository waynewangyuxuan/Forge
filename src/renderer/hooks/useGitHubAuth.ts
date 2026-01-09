/**
 * useGitHubAuth Hook
 * Manages GitHub CLI availability and authentication status
 */

import { useState, useEffect, useCallback } from 'react'
import type { GitHubCheckAuthOutput } from '@shared/types/ipc.types'

export interface GitHubAuthState {
  loading: boolean
  available: boolean
  authenticated: boolean
  user: {
    login: string
    name: string
    avatarUrl: string
  } | null
  error: string | null
}

/**
 * Hook to check and monitor GitHub authentication status
 */
export function useGitHubAuth() {
  const [state, setState] = useState<GitHubAuthState>({
    loading: true,
    available: false,
    authenticated: false,
    user: null,
    error: null,
  })

  const checkAuth = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const result = await window.api.invoke('github:checkAuth') as GitHubCheckAuthOutput

      setState({
        loading: false,
        available: result.available,
        authenticated: result.auth.authenticated,
        user: result.auth.user ?? null,
        error: null,
      })
    } catch (error) {
      const err = error as Error
      setState({
        loading: false,
        available: false,
        authenticated: false,
        user: null,
        error: err.message || 'Failed to check GitHub authentication',
      })
    }
  }, [])

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    ...state,
    refresh: checkAuth,
  }
}
