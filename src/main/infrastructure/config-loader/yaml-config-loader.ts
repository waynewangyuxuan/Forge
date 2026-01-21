/**
 * YAML Config Loader
 * Loads and caches configuration from YAML files
 */

import { parse } from 'yaml'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

/**
 * State machine transition definition
 */
export interface StateTransition {
  event: string
  from: string | string[]
  to: string
}

/**
 * State machine configuration
 */
export interface StateMachineConfig {
  name: string
  initialState: string
  states: string[]
  transitions: StateTransition[]
}

/**
 * Execution configuration
 */
export interface ExecutionConfig {
  defaultCommitStrategy: 'each_task' | 'each_milestone' | 'manual'
  taskTimeout: number // seconds
  maxRetries: number
}

/**
 * Prompt variable definition
 */
export interface PromptVariable {
  name: string
  required: boolean
  description: string
}

/**
 * Prompt configuration
 */
export interface PromptConfig {
  name: string
  version: string
  description: string
  variables: PromptVariable[]
  template: string
}

/**
 * Git hook commit configuration
 */
export interface GitHookCommitConfig {
  message: string
  files: string[]
}

/**
 * Git hook push configuration
 */
export interface GitHookPushConfig {
  strategy: 'auto' | 'manual' | 'disabled'
}

/**
 * Git hook configuration
 */
export interface GitHookConfig {
  enabled: boolean
  commit: GitHookCommitConfig
  push: GitHookPushConfig
}

/**
 * Git hooks defaults
 */
export interface GitHooksDefaults {
  pushStrategy: 'auto' | 'manual' | 'disabled'
  stageAll: boolean
  // Note: commitAuthor removed - git uses user's global config
}

/**
 * Git hooks configuration file structure
 */
export interface GitHooksConfig {
  version: number
  hooks: Record<string, GitHookConfig>
  defaults: GitHooksDefaults
}

/**
 * Config cache to avoid re-reading files
 */
const configCache = new Map<string, unknown>()

/**
 * Override config directory for testing
 */
let configDirOverride: string | null = null

/**
 * Set a custom config directory (for testing)
 */
export function setConfigDir(dir: string | null): void {
  configDirOverride = dir
  clearConfigCache()
}

/**
 * Get the config directory path
 * In development: project root/config
 * In production: app resources/config
 */
function getConfigDir(): string {
  if (configDirOverride) {
    return configDirOverride
  }
  if (app.isPackaged) {
    return join(process.resourcesPath, 'config')
  }
  // Development: relative to app root
  return join(app.getAppPath(), 'config')
}

/**
 * Load a YAML file and parse it
 */
function loadYamlFile<T>(relativePath: string): T {
  const cacheKey = relativePath

  // Check cache first
  if (configCache.has(cacheKey)) {
    return configCache.get(cacheKey) as T
  }

  const fullPath = join(getConfigDir(), relativePath)

  if (!existsSync(fullPath)) {
    throw new Error(`Config file not found: ${fullPath}`)
  }

  const content = readFileSync(fullPath, 'utf-8')
  const parsed = parse(content) as T

  // Cache the result
  configCache.set(cacheKey, parsed)

  return parsed
}

/**
 * Load state machine configuration
 */
export function loadStateMachine(id: string): StateMachineConfig {
  return loadYamlFile<StateMachineConfig>(`state-machines/${id}.yaml`)
}

/**
 * Load dev flow state machine
 */
export function loadDevFlowStateMachine(): StateMachineConfig {
  return loadStateMachine('dev-flow')
}

/**
 * Load runtime flow state machine
 */
export function loadRuntimeFlowStateMachine(): StateMachineConfig {
  return loadStateMachine('runtime-flow')
}

/**
 * Load execution configuration
 */
export function loadExecutionConfig(): ExecutionConfig {
  return loadYamlFile<ExecutionConfig>('execution.yaml')
}

/**
 * Clear the config cache
 * Useful for testing or hot-reloading
 */
export function clearConfigCache(): void {
  configCache.clear()
}

/**
 * Check if a config file exists
 */
export function configExists(relativePath: string): boolean {
  const fullPath = join(getConfigDir(), relativePath)
  return existsSync(fullPath)
}

/**
 * Get all available state machine IDs
 */
export function getAvailableStateMachines(): string[] {
  return ['dev-flow', 'runtime-flow']
}

/**
 * Load prompt configuration
 */
export function loadPromptConfig(id: string): PromptConfig {
  return loadYamlFile<PromptConfig>(`prompts/${id}.yaml`)
}

/**
 * Load scaffold generator prompt config
 */
export function loadScaffoldGeneratorPrompt(): PromptConfig {
  return loadPromptConfig('scaffold-generator')
}

/**
 * Load a template file (raw text, not YAML)
 */
export function loadTemplate(relativePath: string): string {
  const fullPath = join(getConfigDir(), relativePath)

  if (!existsSync(fullPath)) {
    throw new Error(`Template file not found: ${fullPath}`)
  }

  return readFileSync(fullPath, 'utf-8')
}

/**
 * Load CLAUDE.md template
 */
export function loadClaudeMdTemplate(): string {
  return loadTemplate('templates/claude-md.template.md')
}

/**
 * Load git hooks configuration
 */
export function loadGitHooksConfig(): GitHooksConfig {
  return loadYamlFile<GitHooksConfig>('git-operations.yaml')
}

/**
 * Get hook config with defaults applied
 * Hook values take precedence over defaults.
 * stageAll only applies when hook doesn't specify files.
 *
 * @param hookName - Name of the hook (e.g., 'scaffold_complete', 'execute_milestone')
 * @returns Resolved hook config or null if hook doesn't exist
 */
export function getResolvedHookConfig(hookName: string): GitHookConfig | null {
  const config = loadGitHooksConfig()
  const hook = config.hooks[hookName]
  if (!hook) return null

  const defaults = config.defaults
  return {
    ...hook,
    push: {
      strategy: hook.push?.strategy ?? defaults.pushStrategy ?? 'auto',
    },
    commit: {
      ...hook.commit,
      // Only use stageAll when hook doesn't specify files (preserves declarative intent)
      files:
        hook.commit.files.length > 0
          ? hook.commit.files
          : defaults.stageAll
            ? ['.']
            : [],
    },
  }
}
