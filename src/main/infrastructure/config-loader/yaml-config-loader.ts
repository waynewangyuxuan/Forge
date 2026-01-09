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
