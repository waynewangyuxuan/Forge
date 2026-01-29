/**
 * TaskList Component
 * Displays tasks grouped by milestone with progress indicators
 */

import React from 'react'
import type { ExecutionPlan, Milestone } from '@shared/types/execution.types'
import { TaskItem } from '../TaskItem'
import { Badge } from '../../primitives/Badge'

export interface TaskListProps {
  plan: ExecutionPlan
}

interface MilestoneGroupProps {
  milestone: Milestone
}

const MilestoneGroup: React.FC<MilestoneGroupProps> = ({ milestone }) => {
  const progressPercent = milestone.totalCount > 0
    ? Math.round((milestone.completedCount / milestone.totalCount) * 100)
    : 0

  return (
    <div className="mb-6 last:mb-0">
      {/* Milestone Header */}
      <div className="flex items-center justify-between mb-2 px-4 py-2 bg-stone-100 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="font-medium text-stone-700">{milestone.id}:</span>
          <span className="text-stone-600">{milestone.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={progressPercent === 100 ? 'success' : progressPercent > 0 ? 'info' : 'default'}
            size="sm"
          >
            {milestone.completedCount}/{milestone.totalCount}
          </Badge>
          <div className="w-16 h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Milestone Description */}
      {milestone.description && (
        <p className="text-sm text-stone-500 px-4 py-2 border-l border-r border-stone-200">
          {milestone.description}
        </p>
      )}

      {/* Tasks */}
      <div className="border border-stone-200 rounded-b-lg overflow-hidden">
        {milestone.tasks.length > 0 ? (
          milestone.tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))
        ) : (
          <p className="text-sm text-stone-400 text-center py-4">No tasks in this milestone</p>
        )}
      </div>
    </div>
  )
}

export const TaskList: React.FC<TaskListProps> = ({ plan }) => {
  if (!plan.milestones || plan.milestones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-stone-500">
        <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-lg font-medium">No tasks yet</p>
        <p className="text-sm">Generate a scaffold to create your task list</p>
      </div>
    )
  }

  return (
    <div>
      {/* Overall Progress */}
      <div className="flex items-center justify-between mb-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
        <div>
          <p className="text-sm font-medium text-stone-700">Overall Progress</p>
          <p className="text-xs text-stone-500 mt-0.5">
            {plan.completedTasks} of {plan.totalTasks} tasks completed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-stone-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                plan.completedTasks === plan.totalTasks ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{
                width: `${plan.totalTasks > 0 ? (plan.completedTasks / plan.totalTasks) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="text-sm font-medium text-stone-600">
            {plan.totalTasks > 0 ? Math.round((plan.completedTasks / plan.totalTasks) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Milestones */}
      {plan.milestones.map((milestone) => (
        <MilestoneGroup key={milestone.id} milestone={milestone} />
      ))}
    </div>
  )
}
