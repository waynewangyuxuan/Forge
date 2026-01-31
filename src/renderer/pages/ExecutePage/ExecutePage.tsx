/**
 * ExecutePage
 * Execute and monitor the code generation process
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useServerStore, useVersions } from '../../stores/server.store'
import { useRealtimeStore, useActiveExecution } from '../../stores/realtime.store'
import { Button } from '../../components/primitives/Button'
import { Spinner } from '../../components/primitives/Spinner'
import { TaskList } from '../../components/composites/TaskList'
import { ProgressBar } from '../../components/composites/ProgressBar'
import { BlockedTasksBanner } from '../../components/composites/BlockedTasksBanner'
import { ReviewLayout, ReviewHeader, ReviewBanner } from '../../components/review'
import type { IPCResult } from '@shared/types/ipc.types'
import type { ExecutionPlan } from '@shared/types/execution.types'
import type { Execution } from '@shared/types/execution.types'

export const ExecutePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const versions = useVersions(projectId)
  const currentVersionId = useServerStore((s) => (projectId ? s.currentVersionId[projectId] : undefined))
  const currentVersion = versions.find((v) => v.id === currentVersionId) ?? versions[0]

  // Execution state from realtime store
  const executionState = useActiveExecution(currentVersionId)
  const subscribeExecution = useRealtimeStore((s) => s.subscribeExecution)
  const clearExecution = useRealtimeStore((s) => s.clearExecution)

  // Local state
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null)
  const [executionId, setExecutionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Ref to store execution subscription cleanup function
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Load execution plan
  const loadExecutionPlan = useCallback(async () => {
    if (!currentVersionId) return

    try {
      const result = await window.api.invoke('review:getTodo', {
        versionId: currentVersionId,
      }) as IPCResult<ExecutionPlan>

      if (result.ok) {
        setExecutionPlan(result.data)
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks'
      setError(message)
    }
  }, [currentVersionId])

  // Load initial data
  useEffect(() => {
    if (currentVersionId) {
      setLoading(true)
      loadExecutionPlan().finally(() => setLoading(false))
    }
  }, [currentVersionId, loadExecutionPlan])

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [])

  // Handle start execution
  const handleStart = async () => {
    if (!currentVersionId) return

    setStarting(true)
    setError(null)

    try {
      const result = await window.api.invoke('execution:start', {
        versionId: currentVersionId,
      }) as IPCResult<Execution>

      if (result.ok) {
        setExecutionId(result.data.id)
        // Subscribe to execution events
        if (unsubscribeRef.current) {
          unsubscribeRef.current()
        }
        unsubscribeRef.current = subscribeExecution(currentVersionId, result.data.id)
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start execution'
      setError(message)
    } finally {
      setStarting(false)
    }
  }

  // Handle pause
  const handlePause = async () => {
    if (!executionId) return

    setActionLoading('pause')
    try {
      const result = await window.api.invoke('execution:pause', {
        executionId,
      }) as IPCResult<void>

      if (!result.ok) {
        setError(result.error.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pause'
      setError(message)
    } finally {
      setActionLoading(null)
    }
  }

  // Handle resume
  const handleResume = async () => {
    if (!executionId) return

    setActionLoading('resume')
    try {
      const result = await window.api.invoke('execution:resume', {
        executionId,
      }) as IPCResult<void>

      if (!result.ok) {
        setError(result.error.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume'
      setError(message)
    } finally {
      setActionLoading(null)
    }
  }

  // Handle abort
  const handleAbort = async () => {
    if (!executionId) return

    const confirmed = window.confirm(
      'This will abort the execution and reset to the pre-execution state. Are you sure?'
    )
    if (!confirmed) return

    setActionLoading('abort')
    try {
      const result = await window.api.invoke('execution:abort', {
        executionId,
      }) as IPCResult<void>

      if (result.ok) {
        // Clean up subscription
        if (unsubscribeRef.current) {
          unsubscribeRef.current()
          unsubscribeRef.current = null
        }
        clearExecution(executionId)
        setExecutionId(null)
        // Reload the plan to show reset state
        await loadExecutionPlan()
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to abort'
      setError(message)
    } finally {
      setActionLoading(null)
    }
  }

  // Handle retry
  const handleRetry = async () => {
    if (!executionId || !executionState?.currentTaskId) return

    setActionLoading('retry')
    try {
      const result = await window.api.invoke('execution:retry', {
        executionId,
        taskId: executionState.currentTaskId,
      }) as IPCResult<void>

      if (!result.ok) {
        setError(result.error.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to retry'
      setError(message)
    } finally {
      setActionLoading(null)
    }
  }

  // Handle skip task
  const handleSkipTask = async (taskId: string) => {
    if (!executionId) return

    setActionLoading(`skip-${taskId}`)
    try {
      const result = await window.api.invoke('execution:skip', {
        executionId,
        taskId,
      }) as IPCResult<void>

      if (!result.ok) {
        setError(result.error.message)
      } else {
        // Reload plan to reflect changes
        await loadExecutionPlan()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to skip task'
      setError(message)
    } finally {
      setActionLoading(null)
    }
  }

  // Determine UI state
  const isReady = currentVersion?.devStatus === 'ready'
  const isExecuting = currentVersion?.devStatus === 'executing' || executionState?.status === 'running'
  const isPaused = executionState?.status === 'paused'
  const isCompleted = executionState?.status === 'completed'
  const hasError = executionState?.status === 'error'
  const isBlocked = isPaused && executionState?.blockedTaskIds && executionState.blockedTaskIds.length > 0

  // Loading state
  if (!currentVersion) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  // Render action buttons based on state
  const renderActions = () => {
    if (isReady && !executionId) {
      return (
        <Button
          variant="primary"
          size="sm"
          onClick={handleStart}
          loading={starting}
        >
          Start Execution
        </Button>
      )
    }

    if (isExecuting && !isPaused) {
      return (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePause}
            loading={actionLoading === 'pause'}
          >
            Pause
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAbort}
            loading={actionLoading === 'abort'}
          >
            Abort
          </Button>
        </div>
      )
    }

    if (isPaused && !hasError && !isBlocked) {
      return (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleResume}
            loading={actionLoading === 'resume'}
          >
            Resume
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAbort}
            loading={actionLoading === 'abort'}
          >
            Abort
          </Button>
        </div>
      )
    }

    if (hasError) {
      return (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleRetry}
            loading={actionLoading === 'retry'}
          >
            Retry
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => executionState?.currentTaskId && handleSkipTask(executionState.currentTaskId)}
            loading={actionLoading?.startsWith('skip-')}
          >
            Skip Task
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAbort}
            loading={actionLoading === 'abort'}
          >
            Abort
          </Button>
        </div>
      )
    }

    if (isCompleted) {
      return (
        <span className="text-sm text-green-600 font-medium">
          Execution Complete
        </span>
      )
    }

    return null
  }

  return (
    <ReviewLayout
      header={<ReviewHeader title="Execute" actions={renderActions()} />}
      statusNotice={
        !isReady && !isExecuting && !isPaused && !isCompleted ? (
          <ReviewBanner variant="warning">
            This version must be in ready state to execute. Current status: {currentVersion.devStatus}
          </ReviewBanner>
        ) : undefined
      }
      errorNotice={
        error ? <ReviewBanner variant="error">{error}</ReviewBanner> : undefined
      }
      content={
        loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress section */}
            {executionState && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <ProgressBar
                  value={executionState.progress.completed}
                  max={executionState.progress.total}
                  label="Execution Progress"
                />
                {executionState.currentTaskDescription && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Current Task: </span>
                    {executionState.currentTaskDescription}
                  </div>
                )}
              </div>
            )}

            {/* Error banner */}
            {hasError && executionState?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      Task Failed
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      {executionState.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Blocked tasks banner */}
            {isBlocked && executionState?.blockedTaskIds && (
              <BlockedTasksBanner
                blockedTaskIds={executionState.blockedTaskIds}
                onSkipTask={handleSkipTask}
                onAbort={handleAbort}
              />
            )}

            {/* Task list */}
            <TaskList
              plan={executionPlan || { milestones: [], totalTasks: 0, completedTasks: 0 }}
              currentTaskId={executionState?.currentTaskId}
            />
          </div>
        )
      }
    >
      {/* children not used; layout handled via props */}
    </ReviewLayout>
  )
}
