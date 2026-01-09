/**
 * Config Loader Unit Tests
 * Tests for YAML configuration loading
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { join } from 'path'
import {
  loadStateMachine,
  loadDevFlowStateMachine,
  loadRuntimeFlowStateMachine,
  loadExecutionConfig,
  clearConfigCache,
  setConfigDir,
  configExists,
  getAvailableStateMachines,
} from '../../src/main/infrastructure/config-loader/yaml-config-loader'

// Point to the actual config directory in the project
const CONFIG_DIR = join(__dirname, '../../config')

describe('YamlConfigLoader', () => {
  beforeEach(() => {
    // Set config directory to project's config folder
    setConfigDir(CONFIG_DIR)
    clearConfigCache()
  })

  afterEach(() => {
    setConfigDir(null)
    clearConfigCache()
  })

  describe('loadDevFlowStateMachine', () => {
    it('should load dev flow state machine configuration', () => {
      const config = loadDevFlowStateMachine()

      expect(config.name).toBe('dev-flow')
      expect(config.initialState).toBe('drafting')
      expect(config.states).toContain('drafting')
      expect(config.states).toContain('scaffolding')
      expect(config.states).toContain('reviewing')
      expect(config.states).toContain('ready')
      expect(config.states).toContain('executing')
      expect(config.states).toContain('completed')
    })

    it('should have valid transitions', () => {
      const config = loadDevFlowStateMachine()

      expect(config.transitions.length).toBeGreaterThan(0)

      // Check that all transition targets are valid states
      for (const transition of config.transitions) {
        expect(config.states).toContain(transition.to)

        // Check that all transition sources are valid states
        const fromStates = Array.isArray(transition.from)
          ? transition.from
          : [transition.from]
        for (const fromState of fromStates) {
          expect(config.states).toContain(fromState)
        }
      }
    })

    it('should cache the config on subsequent calls', () => {
      const config1 = loadDevFlowStateMachine()
      const config2 = loadDevFlowStateMachine()

      // Should be the same reference due to caching
      expect(config1).toBe(config2)
    })
  })

  describe('loadRuntimeFlowStateMachine', () => {
    it('should load runtime flow state machine configuration', () => {
      const config = loadRuntimeFlowStateMachine()

      expect(config.name).toBe('runtime-flow')
      expect(config.initialState).toBe('not_configured')
      expect(config.states).toContain('not_configured')
      expect(config.states).toContain('idle')
      expect(config.states).toContain('running')
      expect(config.states).toContain('success')
      expect(config.states).toContain('failed')
    })

    it('should have valid transitions', () => {
      const config = loadRuntimeFlowStateMachine()

      expect(config.transitions.length).toBeGreaterThan(0)

      for (const transition of config.transitions) {
        expect(config.states).toContain(transition.to)
      }
    })
  })

  describe('loadExecutionConfig', () => {
    it('should load execution configuration', () => {
      const config = loadExecutionConfig()

      expect(config.defaultCommitStrategy).toBeDefined()
      expect(['each_task', 'each_milestone', 'manual']).toContain(
        config.defaultCommitStrategy
      )
      expect(typeof config.taskTimeout).toBe('number')
      expect(config.taskTimeout).toBeGreaterThan(0)
      expect(typeof config.maxRetries).toBe('number')
      expect(config.maxRetries).toBeGreaterThanOrEqual(0)
    })
  })

  describe('loadStateMachine', () => {
    it('should load state machine by id', () => {
      const config = loadStateMachine('dev-flow')
      expect(config.name).toBe('dev-flow')
    })

    it('should throw error for non-existent state machine', () => {
      expect(() => loadStateMachine('nonexistent')).toThrow('Config file not found')
    })
  })

  describe('configExists', () => {
    it('should return true for existing config', () => {
      expect(configExists('execution.yaml')).toBe(true)
    })

    it('should return false for non-existing config', () => {
      expect(configExists('nonexistent.yaml')).toBe(false)
    })
  })

  describe('getAvailableStateMachines', () => {
    it('should return list of available state machines', () => {
      const machines = getAvailableStateMachines()

      expect(machines).toContain('dev-flow')
      expect(machines).toContain('runtime-flow')
    })
  })

  describe('clearConfigCache', () => {
    it('should clear cache and reload config', () => {
      const config1 = loadDevFlowStateMachine()
      clearConfigCache()
      const config2 = loadDevFlowStateMachine()

      // After clearing cache, should be different references
      expect(config1).not.toBe(config2)
      // But same content
      expect(config1.name).toBe(config2.name)
    })
  })
})
