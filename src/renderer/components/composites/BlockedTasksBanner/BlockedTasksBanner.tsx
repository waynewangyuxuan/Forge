/**
 * BlockedTasksBanner Component
 * Displays when execution is blocked by dependencies
 */

import React from 'react'
import { Button } from '../../primitives/Button'

export interface BlockedTasksBannerProps {
  blockedTaskIds: string[]
  onSkipTask: (taskId: string) => void
  onAbort: () => void
  className?: string
}

export const BlockedTasksBanner: React.FC<BlockedTasksBannerProps> = ({
  blockedTaskIds,
  onSkipTask,
  onAbort,
  className = '',
}) => {
  if (blockedTaskIds.length === 0) return null

  return (
    <div
      className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Warning icon */}
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className="h-5 w-5 text-amber-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            Execution Blocked
          </h3>
          <p className="mt-1 text-sm text-amber-700">
            The following tasks are blocked by unmet dependencies. You can skip
            them to continue execution.
          </p>

          {/* Blocked task list */}
          <div className="mt-3 flex flex-wrap gap-2">
            {blockedTaskIds.map((taskId) => (
              <div
                key={taskId}
                className="inline-flex items-center gap-1.5 bg-white border border-amber-200 rounded-md px-2 py-1"
              >
                <span className="text-xs font-mono text-gray-700">
                  {taskId}
                </span>
                <button
                  onClick={() => onSkipTask(taskId)}
                  className="text-amber-600 hover:text-amber-800 text-xs font-medium"
                >
                  Skip
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" size="sm" onClick={onAbort}>
              Abort Execution
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
