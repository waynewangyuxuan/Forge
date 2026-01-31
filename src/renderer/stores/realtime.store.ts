/**
 * Realtime Store - Manages IPC event subscriptions and live updates
 * Handles scaffold progress, execution status, runtime logs
 */

import { create } from 'zustand'

/**
 * Scaffold generation state
 */
export interface ScaffoldState {
  status: 'generating' | 'completed' | 'error'
  messages: string[] // Progress messages
  error?: string
}

/**
 * Execution progress state
 */
export interface ExecutionState {
  status: 'running' | 'paused' | 'completed' | 'error'
  progress: {
    completed: number
    total: number
    percent: number
  }
  currentTaskId?: string
  currentTaskDescription?: string
  error?: string
  blockedTaskIds?: string[]
}

/**
 * Runtime run state
 */
export interface RunState {
  status: 'running' | 'success' | 'failed'
  logs: string[] // Log lines
  exitCode?: number
}

/**
 * Realtime store state and actions
 */
interface RealtimeStore {
  // ========== State Data ==========

  // Scaffold generation (versionId -> state)
  scaffolds: Record<string, ScaffoldState>

  // Execution status (executionId -> state)
  executions: Record<string, ExecutionState>
  // Active execution per version (versionId -> executionId)
  activeExecutionByVersion: Record<string, string>

  // Runtime runs (runId -> state)
  runs: Record<string, RunState>
  // Active run per version (versionId -> runId)
  activeRunByVersion: Record<string, string>

  // ========== Subscription Management ==========

  subscribeScaffold: (versionId: string) => () => void
  subscribeExecution: (versionId: string, executionId: string) => () => void
  subscribeRun: (versionId: string, runId: string) => () => void

  // ========== Cleanup ==========

  clearScaffold: (versionId: string) => void
  clearExecution: (executionId: string) => void
  clearRun: (runId: string) => void

  // ========== Convenience Methods ==========

  getActiveExecution: (versionId: string) => ExecutionState | undefined
  getActiveRun: (versionId: string) => RunState | undefined
}

