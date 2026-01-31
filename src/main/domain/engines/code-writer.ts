/**
 * Code Writer Engine
 * Validates and writes Claude's structured output to disk
 *
 * Key safety rules:
 * - Only write to paths within project directory
 * - Validate file paths (no '..', no absolute paths)
 * - Create parent directories if needed
 * - Atomic write: write to temp file, then rename
 */

import * as path from 'path'
import type { TaskOutput } from '@shared/types/execution.types'
import type { IFileSystemAdapter } from '@shared/interfaces/adapters'

/**
 * Result of validating a task output
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Result of writing task output to disk
 */
export interface WriteResult {
  success: boolean
  filesWritten: string[]
  errors: Array<{ path: string; error: string }>
}

/**
 * Extract JSON from Claude's response
 * Claude may return JSON in a code block or raw
 *
 * @param response - Claude's raw response string
 * @returns Parsed TaskOutput or null if not valid JSON
 */
export function extractTaskOutputJson(response: string): TaskOutput | null {
  // Try to find JSON in a code block first
  const codeBlockMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  const jsonString = codeBlockMatch ? codeBlockMatch[1].trim() : response.trim()

  try {
    const parsed = JSON.parse(jsonString)

    // Validate basic structure
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.taskId !== 'string' ||
      !Array.isArray(parsed.files) ||
      typeof parsed.summary !== 'string'
    ) {
      return null
    }

    // Validate each file change
    for (const file of parsed.files) {
      if (
        typeof file !== 'object' ||
        file === null ||
        typeof file.path !== 'string' ||
        !['create', 'update', 'delete'].includes(file.action)
      ) {
        return null
      }

      // Content required for create/update
      if (
        (file.action === 'create' || file.action === 'update') &&
        typeof file.content !== 'string'
      ) {
        return null
      }
    }

    return parsed as TaskOutput
  } catch {
    return null
  }
}

/**
 * Validate a file path for safety
 *
 * @param filePath - The path to validate
 * @returns Array of validation errors (empty if valid)
 */
function validateFilePath(filePath: string): string[] {
  const errors: string[] = []

  // Check for absolute paths
  if (path.isAbsolute(filePath)) {
    errors.push(`Absolute path not allowed: ${filePath}`)
  }

  // Check for path traversal
  if (filePath.includes('..')) {
    errors.push(`Path traversal not allowed: ${filePath}`)
  }

  // Normalize and check if it escapes root
  const normalized = path.normalize(filePath)
  if (normalized.startsWith('..') || normalized.startsWith('/')) {
    errors.push(`Path escapes project root: ${filePath}`)
  }

  // Check for invalid characters (control characters 0x00-0x1f)
  for (const char of filePath) {
    const code = char.charCodeAt(0)
    if (code >= 0 && code <= 31) {
      errors.push(`Invalid control character in path: ${filePath}`)
      break
    }
  }

  return errors
}

/**
 * Validate task output structure and paths
 *
 * @param output - The task output to validate
 * @returns Validation result
 */
export function validateTaskOutput(output: TaskOutput): ValidationResult {
  const errors: string[] = []

  // Validate task ID
  if (!output.taskId || output.taskId.trim() === '') {
    errors.push('Missing or empty taskId')
  }

  // Validate files array
  if (!output.files || !Array.isArray(output.files)) {
    errors.push('Missing or invalid files array')
    return { valid: false, errors }
  }

  // Validate each file
  for (const file of output.files) {
    // Validate path
    const pathErrors = validateFilePath(file.path)
    errors.push(...pathErrors)

    // Validate action
    if (!['create', 'update', 'delete'].includes(file.action)) {
      errors.push(`Invalid action "${file.action}" for file: ${file.path}`)
    }

    // Content required for create/update
    if (
      (file.action === 'create' || file.action === 'update') &&
      (typeof file.content !== 'string' || file.content.trim() === '')
    ) {
      errors.push(`Missing or empty content for ${file.action}: ${file.path}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Write a single file atomically
 * Writes to a temp file first, then renames
 *
 * @param fs - File system adapter
 * @param filePath - Full path to write to
 * @param content - Content to write
 */
async function writeFileAtomic(
  fs: IFileSystemAdapter,
  filePath: string,
  content: string
): Promise<void> {
  const dir = path.dirname(filePath)
  const tempPath = `${filePath}.tmp.${Date.now()}`

  // Ensure directory exists
  await fs.createDir(dir, true)

  // Write to temp file
  await fs.writeFile(tempPath, content)

  // Atomic rename
  await fs.rename(tempPath, filePath)
}

/**
 * Write task output files to disk
 *
 * @param output - The validated task output
 * @param projectPath - Root path of the project
 * @param fs - File system adapter
 * @returns Write result
 */
export async function writeTaskOutput(
  output: TaskOutput,
  projectPath: string,
  fs: IFileSystemAdapter
): Promise<WriteResult> {
  const filesWritten: string[] = []
  const errors: Array<{ path: string; error: string }> = []

  for (const file of output.files) {
    const fullPath = path.join(projectPath, file.path)

    try {
      switch (file.action) {
        case 'create':
        case 'update':
          await writeFileAtomic(fs, fullPath, file.content!)
          filesWritten.push(file.path)
          break

        case 'delete':
          if (await fs.exists(fullPath)) {
            await fs.remove(fullPath)
          }
          filesWritten.push(file.path)
          break
      }
    } catch (error) {
      errors.push({
        path: file.path,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    success: errors.length === 0,
    filesWritten,
    errors,
  }
}

/**
 * Update TODO.md to mark a task as completed
 *
 * @param content - Current TODO.md content
 * @param taskId - Task ID to mark (e.g., "001")
 * @param status - Status to set ('completed' marks [x], 'skipped' marks [~])
 * @returns Updated content
 */
export function updateTodoTaskStatus(
  content: string,
  taskId: string,
  status: 'completed' | 'skipped'
): string {
  // Match task line: - [ ] 001. or - [x] 001. or - [~] 001.
  const taskRegex = new RegExp(`^(\\s*-\\s*\\[)[ xX~](\\]\\s*${taskId}\\.)`, 'gm')
  const checkMark = status === 'completed' ? 'x' : '~'

  return content.replace(taskRegex, `$1${checkMark}$2`)
}

/**
 * Atomically update TODO.md task status
 *
 * @param fs - File system adapter
 * @param todoPath - Path to TODO.md
 * @param taskId - Task ID to update
 * @param status - Status to set
 */
export async function atomicUpdateTodoStatus(
  fs: IFileSystemAdapter,
  todoPath: string,
  taskId: string,
  status: 'completed' | 'skipped'
): Promise<void> {
  const content = await fs.readFile(todoPath)
  const updated = updateTodoTaskStatus(content, taskId, status)

  // Write atomically
  const tempPath = `${todoPath}.tmp.${Date.now()}`
  await fs.writeFile(tempPath, updated)
  await fs.rename(tempPath, todoPath)
}
