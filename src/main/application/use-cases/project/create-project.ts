/**
 * Create Project Use Case
 * GitHub-first: Creates GitHub repo, clones locally, sets up project structure
 */

import { Project, CreateProjectInput } from '@shared/types/project.types'
import { Version } from '@shared/types/project.types'
import { DevStatus, RuntimeStatus } from '@shared/constants'
import { IProjectRepository, IVersionRepository } from '@shared/interfaces/repositories'
import { IFileSystemAdapter, IGitHubAdapter } from '@shared/interfaces/adapters'
import { Settings } from '@shared/types/runtime.types'
import {
  ValidationError,
  GitHubNotAuthenticatedError,
  GitHubCLINotFoundError,
} from '@shared/errors'
import { join } from 'node:path'
import { homedir } from 'node:os'

export interface CreateProjectDeps {
  projectRepo: IProjectRepository
  versionRepo: IVersionRepository
  fs: IFileSystemAdapter
  github: IGitHubAdapter
  getSettings: () => Promise<Settings>
}

export interface CreateProjectResult {
  project: Project
  version: Version
}

/**
 * Expand ~ to home directory
 */
function expandPath(p: string): string {
  if (p.startsWith('~/')) {
    return join(homedir(), p.slice(2))
  }
  return p
}

/**
 * Creates a new project with GitHub-first workflow
 *
 * 1. Validates input (name)
 * 2. Checks GitHub CLI available and authenticated
 * 3. Creates GitHub repository
 * 4. Clones to local path (cloneRoot + name)
 * 5. Creates META/CORE directory structure
 * 6. Creates project in database with GitHub info
 * 7. Creates v1.0 version
 */
export async function createProject(
  input: CreateProjectInput,
  deps: CreateProjectDeps
): Promise<CreateProjectResult> {
  const { projectRepo, versionRepo, fs, github, getSettings } = deps

  // 1. Validate input
  if (!input.name || input.name.trim() === '') {
    throw new ValidationError('Project name is required', 'name')
  }

  const name = input.name.trim()

  // Validate name is a valid repo name (alphanumeric, hyphens, underscores)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name)) {
    throw new ValidationError(
      'Project name must start with a letter or number and contain only letters, numbers, hyphens, and underscores',
      'name'
    )
  }

  // 2. Check GitHub CLI available and authenticated
  const ghAvailable = await github.isAvailable()
  if (!ghAvailable) {
    throw new GitHubCLINotFoundError()
  }

  const authStatus = await github.checkAuth()
  if (!authStatus.authenticated || !authStatus.user) {
    throw new GitHubNotAuthenticatedError()
  }

  const owner = authStatus.user.login

  // 3. Get settings for clone root
  const settings = await getSettings()
  const cloneRoot = expandPath(settings.cloneRoot)
  const projectPath = join(cloneRoot, name)

  // Check if path already exists
  const pathExists = await fs.exists(projectPath)
  if (pathExists) {
    throw new ValidationError(
      `Directory already exists: ${projectPath}. Choose a different project name.`,
      'name'
    )
  }

  // Ensure clone root exists
  await fs.createDir(cloneRoot, true)

  // 4. Create GitHub repository
  const repo = await github.createRepo(name, {
    description: input.description,
    private: input.private ?? false,
  })

  // 5. Clone to local path
  await github.cloneRepo(owner, name, projectPath)

  // 6. Create META/CORE directory structure
  await fs.createDir(join(projectPath, 'META', 'CORE'), true)

  // Create placeholder files
  await fs.writeFile(
    join(projectPath, 'META', 'CORE', 'PRODUCT.md'),
    `# ${name}\n\n## What\n\nDescribe what this project does.\n\n## Why\n\nExplain why this project is needed.\n`
  )

  await fs.writeFile(
    join(projectPath, 'META', 'CORE', 'TECHNICAL.md'),
    `# Technical Specification\n\n## Stack\n\n- Language: \n- Framework: \n\n## Architecture\n\nDescribe the technical architecture.\n`
  )

  await fs.writeFile(
    join(projectPath, 'META', 'CORE', 'REGULATION.md'),
    `# Development Regulations\n\n## Code Style\n\n- Follow consistent naming conventions\n- Write clear comments\n\n## Testing\n\n- Write tests for critical functionality\n`
  )

  // 7. Create project in database with GitHub info
  const project = await projectRepo.create({
    name,
    path: projectPath,
    githubRepo: repo.name,
    githubOwner: owner,
  })

  // 8. Create initial version (v1.0)
  const version = await versionRepo.create({
    projectId: project.id,
    versionName: 'v1.0',
    branchName: 'main',
    devStatus: 'drafting' as DevStatus,
    runtimeStatus: 'not_configured' as RuntimeStatus,
  })

  return { project, version }
}
