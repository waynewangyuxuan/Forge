/**
 * Git Operations Engine
 * Pure domain logic for executing git hooks based on configuration
 *
 * Domain engine: Coordinates git operations, no direct I/O
 * Dependencies (IGitAdapter, config) are injected
 */

import type { IGitAdapter, GitHookResult } from '@shared/interfaces/adapters'
import type { PushStrategy } from '@shared/types/runtime.types'
import type { GitHookConfig } from '../../infrastructure/config-loader/yaml-config-loader'
import { renderPrompt } from './prompt-renderer'

/**
 * Context for git hook execution - template variables
 */
export interface GitHookContext {
  projectPath: string
  versionName?: string
  milestoneName?: string
  projectName?: string
}

/**
 * Options for hook execution
 *
 * Note: commitEnabled and pushStrategy are passed as flags (not settings object)
 * so the caller can derive them from the appropriate setting for their use case.
 * e.g., scaffold uses commitOnScaffold, execute_milestone uses autoCommitOnMilestone
 */
export interface ExecuteGitHookOptions {
  hookDefinition: GitHookConfig
  context: GitHookContext
  commitEnabled: boolean // Caller-derived from appropriate setting
  pushStrategy: PushStrategy // From settings, with backward compat fallback
  git: IGitAdapter
}

/**
 * Execute a git hook based on configuration
 *
 * This is a pure orchestration function - it doesn't load config or access I/O directly.
 * All dependencies are injected.
 *
 * @param options - Hook definition, context, settings, and git adapter
 * @returns Result with success status, commit hash, and push status
 */
export async function executeGitHook(
  options: ExecuteGitHookOptions
): Promise<GitHookResult> {
  const { hookDefinition, context, commitEnabled, pushStrategy, git } = options

  // Check if hook is enabled in configuration
  if (!hookDefinition.enabled) {
    return {
      success: true,
      skipped: true,
      skippedReason: 'Hook is disabled in configuration',
    }
  }

  // Check if git operations are enabled (caller-derived from appropriate setting)
  if (!commitEnabled) {
    return {
      success: true,
      skipped: true,
      skippedReason: 'Auto-commit disabled in settings',
    }
  }

  const { projectPath } = context

  try {
    // Check if repo exists
    const isRepo = await git.isRepo(projectPath)
    if (!isRepo) {
      return {
        success: true,
        skipped: true,
        skippedReason: 'Not a git repository',
      }
    }

    // Get current status
    const status = await git.status(projectPath)

    // Check if there are changes to commit (including deleted files)
    const hasChanges =
      status.staged.length > 0 ||
      status.unstaged.length > 0 ||
      status.untracked.length > 0 ||
      status.deleted.length > 0

    if (!hasChanges) {
      return {
        success: true,
        skipped: true,
        skippedReason: 'No changes to commit',
      }
    }

    // Stage files based on config
    const filesToStage = hookDefinition.commit.files
    if (filesToStage.includes('.')) {
      // Stage all changes
      await git.add(projectPath, ['.'])
    } else {
      // Stage specific paths
      await git.add(projectPath, filesToStage)
    }

    // Render commit message with template variables
    const commitMessage = renderCommitMessage(hookDefinition.commit.message, context)

    // Create commit
    const commitHash = await git.commit(projectPath, commitMessage)

    // Determine push behavior
    const shouldPush = determineShouldPush(hookDefinition.push.strategy, pushStrategy)

    let pushed = false
    let pushFailed = false
    let pushError: string | undefined
    if (shouldPush) {
      const hasRemote = await git.hasRemote(projectPath)
      if (hasRemote) {
        try {
          await git.push(projectPath)
          pushed = true
        } catch (error) {
          // Push failure is non-fatal - commit still succeeds
          // But we surface the failure to the caller for UI feedback
          pushFailed = true
          pushError = (error as Error).message
          console.warn('Git push failed:', error)
        }
      }
    }

    return {
      success: true,
      commitHash,
      pushed,
      pushFailed,
      pushError,
    }
  } catch (error) {
    // Git errors are non-fatal to scaffold generation
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}

/**
 * Render commit message with template variables
 */
function renderCommitMessage(template: string, context: GitHookContext): string {
  return renderPrompt(template, {
    version_name: context.versionName,
    milestone_name: context.milestoneName,
    project_name: context.projectName,
  })
}

/**
 * Determine if push should be executed
 * Priority: Settings pushStrategy → Hook config strategy
 *
 * @param configStrategy - Strategy from hook config (git-operations.yaml)
 * @param settingsPushStrategy - Strategy from user settings
 */
function determineShouldPush(
  configStrategy: 'auto' | 'manual' | 'disabled',
  settingsPushStrategy: PushStrategy
): boolean {
  // Settings "disabled" overrides everything - never push
  if (settingsPushStrategy === 'disabled') {
    return false
  }

  // Settings "manual" - user wants to push manually
  if (settingsPushStrategy === 'manual') {
    return false
  }

  // Settings is "auto" - respect hook config
  if (configStrategy === 'disabled') {
    return false
  }
  if (configStrategy === 'manual') {
    return false
  }

  // Both settings and config are auto
  return true
}

/**
 * Validate hook definition structure
 */
export function validateHookDefinition(hook: unknown): hook is GitHookConfig {
  if (!hook || typeof hook !== 'object') return false

  const h = hook as Record<string, unknown>

  if (typeof h.enabled !== 'boolean') return false
  if (!h.commit || typeof h.commit !== 'object') return false
  if (!h.push || typeof h.push !== 'object') return false

  const commit = h.commit as Record<string, unknown>
  if (typeof commit.message !== 'string') return false
  if (!Array.isArray(commit.files)) return false

  const push = h.push as Record<string, unknown>
  if (!['auto', 'manual', 'disabled'].includes(push.strategy as string)) return false

  return true
}
