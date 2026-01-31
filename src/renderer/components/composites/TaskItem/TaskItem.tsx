/**
 * TaskItem Component
 * Displays a single task with status, dependencies, and expandable details
 */

import React, { useState } from 'react'
import type { Task } from '@shared/types/execution.types'
import { Badge } from '../../primitives/Badge'

export interface TaskItemProps {
  task: Task
  isCurrent?: boolean
}

// Status icons mapping
const statusIcons: Record<string, React.ReactNode> = {
  pending: (
    <span className="w-5 h-5 rounded-full border-2 border-stone-300 inline-flex items-center justify-center">
      <span className="sr-only">Pending</span>
    </span>
  ),
  completed: (
    <span className="w-5 h-5 rounded-full bg-green-500 text-white inline-flex items-center justify-center">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  ),
  running: (
    <span className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin inline-flex items-center justify-center">
      <span className="sr-only">Running</span>
    </span>
  ),
  failed: (
    <span className="w-5 h-5 rounded-full bg-red-500 text-white inline-flex items-center justify-center">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </span>
  ),
  skipped: (
    <span className="w-5 h-5 rounded-full bg-stone-400 text-white inline-flex items-center justify-center">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
      </svg>
    </span>
  ),
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, isCurrent = false }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasDetails = task.description || task.verification

  // Use isCurrent to highlight the current task
  const baseClasses = isCurrent
    ? 'bg-amber-50 border-l-2 border-l-amber-500'
    : ''
  const hoverClasses = hasDetails ? 'cursor-pointer hover:bg-stone-50' : ''

  return (
    <div className={`border-b border-stone-100 last:border-b-0 ${baseClasses}`}>
      {/* Main row */}
      <div
        className={`flex items-start gap-3 py-3 px-4 ${hoverClasses}`}
        onClick={hasDetails ? () => setIsExpanded(!isExpanded) : undefined}
      >
        {/* Status icon */}
        <div className="flex-shrink-0 pt-0.5">
          {statusIcons[task.status] || statusIcons.pending}
        </div>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-stone-400">{task.id}.</span>
            <span className={`text-sm ${task.status === 'completed' ? 'text-stone-500 line-through' : 'text-stone-900'}`}>
              {task.title}
            </span>
          </div>

          {/* Dependencies */}
          {task.depends.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-stone-400">Depends:</span>
              {task.depends.map((dep) => (
                <Badge key={dep} variant="default" size="sm">
                  {dep}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Expand indicator */}
        {hasDetails && (
          <div className="flex-shrink-0">
            <svg
              className={`w-4 h-4 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && hasDetails && (
        <div className="px-4 pb-3 pl-12 space-y-2 bg-stone-50">
          {task.description && (
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-stone-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
          {task.verification && (
            <div>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Verification</p>
              <p className="text-sm text-stone-700 whitespace-pre-wrap">{task.verification}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
