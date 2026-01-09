/**
 * Realtime Store Unit Tests
 * Tests for realtime state management (scaffold, execution, run states)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRealtimeStore } from '../../src/renderer/stores/realtime.store'

// Mock window.api
const mockUnsubscribe = vi.fn()
const mockOn = vi.fn(() => mockUnsubscribe)

vi.stubGlobal('window', {
  api: {
    on: mockOn,
    invoke: vi.fn(),
    once: vi.fn(),
  },
})

describe('RealtimeStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useRealtimeStore.setState({
      scaffolds: {},
      executions: {},
      activeExecutionByVersion: {},
      runs: {},
      activeRunByVersion: {},
    })
    vi.clearAllMocks()
  })

  describe('scaffold management', () => {
    it('should initialize scaffold state when subscribing', () => {
      const { subscribeScaffold } = useRealtimeStore.getState()

      subscribeScaffold('version-123')

      const { scaffolds } = useRealtimeStore.getState()
      expect(scaffolds['version-123']).toBeDefined()
      expect(scaffolds['version-123'].status).toBe('generating')
      expect(scaffolds['version-123'].messages).toEqual([])
    })

    it('should return unsubscribe function', () => {
      const { subscribeScaffold } = useRealtimeStore.getState()

      const unsubscribe = subscribeScaffold('version-123')

      expect(typeof unsubscribe).toBe('function')
    })

    it('should clear scaffold state', () => {
      const { subscribeScaffold, clearScaffold } = useRealtimeStore.getState()

      subscribeScaffold('version-123')
      clearScaffold('version-123')

      const { scaffolds } = useRealtimeStore.getState()
      expect(scaffolds['version-123']).toBeUndefined()
    })
  })

  describe('execution management', () => {
    it('should initialize execution state when subscribing', () => {
      const { subscribeExecution } = useRealtimeStore.getState()

      subscribeExecution('version-123', 'exec-456')

      const { executions, activeExecutionByVersion } = useRealtimeStore.getState()
      expect(executions['exec-456']).toBeDefined()
      expect(executions['exec-456'].status).toBe('running')
      expect(executions['exec-456'].progress).toEqual({
        completed: 0,
        total: 0,
        percent: 0,
      })
      expect(activeExecutionByVersion['version-123']).toBe('exec-456')
    })

    it('should clear execution state and remove from version mapping', () => {
      const { subscribeExecution, clearExecution } = useRealtimeStore.getState()

      subscribeExecution('version-123', 'exec-456')
      clearExecution('exec-456')

      const { executions, activeExecutionByVersion } = useRealtimeStore.getState()
      expect(executions['exec-456']).toBeUndefined()
      expect(activeExecutionByVersion['version-123']).toBeUndefined()
    })

    it('should get active execution for version', () => {
      const { subscribeExecution, getActiveExecution } = useRealtimeStore.getState()

      subscribeExecution('version-123', 'exec-456')

      const execution = getActiveExecution('version-123')
      expect(execution).toBeDefined()
      expect(execution?.status).toBe('running')
    })

    it('should return undefined for version with no active execution', () => {
      const { getActiveExecution } = useRealtimeStore.getState()

      const execution = getActiveExecution('nonexistent')
      expect(execution).toBeUndefined()
    })
  })

  describe('run management', () => {
    it('should initialize run state when subscribing', () => {
      const { subscribeRun } = useRealtimeStore.getState()

      subscribeRun('version-123', 'run-789')

      const { runs, activeRunByVersion } = useRealtimeStore.getState()
      expect(runs['run-789']).toBeDefined()
      expect(runs['run-789'].status).toBe('running')
      expect(runs['run-789'].logs).toEqual([])
      expect(activeRunByVersion['version-123']).toBe('run-789')
    })

    it('should clear run state and remove from version mapping', () => {
      const { subscribeRun, clearRun } = useRealtimeStore.getState()

      subscribeRun('version-123', 'run-789')
      clearRun('run-789')

      const { runs, activeRunByVersion } = useRealtimeStore.getState()
      expect(runs['run-789']).toBeUndefined()
      expect(activeRunByVersion['version-123']).toBeUndefined()
    })

    it('should get active run for version', () => {
      const { subscribeRun, getActiveRun } = useRealtimeStore.getState()

      subscribeRun('version-123', 'run-789')

      const run = getActiveRun('version-123')
      expect(run).toBeDefined()
      expect(run?.status).toBe('running')
    })
  })

  describe('multiple subscriptions', () => {
    it('should handle multiple executions for different versions', () => {
      const { subscribeExecution, getActiveExecution } = useRealtimeStore.getState()

      subscribeExecution('version-1', 'exec-1')
      subscribeExecution('version-2', 'exec-2')

      expect(getActiveExecution('version-1')?.status).toBe('running')
      expect(getActiveExecution('version-2')?.status).toBe('running')
    })

    it('should replace active execution when new one starts for same version', () => {
      const { subscribeExecution, activeExecutionByVersion } =
        useRealtimeStore.getState()

      subscribeExecution('version-1', 'exec-1')
      subscribeExecution('version-1', 'exec-2')

      const state = useRealtimeStore.getState()
      expect(state.activeExecutionByVersion['version-1']).toBe('exec-2')
      // Both executions still exist in the map
      expect(state.executions['exec-1']).toBeDefined()
      expect(state.executions['exec-2']).toBeDefined()
    })
  })
})