export const useRealtimeStore = create<RealtimeStore>((set, get) => ({
  // Initial state
  scaffolds: {},
  executions: {},
  activeExecutionByVersion: {},
  runs: {},
  activeRunByVersion: {},

  // ========== Scaffold Subscription ==========

  subscribeScaffold: (versionId: string) => {
    // Initialize scaffold state
    set((s) => ({
      scaffolds: {
        ...s.scaffolds,
        [versionId]: { status: 'generating', messages: [] },
      },
    }))

    // Subscribe to events
    const unsubProgress = window.api.on('scaffold:progress', (data) => {
      const { versionId: vid, message } = data as { versionId: string; message: string }
      if (vid !== versionId) return

      set((s) => {
        const current = s.scaffolds[versionId]
        if (!current) return s
        return {
          scaffolds: {
            ...s.scaffolds,
            [versionId]: {
              ...current,
              messages: [...current.messages, message],
            },
          },
        }
      })
    })

    const unsubCompleted = window.api.on('scaffold:completed', (data) => {
      const { versionId: vid } = data as { versionId: string }
      if (vid !== versionId) return

      set((s) => {
        const current = s.scaffolds[versionId]
        if (!current) return s
        return {
          scaffolds: {
            ...s.scaffolds,
            [versionId]: { ...current, status: 'completed' },
          },
        }
      })
    })

    const unsubError = window.api.on('scaffold:error', (data) => {
      const { versionId: vid, error } = data as { versionId: string; error: string }
      if (vid !== versionId) return

      set((s) => {
        const current = s.scaffolds[versionId]
        if (!current) return s
        return {
          scaffolds: {
            ...s.scaffolds,
            [versionId]: { ...current, status: 'error', error },
          },
        }
      })
    })

    // Return cleanup function
    return () => {
      unsubProgress()
      unsubCompleted()
      unsubError()
    }
  },

  // ========== Execution Subscription ==========

  subscribeExecution: (versionId: string, executionId: string) => {
    // Initialize execution state and map to version
    set((s) => ({
      executions: {
        ...s.executions,
        [executionId]: {
          status: 'running',
          progress: { completed: 0, total: 0, percent: 0 },
        },
      },
      activeExecutionByVersion: {
        ...s.activeExecutionByVersion,
        [versionId]: executionId,
      },
    }))

    // Subscribe to progress
    const unsubProgress = window.api.on('execution:progress', (data) => {
      const { executionId: eid, completed, total, percent } = data as {
        executionId: string
        completed: number
        total: number
        percent: number
      }
      if (eid !== executionId) return

      set((s) => {
        const current = s.executions[executionId]
        if (!current) return s
        return {
          executions: {
            ...s.executions,
            [executionId]: {
              ...current,
              progress: { completed, total, percent },
            },
          },
        }
      })
    })

    // Subscribe to task start
    const unsubTaskStart = window.api.on('execution:task:start', (data) => {
      const { executionId: eid, taskId, description } = data as {
        executionId: string
        taskId: string
        description: string
      }
      if (eid !== executionId) return

      set((s) => {
        const current = s.executions[executionId]
        if (!current) return s
        return {
          executions: {
            ...s.executions,
            [executionId]: {
              ...current,
              currentTaskId: taskId,
              currentTaskDescription: description,
            },
          },
        }
      })
    })

    // Subscribe to task done
    const unsubTaskDone = window.api.on('execution:task:done', (data) => {
      const { executionId: eid } = data as { executionId: string; taskId: string }
      if (eid !== executionId) return

      set((s) => {
        const current = s.executions[executionId]
        if (!current) return s
        return {
          executions: {
            ...s.executions,
            [executionId]: {
              ...current,
              currentTaskId: undefined,
              currentTaskDescription: undefined,
            },
          },
        }
      })
    })

    // Subscribe to task failed
    const unsubTaskFailed = window.api.on('execution:task:failed', (data) => {
      const { executionId: eid, error } = data as {
        executionId: string
        taskId: string
        error: string
      }
      if (eid !== executionId) return

      set((s) => {
        const current = s.executions[executionId]
        if (!current) return s
        return {
          executions: {
            ...s.executions,
            [executionId]: {
              ...current,
              status: 'error',
              error,
            },
          },
        }
      })
    })

    // Subscribe to completion
    const unsubCompleted = window.api.on('execution:completed', (data) => {
      const { executionId: eid } = data as { executionId: string }
      if (eid !== executionId) return

      set((s) => {
        const current = s.executions[executionId]
        if (!current) return s
        return {
          executions: {
            ...s.executions,
            [executionId]: {
              ...current,
              status: 'completed',
            },
          },
        }
      })
    })

    // Subscribe to paused
    const unsubPaused = window.api.on('execution:paused', (data) => {
      const { executionId: eid } = data as { executionId: string }
      if (eid !== executionId) return

      set((s) => {
        const current = s.executions[executionId]
        if (!current) return s
        return {
          executions: {
            ...s.executions,
            [executionId]: {
              ...current,
              status: 'paused',
            },
          },
        }
      })
    })

    // Subscribe to resumed
    const unsubResumed = window.api.on('execution:resumed', (data) => {
      const { executionId: eid } = data as { executionId: string }
      if (eid !== executionId) return

      set((s) => {
        const current = s.executions[executionId]
        if (!current) return s
        return {
          executions: {
            ...s.executions,
            [executionId]: {
              ...current,
              status: 'running',
            },
          },
        }
      })
    })

    // Subscribe to blocked
    const unsubBlocked = window.api.on('execution:blocked', (data) => {
      const { executionId: eid, blockedTaskIds } = data as {
        executionId: string
        blockedTaskIds: string[]
      }
      if (eid !== executionId) return

      set((s) => {
        const current = s.executions[executionId]
        if (!current) return s
        return {
          executions: {
            ...s.executions,
            [executionId]: {
              ...current,
              status: 'paused',
              blockedTaskIds,
            },
          },
        }
      })
    })

    // Subscribe to error
    const unsubError = window.api.on('execution:error', (data) => {
      const { executionId: eid, error } = data as {
        executionId: string
        error: string
      }
      if (eid !== executionId) return

      set((s) => {
        const current = s.executions[executionId]
        if (!current) return s
        return {
          executions: {
            ...s.executions,
            [executionId]: {
              ...current,
              status: 'error',
              error,
            },
          },
        }
      })
    })

    // Return cleanup function
    return () => {
      unsubProgress()
      unsubTaskStart()
      unsubTaskDone()
      unsubTaskFailed()
      unsubCompleted()
      unsubPaused()
      unsubResumed()
      unsubBlocked()
      unsubError()
    }
  },

  // ========== Run Subscription ==========

  subscribeRun: (versionId: string, runId: string) => {
    // Initialize run state and map to version
    set((s) => ({
      runs: {
        ...s.runs,
        [runId]: { status: 'running', logs: [] },
      },
      activeRunByVersion: {
        ...s.activeRunByVersion,
        [versionId]: runId,
      },
    }))

    // Subscribe to log events
    const unsubLog = window.api.on('runtime:log', (data) => {
      const { runId: rid, line } = data as { runId: string; line: string }
      if (rid !== runId) return

      set((s) => {
        const current = s.runs[runId]
        if (!current) return s
        return {
          runs: {
            ...s.runs,
            [runId]: {
              ...current,
              logs: [...current.logs, line],
            },
          },
        }
      })
    })

    // Subscribe to completion
    const unsubCompleted = window.api.on('runtime:completed', (data) => {
      const { runId: rid, status, exitCode } = data as {
        runId: string
        status: 'success' | 'failed'
        exitCode?: number
      }
      if (rid !== runId) return

      set((s) => {
        const current = s.runs[runId]
        if (!current) return s
        return {
          runs: {
            ...s.runs,
            [runId]: {
              ...current,
              status,
              exitCode,
            },
          },
        }
      })
    })

    // Return cleanup function
    return () => {
      unsubLog()
      unsubCompleted()
    }
  },

  // ========== Cleanup Methods ==========

  clearScaffold: (versionId: string) => {
    set((s) => {
      const { [versionId]: _removed, ...rest } = s.scaffolds
      void _removed // Intentionally unused - extracting to remove from rest
      return { scaffolds: rest }
    })
  },

  clearExecution: (executionId: string) => {
    set((s) => {
      const { [executionId]: _removed, ...rest } = s.executions
      void _removed // Intentionally unused - extracting to remove from rest
      // Also clear from version mapping
      const newMapping: Record<string, string> = {}
      for (const [vid, eid] of Object.entries(s.activeExecutionByVersion)) {
        if (eid !== executionId) {
          newMapping[vid] = eid
        }
      }
      return {
        executions: rest,
        activeExecutionByVersion: newMapping,
      }
    })
  },

  clearRun: (runId: string) => {
    set((s) => {
      const { [runId]: _removed, ...rest } = s.runs
      void _removed // Intentionally unused - extracting to remove from rest
      // Also clear from version mapping
      const newMapping: Record<string, string> = {}
      for (const [vid, rid] of Object.entries(s.activeRunByVersion)) {
        if (rid !== runId) {
          newMapping[vid] = rid
        }
      }
      return {
        runs: rest,
        activeRunByVersion: newMapping,
      }
    })
  },

  // ========== Convenience Methods ==========

  getActiveExecution: (versionId: string) => {
    const state = get()
    const executionId = state.activeExecutionByVersion[versionId]
    if (!executionId) return undefined
    return state.executions[executionId]
  },

  getActiveRun: (versionId: string) => {
    const state = get()
    const runId = state.activeRunByVersion[versionId]
    if (!runId) return undefined
    return state.runs[runId]
  },
}))

/**
 * Hook to get scaffold state for a version
 */
export function useScaffold(versionId: string | undefined): ScaffoldState | undefined {
  return useRealtimeStore((s) => (versionId ? s.scaffolds[versionId] : undefined))
}

/**
 * Hook to get active execution for a version
 */
export function useActiveExecution(versionId: string | undefined): ExecutionState | undefined {
  return useRealtimeStore((s) => {
    if (!versionId) return undefined
    const executionId = s.activeExecutionByVersion[versionId]
    if (!executionId) return undefined
    return s.executions[executionId]
  })
}

/**
 * Hook to get active run for a version
 */
export function useActiveRun(versionId: string | undefined): RunState | undefined {
  return useRealtimeStore((s) => {
    if (!versionId) return undefined
    const runId = s.activeRunByVersion[versionId]
    if (!runId) return undefined
    return s.runs[runId]
  })
}
