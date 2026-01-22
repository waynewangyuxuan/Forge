/**
 * Get Todo Use Case
 * Reads and parses TODO.md + MILESTONES/*.md into an ExecutionPlan
 */

import * as path from 'path'
import { IProjectRepository, IVersionRepository } from '@shared/interfaces/repositories'
import { IFileSystemAdapter } from '@shared/interfaces/adapters'
import { ValidationError, NotFoundError } from '@shared/errors'
import { ReviewGetTodoInput } from '@shared/types/ipc.types'
import { ExecutionPlan } from '@shared/types/execution.types'
import { parseExecutionPlan } from '../../../domain/engines/todo-parser'

export interface GetTodoDeps {
  projectRepo: IProjectRepository
  versionRepo: IVersionRepository
  fs: IFileSystemAdapter
}

/**
 * Get parsed execution plan from TODO.md and MILESTONES/*.md
 *
 * @param input - versionId
 * @param deps - repository and filesystem dependencies
 * @returns Parsed ExecutionPlan
 */
export async function getTodo(
  input: ReviewGetTodoInput,
  deps: GetTodoDeps
): Promise<ExecutionPlan> {
  const { projectRepo, versionRepo, fs } = deps

  // Validate input
  if (!input.versionId || input.versionId.trim() === '') {
    throw new ValidationError('Version ID is required', 'versionId')
  }

  // Get version
  const version = await versionRepo.findById(input.versionId)
  if (!version) {
    throw new NotFoundError('Version', input.versionId)
  }

  // Get project
  const project = await projectRepo.findById(version.projectId)
  if (!project) {
    throw new NotFoundError('Project', version.projectId)
  }

  // Read TODO.md
  const todoPath = path.join(project.path, 'META', 'TODO.md')
  let todoContent: string
  try {
    todoContent = await fs.readFile(todoPath)
  } catch {
    // No TODO.md yet - return empty plan
    return {
      milestones: [],
      totalTasks: 0,
      completedTasks: 0,
    }
  }

  // Read all MILESTONES/*.md files
  const milestonesDir = path.join(project.path, 'META', 'MILESTONES')
  let milestoneFiles: string[] = []
  try {
    milestoneFiles = await fs.readDir(milestonesDir)
  } catch {
    // No MILESTONES directory - parse TODO.md only
    milestoneFiles = []
  }

  // Read milestone file contents
  const milestoneContents: Array<{ filename: string; content: string }> = []
  for (const filename of milestoneFiles) {
    if (filename.endsWith('.md')) {
      try {
        const content = await fs.readFile(path.join(milestonesDir, filename))
        milestoneContents.push({ filename, content })
      } catch {
        // Skip files that can't be read
      }
    }
  }

  // Parse and build execution plan
  return parseExecutionPlan(todoContent, milestoneContents)
}
