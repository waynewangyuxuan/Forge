/**
 * StaleExecutionModal Component
 * Shows on app startup when there are unfinished executions from a previous session
 */

import React, { useState } from 'react'
import { Modal } from '../../primitives/Modal'
import { Button } from '../../primitives/Button'
import type { Execution } from '@shared/types/execution.types'

export interface StaleExecutionModalProps {
  executions: Execution[]
  onResume: (executionId: string) => Promise<void>
  onAbort: (executionId: string) => Promise<void>
  onDismiss: (executionId: string) => void
}

export const StaleExecutionModal: React.FC<StaleExecutionModalProps> = ({
  executions,
  onResume,
  onAbort,
  onDismiss,
}) => {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Show modal only if there are stale executions
  if (executions.length === 0) return null

  // Show first stale execution (handle one at a time)
  const execution = executions[0]

  const handleResume = async () => {
    setLoading('resume')
    setError(null)
    try {
      await onResume(execution.id)
      onDismiss(execution.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume')
    } finally {
      setLoading(null)
    }
  }

  const handleAbort = async () => {
    setLoading('abort')
    setError(null)
    try {
      await onAbort(execution.id)
      onDismiss(execution.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to abort')
    } finally {
      setLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  return (
    <Modal
      open={true}
      onClose={() => {}} // Can't close without action
      title="Unfinished Execution Detected"
      width="md"
      footer={
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleResume}
            loading={loading === 'resume'}
            disabled={loading !== null}
          >
            Resume Execution
          </Button>
          <Button
            variant="secondary"
            onClick={handleAbort}
            loading={loading === 'abort'}
            disabled={loading !== null}
          >
            Abort & Reset
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          A previous execution was interrupted. Would you like to resume where it
          left off or abort and reset?
        </p>

        {/* Execution details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Started:</span>
            <span className="text-gray-700">{formatDate(execution.startedAt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Progress:</span>
            <span className="text-gray-700">
              {execution.completedTasks} / {execution.totalTasks} tasks
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status:</span>
            <span className="text-gray-700 capitalize">{execution.status}</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Warning about abort */}
        <p className="text-xs text-gray-500">
          Note: Aborting will reset the project to its pre-execution state,
          discarding any code generated during this execution.
        </p>
      </div>
    </Modal>
  )
}
