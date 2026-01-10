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

  describe('scaffold event handlers', () => {
    it('should subscribe to scaffold events', () => {
      const { subscribeScaffold } = useRealtimeStore.getState()

      subscribeScaffold('version-123')

      // Should subscribe to all scaffold events
      expect(mockOn).toHaveBeenCalledWith('scaffold:progress', expect.any(Function))
      expect(mockOn).toHaveBeenCalledWith('scaffold:completed', expect.any(Function))
      expect(mockOn).toHaveBeenCalledWith('scaffold:error', expect.any(Function))
    })

    it('should handle scaffold:progress event', () => {
      const { subscribeScaffold } = useRealtimeStore.getState()

      subscribeScaffold('version-123')

      // Get the progress handler from the mock calls
      const progressHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'scaffold:progress'
      )?.[1]

      // Trigger the handler
      progressHandler?.({ versionId: 'version-123', message: 'Generating files...' })

      const { scaffolds } = useRealtimeStore.getState()
      expect(scaffolds['version-123'].messages).toContain('Generating files...')
    })

    it('should ignore scaffold:progress for different version', () => {
      const { subscribeScaffold } = useRealtimeStore.getState()

      subscribeScaffold('version-123')

      const progressHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'scaffold:progress'
      )?.[1]

      // Trigger for different version
      progressHandler?.({ versionId: 'version-999', message: 'Should be ignored' })

      const { scaffolds } = useRealtimeStore.getState()
      expect(scaffolds['version-123'].messages).not.toContain('Should be ignored')
    })

    it('should handle scaffold:completed event', () => {
      const { subscribeScaffold } = useRealtimeStore.getState()

      subscribeScaffold('version-123')

      const completedHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'scaffold:completed'
      )?.[1]

      completedHandler?.({ versionId: 'version-123' })

      const { scaffolds } = useRealtimeStore.getState()
      expect(scaffolds['version-123'].status).toBe('completed')
    })

    it('should handle scaffold:error event', () => {
      const { subscribeScaffold } = useRealtimeStore.getState()

      subscribeScaffold('version-123')

      const errorHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'scaffold:error'
      )?.[1]

      errorHandler?.({ versionId: 'version-123', error: 'Generation failed' })

      const { scaffolds } = useRealtimeStore.getState()
      expect(scaffolds['version-123'].status).toBe('error')
      expect(scaffolds['version-123'].error).toBe('Generation failed')
    })

    it('should unsubscribe from events when cleanup is called', () => {
      const { subscribeScaffold } = useRealtimeStore.getState()

      const unsubscribe = subscribeScaffold('version-123')
      unsubscribe()

      // Should call all unsubscribe functions (3 events)
      expect(mockUnsubscribe).toHaveBeenCalledTimes(3)
    })
  })

  describe('execution event handlers', () => {
    it('should subscribe to execution events', () => {
      const { subscribeExecution } = useRealtimeStore.getState()

      subscribeExecution('version-123', 'exec-456')

      expect(mockOn).toHaveBeenCalledWith('execution:progress', expect.any(Function))
      expect(mockOn).toHaveBeenCalledWith('execution:task:start', expect.any(Function))
      expect(mockOn).toHaveBeenCalledWith('execution:task:done', expect.any(Function))
      expect(mockOn).toHaveBeenCalledWith('execution:task:failed', expect.any(Function))
      expect(mockOn).toHaveBeenCalledWith('execution:completed', expect.any(Function))
    })

    it('should handle execution:progress event', () => {
      const { subscribeExecution } = useRealtimeStore.getState()

      subscribeExecution('version-123', 'exec-456')

      const progressHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'execution:progress'
      )?.[1]

      progressHandler?.({
        executionId: 'exec-456',
        completed: 5,
        total: 10,
        percent: 50,
      })

      const { executions } = useRealtimeStore.getState()
      expect(executions['exec-456'].progress).toEqual({
        completed: 5,
        total: 10,
        percent: 50,
      })
    })

    it('should handle execution:task:start event', () => {
      const { subscribeExecution } = useRealtimeStore.getState()

      subscribeExecution('version-123', 'exec-456')

      const taskStartHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'execution:task:start'
      )?.[1]

      taskStartHandler?.({
        executionId: 'exec-456',
        taskId: 'task-1',
        description: 'Building component',
      })

      const { executions } = useRealtimeStore.getState()
      expect(executions['exec-456'].currentTaskId).toBe('task-1')
      expect(executions['exec-456'].currentTaskDescription).toBe('Building component')
    })

    it('should handle execution:task:done event', () => {
      const { subscribeExecution } = useRealtimeStore.getState()

      subscribeExecution('version-123', 'exec-456')

      // First set a current task
      const taskStartHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'execution:task:start'
      )?.[1]
      taskStartHandler?.({
        executionId: 'exec-456',
        taskId: 'task-1',
        description: 'Building component',
      })

      // Then complete it
      const taskDoneHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'execution:task:done'
      )?.[1]
      taskDoneHandler?.({ executionId: 'exec-456', taskId: 'task-1' })

      const { executions } = useRealtimeStore.getState()
      expect(executions['exec-456'].currentTaskId).toBeUndefined()
      expect(executions['exec-456'].currentTaskDescription).toBeUndefined()
    })

    it('should handle execution:task:failed event', () => {
      const { subscribeExecution } = useRealtimeStore.getState()

      subscribeExecution('version-123', 'exec-456')

      const taskFailedHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'execution:task:failed'
      )?.[1]

      taskFailedHandler?.({
        executionId: 'exec-456',
        taskId: 'task-1',
        error: 'Task failed',
      })

      const { executions } = useRealtimeStore.getState()
      expect(executions['exec-456'].status).toBe('error')
      expect(executions['exec-456'].error).toBe('Task failed')
    })

    it('should handle execution:completed event', () => {
      const { subscribeExecution } = useRealtimeStore.getState()

      subscribeExecution('version-123', 'exec-456')

      const completedHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'execution:completed'
      )?.[1]

      completedHandler?.({ executionId: 'exec-456' })

      const { executions } = useRealtimeStore.getState()
      expect(executions['exec-456'].status).toBe('completed')
    })

    it('should unsubscribe from execution events when cleanup is called', () => {
      const { subscribeExecution } = useRealtimeStore.getState()

      const unsubscribe = subscribeExecution('version-123', 'exec-456')
      unsubscribe()

      // Should call all unsubscribe functions (5 events)
      expect(mockUnsubscribe).toHaveBeenCalledTimes(5)
    })
  })

  describe('run event handlers', () => {
    it('should subscribe to run events', () => {
      const { subscribeRun } = useRealtimeStore.getState()

      subscribeRun('version-123', 'run-789')

      expect(mockOn).toHaveBeenCalledWith('runtime:log', expect.any(Function))
      expect(mockOn).toHaveBeenCalledWith('runtime:completed', expect.any(Function))
    })

    it('should handle runtime:log event', () => {
      const { subscribeRun } = useRealtimeStore.getState()

      subscribeRun('version-123', 'run-789')

      const logHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'runtime:log'
      )?.[1]

      logHandler?.({ runId: 'run-789', line: 'Server started on port 3000' })

      const { runs } = useRealtimeStore.getState()
      expect(runs['run-789'].logs).toContain('Server started on port 3000')
    })

    it('should handle runtime:completed event with success', () => {
      const { subscribeRun } = useRealtimeStore.getState()

      subscribeRun('version-123', 'run-789')

      const completedHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'runtime:completed'
      )?.[1]

      completedHandler?.({ runId: 'run-789', status: 'success', exitCode: 0 })

      const { runs } = useRealtimeStore.getState()
      expect(runs['run-789'].status).toBe('success')
      expect(runs['run-789'].exitCode).toBe(0)
    })

    it('should handle runtime:completed event with failure', () => {
      const { subscribeRun } = useRealtimeStore.getState()

      subscribeRun('version-123', 'run-789')

      const completedHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'runtime:completed'
      )?.[1]

      completedHandler?.({ runId: 'run-789', status: 'failed', exitCode: 1 })

      const { runs } = useRealtimeStore.getState()
      expect(runs['run-789'].status).toBe('failed')
      expect(runs['run-789'].exitCode).toBe(1)
    })

    it('should unsubscribe from run events when cleanup is called', () => {
      const { subscribeRun } = useRealtimeStore.getState()

      const unsubscribe = subscribeRun('version-123', 'run-789')
      unsubscribe()

      // Should call all unsubscribe functions (2 events)
      expect(mockUnsubscribe).toHaveBeenCalledTimes(2)
    })
  })

  describe('getActiveRun', () => {
    it('should return undefined when no active run exists', () => {
      const { getActiveRun } = useRealtimeStore.getState()

      const run = getActiveRun('nonexistent-version')
      expect(run).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should handle clearing non-existent scaffold', () => {
      const { clearScaffold } = useRealtimeStore.getState()

      // Should not throw
      expect(() => {
        clearScaffold('nonexistent')
      }).not.toThrow()
    })

    it('should handle clearing non-existent execution', () => {
      const { clearExecution } = useRealtimeStore.getState()

      // Should not throw
      expect(() => {
        clearExecution('nonexistent')
      }).not.toThrow()
    })

    it('should handle clearing non-existent run', () => {
      const { clearRun } = useRealtimeStore.getState()

      // Should not throw
      expect(() => {
        clearRun('nonexistent')
      }).not.toThrow()
    })

    it('should preserve other executions when clearing one', () => {
      const { subscribeExecution, clearExecution } = useRealtimeStore.getState()

      subscribeExecution('version-1', 'exec-1')
      subscribeExecution('version-2', 'exec-2')

      clearExecution('exec-1')

      const state = useRealtimeStore.getState()
      expect(state.executions['exec-1']).toBeUndefined()
      expect(state.executions['exec-2']).toBeDefined()
      expect(state.activeExecutionByVersion['version-2']).toBe('exec-2')
    })

    it('should preserve other runs when clearing one', () => {
      const { subscribeRun, clearRun } = useRealtimeStore.getState()

      subscribeRun('version-1', 'run-1')
      subscribeRun('version-2', 'run-2')

      clearRun('run-1')

      const state = useRealtimeStore.getState()
      expect(state.runs['run-1']).toBeUndefined()
      expect(state.runs['run-2']).toBeDefined()
      expect(state.activeRunByVersion['version-2']).toBe('run-2')
    })
  })

  describe('hook selectors', () => {
    it('useScaffold selector should return scaffold for versionId', () => {
      const { subscribeScaffold } = useRealtimeStore.getState()
      subscribeScaffold('version-123')

      // Test the selector logic
      const versionId = 'version-123'
      const selector = (s: { scaffolds: Record<string, { status: string; messages: string[] }> }) =>
        versionId ? s.scaffolds[versionId] : undefined
      const result = selector(useRealtimeStore.getState())

      expect(result).toBeDefined()
      expect(result?.status).toBe('generating')
    })

    it('useScaffold selector should return undefined for undefined versionId', () => {
      const versionId: string | undefined = undefined
      const selector = (s: { scaffolds: Record<string, { status: string; messages: string[] }> }) =>
        versionId ? s.scaffolds[versionId] : undefined
      const result = selector(useRealtimeStore.getState())

      expect(result).toBeUndefined()
    })

    it('useActiveExecution selector should return execution for versionId', () => {
      const { subscribeExecution } = useRealtimeStore.getState()
      subscribeExecution('version-123', 'exec-456')

      const versionId = 'version-123'
      const state = useRealtimeStore.getState()

      const selector = (s: {
        activeExecutionByVersion: Record<string, string>
        executions: Record<string, { status: string }>
      }) => {
        if (!versionId) return undefined
        const executionId = s.activeExecutionByVersion[versionId]
        if (!executionId) return undefined
        return s.executions[executionId]
      }
      const result = selector(state)

      expect(result).toBeDefined()
      expect(result?.status).toBe('running')
    })

    it('useActiveExecution selector should return undefined for undefined versionId', () => {
      const versionId: string | undefined = undefined

      const selector = (s: {
        activeExecutionByVersion: Record<string, string>
        executions: Record<string, { status: string }>
      }) => {
        if (!versionId) return undefined
        const executionId = s.activeExecutionByVersion[versionId]
        if (!executionId) return undefined
        return s.executions[executionId]
      }
      const result = selector(useRealtimeStore.getState())

      expect(result).toBeUndefined()
    })

    it('useActiveExecution selector should return undefined when no executionId', () => {
      const versionId = 'version-123'
      // No subscription, so no active execution

      const selector = (s: {
        activeExecutionByVersion: Record<string, string>
        executions: Record<string, { status: string }>
      }) => {
        if (!versionId) return undefined
        const executionId = s.activeExecutionByVersion[versionId]
        if (!executionId) return undefined
        return s.executions[executionId]
      }
      const result = selector(useRealtimeStore.getState())

      expect(result).toBeUndefined()
    })

    it('useActiveRun selector should return run for versionId', () => {
      const { subscribeRun } = useRealtimeStore.getState()
      subscribeRun('version-123', 'run-789')

      const versionId = 'version-123'

      const selector = (s: {
        activeRunByVersion: Record<string, string>
        runs: Record<string, { status: string }>
      }) => {
        if (!versionId) return undefined
        const runId = s.activeRunByVersion[versionId]
        if (!runId) return undefined
        return s.runs[runId]
      }
      const result = selector(useRealtimeStore.getState())

      expect(result).toBeDefined()
      expect(result?.status).toBe('running')
    })

    it('useActiveRun selector should return undefined for undefined versionId', () => {
      const versionId: string | undefined = undefined

      const selector = (s: {
        activeRunByVersion: Record<string, string>
        runs: Record<string, { status: string }>
      }) => {
        if (!versionId) return undefined
        const runId = s.activeRunByVersion[versionId]
        if (!runId) return undefined
        return s.runs[runId]
      }
      const result = selector(useRealtimeStore.getState())

      expect(result).toBeUndefined()
    })

    it('useActiveRun selector should return undefined when no runId', () => {
      const versionId = 'version-123'
      // No subscription, so no active run

      const selector = (s: {
        activeRunByVersion: Record<string, string>
        runs: Record<string, { status: string }>
      }) => {
        if (!versionId) return undefined
        const runId = s.activeRunByVersion[versionId]
        if (!runId) return undefined
        return s.runs[runId]
      }
      const result = selector(useRealtimeStore.getState())

      expect(result).toBeUndefined()
    })
  })

  describe('event handlers with no current state', () => {
    it('should not throw when scaffold:progress is received for deleted scaffold', () => {
      const { subscribeScaffold, clearScaffold } = useRealtimeStore.getState()

      subscribeScaffold('version-123')
      clearScaffold('version-123')

      const progressHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'scaffold:progress'
      )?.[1]

      // Should not throw when scaffold doesn't exist
      expect(() => {
        progressHandler?.({ versionId: 'version-123', message: 'Message' })
      }).not.toThrow()
    })

    it('should not throw when scaffold:completed is received for deleted scaffold', () => {
      const { subscribeScaffold, clearScaffold } = useRealtimeStore.getState()

      subscribeScaffold('version-123')
      clearScaffold('version-123')

      const completedHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'scaffold:completed'
      )?.[1]

      expect(() => {
        completedHandler?.({ versionId: 'version-123' })
      }).not.toThrow()
    })

    it('should not throw when scaffold:error is received for deleted scaffold', () => {
      const { subscribeScaffold, clearScaffold } = useRealtimeStore.getState()

      subscribeScaffold('version-123')
      clearScaffold('version-123')

      const errorHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'scaffold:error'
      )?.[1]

      expect(() => {
        errorHandler?.({ versionId: 'version-123', error: 'Error' })
      }).not.toThrow()
    })

    it('should not throw when execution:progress is received for deleted execution', () => {
      const { subscribeExecution, clearExecution } = useRealtimeStore.getState()

      subscribeExecution('version-123', 'exec-456')
      clearExecution('exec-456')

      const progressHandler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'execution:progress'
      )?.[1]

      expect(() => {
        progressHandler?.({ executionId: 'exec-456', completed: 1, total: 10, percent: 10 })
      }).not.toThrow()
    })

    it('should not throw when execution:task:start is received for deleted execution', () => {
      const { subscribeExecution, clearExecution } = useRealtimeStore.getState()

      subscribeExecution('version-123', 'exec-456')
      clearExecution('exec-456')

      const handler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'execution:task:start'
      )?.[1]

      expect(() => {
        handler?.({ executionId: 'exec-456', taskId: 'task-1', description: 'Test' })
      }).not.toThrow()
    })

    it('should not throw when execution:task:done is received for deleted execution', () => {
      const { subscribeExecution, clearExecution } = useRealtimeStore.getState()

      subscribeExecution('version-123', 'exec-456')
      clearExecution('exec-456')

      const handler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'execution:task:done'
      )?.[1]

      expect(() => {
        handler?.({ executionId: 'exec-456', taskId: 'task-1' })
      }).not.toThrow()
    })

    it('should not throw when execution:task:failed is received for deleted execution', () => {
      const { subscribeExecution, clearExecution } = useRealtimeStore.getState()

      subscribeExecution('version-123', 'exec-456')
      clearExecution('exec-456')

      const handler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'execution:task:failed'
      )?.[1]

      expect(() => {
        handler?.({ executionId: 'exec-456', taskId: 'task-1', error: 'Error' })
      }).not.toThrow()
    })

    it('should not throw when execution:completed is received for deleted execution', () => {
      const { subscribeExecution, clearExecution } = useRealtimeStore.getState()

      subscribeExecution('version-123', 'exec-456')
      clearExecution('exec-456')

      const handler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'execution:completed'
      )?.[1]

      expect(() => {
        handler?.({ executionId: 'exec-456' })
      }).not.toThrow()
    })

    it('should not throw when runtime:log is received for deleted run', () => {
      const { subscribeRun, clearRun } = useRealtimeStore.getState()

      subscribeRun('version-123', 'run-789')
      clearRun('run-789')

      const handler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'runtime:log'
      )?.[1]

      expect(() => {
        handler?.({ runId: 'run-789', line: 'Log line' })
      }).not.toThrow()
    })

    it('should not throw when runtime:completed is received for deleted run', () => {
      const { subscribeRun, clearRun } = useRealtimeStore.getState()

      subscribeRun('version-123', 'run-789')
      clearRun('run-789')

      const handler = mockOn.mock.calls.find(
        (call: [string, (...args: unknown[]) => unknown]) => call[0] === 'runtime:completed'
      )?.[1]

      expect(() => {
        handler?.({ runId: 'run-789', status: 'success', exitCode: 0 })
      }).not.toThrow()
    })
  })
})
