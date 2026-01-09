/**
 * Create Project Use Case
 * Orchestrates project creation: validates input, creates directory structure, saves to DB
 */

import { Project, CreateProjectInput } from '@shared/types/project.types'
import { Version } from '@shared/types/project.types'
import { DevStatus, RuntimeStatus } from '@shared/constants'
import { IProjectRepository, IVersionRepository } from '@shared/interfaces/repositories'
import { IFileSystemAdapter } from '@shared/interfaces/adapters'
import { ValidationError, DuplicateError } from '@shared/errors'

export interface CreateProjectDeps {
  projectRepo: IProjectRepository
  versionRepo: IVersionRepository
  fs: IFileSystemAdapter
}

export interface CreateProjectResult {
  project: Project
  version: Version
}

/**
 * Creates a new project with directory structure and initial version
 *
 * 1. Validates input (name, path)
 * 2. Checks path doesn't exist or is empty
 * 3. Creates META/CORE directory structure
 * 4. Creates project in database
 * 5. Creates v1.0 version
 */
export async function createProject(
  input: CreateProjectInput,
  deps: CreateProjectDeps
): Promise<CreateProjectResult> {
  const { projectRepo, versionRepo, fs } = deps

  // 1. Validate input
  if (!input.name || input.name.trim() === '') {
    throw new ValidationError('Project name is required', 'name')
  }

  if (!input.path || input.path.trim() === '') {
    throw new ValidationError('Project path is required', 'path')
  }

  const name = input.name.trim()
  const path = input.path.trim()

  // 2. Check if project with same path already exists in DB
  const existingProject = await projectRepo.findByPath(path)
  if (existingProject) {
    throw new DuplicateError('Project', 'path')
  }

  // 3. Check if directory exists and is not empty
  const pathExists = await fs.exists(path)
  if (pathExists) {
    const isDir = await fs.isDirectory(path)
    if (!isDir) {
      throw new ValidationError('Path exists but is not a directory', 'path')
    }

    // Check if directory is empty (allow creating project in empty dir)
    const contents = await fs.readDir(path)
    if (contents.length > 0) {
      throw new ValidationError(
        'Directory is not empty. Please choose an empty directory or new path.',
        'path'
      )
    }
  }

  // 4. Create directory structure
  // META/CORE/ is where user writes specs
  await fs.createDir(`${path}/META/CORE`, true)

  // Create placeholder files
  await fs.writeFile(
    `${path}/META/CORE/PRODUCT.md`,
    `# ${name}\n\n## What\n\nDescribe what this project does.\n\n## Why\n\nExplain why this project is needed.\n`
  )

  await fs.writeFile(
    `${path}/META/CORE/TECHNICAL.md`,
    `# Technical Specification\n\n## Stack\n\n- Language: \n- Framework: \n\n## Architecture\n\nDescribe the technical architecture.\n`
  )

  await fs.writeFile(
    `${path}/META/CORE/REGULATION.md`,
    `# Development Regulations\n\n## Code Style\n\n- Follow consistent naming conventions\n- Write clear comments\n\n## Testing\n\n- Write tests for critical functionality\n`
  )

  // 5. Create project in database
  // Note: githubRepo and githubOwner will be set when GitHub integration is added (Section 6)
  const project = await projectRepo.create({ name, path, githubRepo: null, githubOwner: null })

  // 6. Create initial version (v1.0)
  const version = await versionRepo.create({
    projectId: project.id,
    versionName: 'v1.0',
    branchName: 'main',
    devStatus: 'drafting' as DevStatus,
    runtimeStatus: 'not_configured' as RuntimeStatus,
  })

  return { project, version }
}
