/**
 * Scaffold Validator Engine
 * Validates the structure and dependencies of scaffold output
 *
 * Domain engine: Pure functions, zero I/O dependencies
 */

import type {
  ScaffoldOutput,
  ScaffoldValidationResult,
  ScaffoldValidationError,
  ScaffoldValidationErrorCode,
} from '@shared/types'

/**
 * Validate a scaffold output structure
 *
 * Checks:
 * - Required fields are present
 * - Task IDs are unique
 * - Dependencies reference valid tasks
 * - No circular dependencies
 *
 * @param scaffold - The scaffold output to validate
 * @returns Validation result with any errors
 */
export function validateScaffold(scaffold: ScaffoldOutput): ScaffoldValidationResult {
  const errors: ScaffoldValidationError[] = []

  // Validate project
  if (!scaffold.project) {
    errors.push(createError('MISSING_FIELD', 'Missing project field', 'project'))
  } else {
    if (!scaffold.project.name) {
      errors.push(createError('MISSING_FIELD', 'Missing project.name', 'project.name'))
    }
    if (!scaffold.project.description) {
      errors.push(createError('MISSING_FIELD', 'Missing project.description', 'project.description'))
    }
  }

  // Validate context
  if (!scaffold.context) {
    errors.push(createError('MISSING_FIELD', 'Missing context field', 'context'))
  } else {
    if (!scaffold.context.architecture) {
      errors.push(
        createError('MISSING_FIELD', 'Missing context.architecture', 'context.architecture')
      )
    }
    if (!scaffold.context.conventions) {
      errors.push(
        createError('MISSING_FIELD', 'Missing context.conventions', 'context.conventions')
      )
    }
  }

  // Validate milestones
  if (!scaffold.milestones || !Array.isArray(scaffold.milestones)) {
    errors.push(createError('MISSING_FIELD', 'Missing milestones array', 'milestones'))
    return { valid: false, errors }
  }

  if (scaffold.milestones.length === 0) {
    errors.push(createError('EMPTY_MILESTONES', 'Milestones array is empty', 'milestones'))
    return { valid: false, errors }
  }

  // Collect all task IDs for dependency validation
  const allTaskIds = new Set<string>()
  const taskIdToMilestone = new Map<string, string>()

  // First pass: collect task IDs and check for duplicates
  scaffold.milestones.forEach((milestone, mIndex) => {
    const mPath = `milestones[${mIndex}]`

    if (!milestone.id) {
      errors.push(createError('MISSING_FIELD', `Missing milestone id`, `${mPath}.id`))
    }
    if (!milestone.name) {
      errors.push(createError('MISSING_FIELD', `Missing milestone name`, `${mPath}.name`))
    }

    if (!milestone.tasks || !Array.isArray(milestone.tasks)) {
      errors.push(createError('MISSING_FIELD', `Missing tasks array`, `${mPath}.tasks`))
      return
    }

    if (milestone.tasks.length === 0) {
      errors.push(
        createError('EMPTY_TASKS', `Milestone ${milestone.id} has no tasks`, `${mPath}.tasks`)
      )
    }

    milestone.tasks.forEach((task, tIndex) => {
      const tPath = `${mPath}.tasks[${tIndex}]`

      if (!task.id) {
        errors.push(createError('MISSING_FIELD', `Missing task id`, `${tPath}.id`))
        return
      }

      if (allTaskIds.has(task.id)) {
        errors.push(
          createError('DUPLICATE_TASK_ID', `Duplicate task ID: ${task.id}`, tPath, task.id)
        )
      } else {
        allTaskIds.add(task.id)
        taskIdToMilestone.set(task.id, milestone.id)
      }

      if (!task.title) {
        errors.push(createError('MISSING_FIELD', `Missing task title`, `${tPath}.title`, task.id))
      }
      if (!task.description) {
        errors.push(
          createError('MISSING_FIELD', `Missing task description`, `${tPath}.description`, task.id)
        )
      }
      if (!task.verification) {
        errors.push(
          createError('MISSING_FIELD', `Missing task verification`, `${tPath}.verification`, task.id)
        )
      }
    })
  })

  // Second pass: validate dependencies
  scaffold.milestones.forEach((milestone, mIndex) => {
    if (!milestone.tasks) return

    milestone.tasks.forEach((task, tIndex) => {
      if (!task.id || !task.depends) return

      const tPath = `milestones[${mIndex}].tasks[${tIndex}]`

      for (const depId of task.depends) {
        if (!allTaskIds.has(depId)) {
          errors.push(
            createError(
              'INVALID_DEPENDENCY',
              `Task ${task.id} depends on non-existent task: ${depId}`,
              `${tPath}.depends`,
              task.id
            )
          )
        }
      }
    })
  })

  // Check for circular dependencies
  const circularErrors = detectCircularDependencies(scaffold)
  errors.push(...circularErrors)

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Detect circular dependencies in the scaffold
 */
function detectCircularDependencies(scaffold: ScaffoldOutput): ScaffoldValidationError[] {
  const errors: ScaffoldValidationError[] = []

  // Build dependency graph
  const graph = new Map<string, string[]>()
  for (const milestone of scaffold.milestones) {
    if (!milestone.tasks) continue
    for (const task of milestone.tasks) {
      if (task.id && task.depends) {
        graph.set(task.id, task.depends)
      }
    }
  }

  // DFS to detect cycles
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function hasCycle(taskId: string, path: string[]): boolean {
    if (recursionStack.has(taskId)) {
      // Found a cycle
      const cycleStart = path.indexOf(taskId)
      const cycle = path.slice(cycleStart).concat(taskId)
      errors.push(
        createError(
          'CIRCULAR_DEPENDENCY',
          `Circular dependency detected: ${cycle.join(' → ')}`,
          undefined,
          taskId
        )
      )
      return true
    }

    if (visited.has(taskId)) {
      return false
    }

    visited.add(taskId)
    recursionStack.add(taskId)

    const deps = graph.get(taskId) || []
    for (const dep of deps) {
      if (hasCycle(dep, [...path, taskId])) {
        return true
      }
    }

    recursionStack.delete(taskId)
    return false
  }

  for (const taskId of graph.keys()) {
    if (!visited.has(taskId)) {
      hasCycle(taskId, [])
    }
  }

  return errors
}

/**
 * Helper to create validation errors
 */
function createError(
  code: ScaffoldValidationErrorCode,
  message: string,
  path?: string,
  taskId?: string
): ScaffoldValidationError {
  return { code, message, path, taskId }
}

/**
 * Parse JSON string to ScaffoldOutput
 * Handles JSON wrapped in markdown code blocks
 *
 * @param input - Raw string that may contain JSON
 * @returns Parsed ScaffoldOutput or null if parsing fails
 */
export function parseScaffoldJson(input: string): ScaffoldOutput | null {
  let jsonStr = input.trim()

  // Try to extract JSON from markdown code block
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim()
  }

  try {
    return JSON.parse(jsonStr) as ScaffoldOutput
  } catch {
    return null
  }
}
