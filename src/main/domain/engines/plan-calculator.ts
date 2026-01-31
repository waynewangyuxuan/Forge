/**
 * Plan Calculator Engine
 * Pure functions for calculating next task, progress, and blocked tasks
 *
 * Key design decisions:
 * - Skip does NOT satisfy dependencies (only 'completed' does)
 * - Dependencies must be within the plan
 */

import type { ExecutionPlan, Milestone, Task, TaskStatus } from '@shared/types/execution.types'

/**
 * Result of getting the next task to execute
 */
export interface NextTaskResult {
  task: Task | null
  milestone: Milestone | null
  reason: 'task_found' | 'all_completed' | 'blocked' | 'no_pending'
  blockedBy?: string[] // Task IDs blocking this one
}

/**
 * Progress information for an execution plan
 */
export interface PlanProgress {
  completed: number
  total: number
  percent: number
}

/**
 * A blocked task with its blocking dependencies
 */
export interface BlockedTask {
  task: Task
  blockedBy: string[]
}

/**
 * Check if a task's dependencies are all satisfied
 * Only 'completed' status satisfies dependencies (not 'skipped')
 *
 * @param task - The task to check
 * @param allTasks - All tasks in the plan (for looking up dependency statuses)
 * @returns Array of unsatisfied dependency task IDs (empty if all satisfied)
 */
function getUnsatisfiedDependencies(task: Task, allTasks: Map<string, Task>): string[] {
  const unsatisfied: string[] = []

  for (const depId of task.depends) {
    const depTask = allTasks.get(depId)
    // Dependency is unsatisfied if:
    // - Task doesn't exist in plan (shouldn't happen but defensive)
    // - Task is not 'completed' (pending, running, failed, skipped all block)
    if (!depTask || depTask.status !== 'completed') {
      unsatisfied.push(depId)
    }
  }

  return unsatisfied
}

/**
 * Build a map of all tasks in the plan keyed by task ID
 */
function buildTaskMap(plan: ExecutionPlan): Map<string, Task> {
  const map = new Map<string, Task>()
  for (const milestone of plan.milestones) {
    for (const task of milestone.tasks) {
      map.set(task.id, task)
    }
  }
  return map
}

/**
 * Get the next task to execute from an execution plan
 *
 * Selection logic:
 * 1. Find first pending task with all dependencies satisfied
 * 2. If no pending tasks with satisfied deps, check if all are complete
 * 3. If pending tasks exist but all blocked, return blocked status
 *
 * @param plan - The execution plan
 * @returns Next task result with reason
 */
export function getNextTask(plan: ExecutionPlan): NextTaskResult {
  const taskMap = buildTaskMap(plan)
  const pendingTasks: Array<{ task: Task; milestone: Milestone }> = []

  // Collect all pending tasks
  for (const milestone of plan.milestones) {
    for (const task of milestone.tasks) {
      if (task.status === 'pending') {
        pendingTasks.push({ task, milestone })
      }
    }
  }

  // No pending tasks
  if (pendingTasks.length === 0) {
    // Check if truly all completed
    const allTasksCompleted = plan.milestones.every((m) =>
      m.tasks.every((t) => t.status === 'completed' || t.status === 'skipped')
    )

    return {
      task: null,
      milestone: null,
      reason: allTasksCompleted ? 'all_completed' : 'no_pending',
    }
  }

  // Find first pending task with satisfied dependencies
  for (const { task, milestone } of pendingTasks) {
    const unsatisfied = getUnsatisfiedDependencies(task, taskMap)

    if (unsatisfied.length === 0) {
      return {
        task,
        milestone,
        reason: 'task_found',
      }
    }
  }

  // All pending tasks are blocked
  // Find the first blocked task to report its blockers
  const firstPending = pendingTasks[0]
  const blockedBy = getUnsatisfiedDependencies(firstPending.task, taskMap)

  return {
    task: firstPending.task,
    milestone: firstPending.milestone,
    reason: 'blocked',
    blockedBy,
  }
}

/**
 * Calculate progress for an execution plan
 *
 * @param plan - The execution plan
 * @returns Progress with completed, total, and percent
 */
export function getProgress(plan: ExecutionPlan): PlanProgress {
  let completed = 0
  let total = 0

  for (const milestone of plan.milestones) {
    for (const task of milestone.tasks) {
      total++
      // Count completed and skipped as "done" for progress purposes
      if (task.status === 'completed' || task.status === 'skipped') {
        completed++
      }
    }
  }

  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

/**
 * Check if all tasks in the plan are completed (or skipped)
 *
 * @param plan - The execution plan
 * @returns true if all tasks are done
 */
export function isAllCompleted(plan: ExecutionPlan): boolean {
  for (const milestone of plan.milestones) {
    for (const task of milestone.tasks) {
      if (task.status !== 'completed' && task.status !== 'skipped') {
        return false
      }
    }
  }
  return true
}

/**
 * Get all blocked tasks with their blocking dependencies
 *
 * @param plan - The execution plan
 * @returns Array of blocked tasks with their blockers
 */
export function getBlockedTasks(plan: ExecutionPlan): BlockedTask[] {
  const taskMap = buildTaskMap(plan)
  const blocked: BlockedTask[] = []

  for (const milestone of plan.milestones) {
    for (const task of milestone.tasks) {
      if (task.status === 'pending') {
        const unsatisfied = getUnsatisfiedDependencies(task, taskMap)
        if (unsatisfied.length > 0) {
          blocked.push({
            task,
            blockedBy: unsatisfied,
          })
        }
      }
    }
  }

  return blocked
}

/**
 * Find a task by ID in the execution plan
 *
 * @param plan - The execution plan
 * @param taskId - The task ID to find
 * @returns Task and its milestone, or null if not found
 */
export function findTaskById(
  plan: ExecutionPlan,
  taskId: string
): { task: Task; milestone: Milestone } | null {
  for (const milestone of plan.milestones) {
    for (const task of milestone.tasks) {
      if (task.id === taskId) {
        return { task, milestone }
      }
    }
  }
  return null
}

/**
 * Update a task's status in the plan (returns new plan, doesn't mutate)
 *
 * @param plan - The execution plan
 * @param taskId - The task ID to update
 * @param status - The new status
 * @returns New plan with updated task
 */
export function updateTaskStatus(
  plan: ExecutionPlan,
  taskId: string,
  status: TaskStatus
): ExecutionPlan {
  let completedDelta = 0

  const newMilestones = plan.milestones.map((milestone) => {
    const newTasks = milestone.tasks.map((task) => {
      if (task.id === taskId) {
        // Calculate completed delta
        const wasCompleted = task.status === 'completed' || task.status === 'skipped'
        const isCompleted = status === 'completed' || status === 'skipped'
        if (wasCompleted && !isCompleted) completedDelta--
        if (!wasCompleted && isCompleted) completedDelta++

        return { ...task, status }
      }
      return task
    })

    // Recalculate milestone counts
    const completedCount = newTasks.filter(
      (t) => t.status === 'completed' || t.status === 'skipped'
    ).length

    return {
      ...milestone,
      tasks: newTasks,
      completedCount,
    }
  })

  return {
    milestones: newMilestones,
    totalTasks: plan.totalTasks,
    completedTasks: plan.completedTasks + completedDelta,
  }
}
