/**
 * State Machine Engine Tests
 */

import { describe, it, expect } from 'vitest'
import {
  StateMachine,
  createStateMachine,
  InvalidTransitionError,
  InvalidStateError,
  InvalidConfigError,
  type StateMachineConfig,
} from '../../src/main/domain/engines/state-machine'

// Simple state machine config for testing
const testConfig: StateMachineConfig = {
  name: 'test-flow',
  initialState: 'idle',
  states: ['idle', 'running', 'completed', 'error'],
  transitions: [
    { event: 'START', from: 'idle', to: 'running' },
    { event: 'COMPLETE', from: 'running', to: 'completed' },
    { event: 'ERROR', from: 'running', to: 'error' },
    { event: 'RETRY', from: 'error', to: 'idle' },
    { event: 'RESET', from: ['completed', 'error'], to: 'idle' },
  ],
}

describe('StateMachine', () => {
  describe('construction', () => {
    it('should create a state machine from config', () => {
      const sm = createStateMachine(testConfig)
      expect(sm).toBeInstanceOf(StateMachine)
    })

    it('should expose initial state', () => {
      const sm = createStateMachine(testConfig)
      expect(sm.initialState).toBe('idle')
    })

    it('should expose all states', () => {
      const sm = createStateMachine(testConfig)
      expect(sm.states).toEqual(['idle', 'running', 'completed', 'error'])
    })
  })

  describe('isValidState', () => {
    it('should return true for valid states', () => {
      const sm = createStateMachine(testConfig)
      expect(sm.isValidState('idle')).toBe(true)
      expect(sm.isValidState('running')).toBe(true)
      expect(sm.isValidState('completed')).toBe(true)
      expect(sm.isValidState('error')).toBe(true)
    })

    it('should return false for invalid states', () => {
      const sm = createStateMachine(testConfig)
      expect(sm.isValidState('invalid')).toBe(false)
      expect(sm.isValidState('')).toBe(false)
    })
  })

  describe('canTransition', () => {
    it('should return true for valid transitions', () => {
      const sm = createStateMachine(testConfig)
      expect(sm.canTransition('idle', 'START')).toBe(true)
      expect(sm.canTransition('running', 'COMPLETE')).toBe(true)
      expect(sm.canTransition('running', 'ERROR')).toBe(true)
      expect(sm.canTransition('error', 'RETRY')).toBe(true)
    })

    it('should return false for invalid transitions', () => {
      const sm = createStateMachine(testConfig)
      expect(sm.canTransition('idle', 'COMPLETE')).toBe(false)
      expect(sm.canTransition('completed', 'START')).toBe(false)
      expect(sm.canTransition('error', 'COMPLETE')).toBe(false)
    })

    it('should return false for invalid states', () => {
      const sm = createStateMachine(testConfig)
      expect(sm.canTransition('invalid', 'START')).toBe(false)
    })

    it('should handle transitions with multiple from states', () => {
      const sm = createStateMachine(testConfig)
      // RESET can be triggered from both 'completed' and 'error'
      expect(sm.canTransition('completed', 'RESET')).toBe(true)
      expect(sm.canTransition('error', 'RESET')).toBe(true)
      expect(sm.canTransition('idle', 'RESET')).toBe(false)
    })
  })

  describe('transition', () => {
    it('should return the new state for valid transitions', () => {
      const sm = createStateMachine(testConfig)
      expect(sm.transition('idle', 'START')).toBe('running')
      expect(sm.transition('running', 'COMPLETE')).toBe('completed')
      expect(sm.transition('running', 'ERROR')).toBe('error')
      expect(sm.transition('error', 'RETRY')).toBe('idle')
    })

    it('should throw InvalidTransitionError for invalid transitions', () => {
      const sm = createStateMachine(testConfig)
      expect(() => sm.transition('idle', 'COMPLETE')).toThrow(InvalidTransitionError)
      expect(() => sm.transition('completed', 'START')).toThrow(InvalidTransitionError)
    })

    it('should throw InvalidStateError for invalid states', () => {
      const sm = createStateMachine(testConfig)
      expect(() => sm.transition('invalid', 'START')).toThrow(InvalidStateError)
    })

    it('should handle transitions with multiple from states', () => {
      const sm = createStateMachine(testConfig)
      expect(sm.transition('completed', 'RESET')).toBe('idle')
      expect(sm.transition('error', 'RESET')).toBe('idle')
    })
  })

  describe('getAvailableEvents', () => {
    it('should return available events for a state', () => {
      const sm = createStateMachine(testConfig)
      expect(sm.getAvailableEvents('idle')).toEqual(['START'])
      expect(sm.getAvailableEvents('running')).toEqual(['COMPLETE', 'ERROR'])
      expect(sm.getAvailableEvents('error')).toEqual(['RETRY', 'RESET'])
      expect(sm.getAvailableEvents('completed')).toEqual(['RESET'])
    })

    it('should return empty array for invalid states', () => {
      const sm = createStateMachine(testConfig)
      expect(sm.getAvailableEvents('invalid')).toEqual([])
    })
  })

  describe('getNextStates', () => {
    it('should return possible next states', () => {
      const sm = createStateMachine(testConfig)
      expect(sm.getNextStates('idle')).toEqual(['running'])
      expect(sm.getNextStates('running').sort()).toEqual(['completed', 'error'].sort())
      expect(sm.getNextStates('error')).toEqual(['idle'])
      expect(sm.getNextStates('completed')).toEqual(['idle'])
    })

    it('should return empty array for invalid states', () => {
      const sm = createStateMachine(testConfig)
      expect(sm.getNextStates('invalid')).toEqual([])
    })
  })
})

describe('InvalidTransitionError', () => {
  it('should include current state and event in message', () => {
    const error = new InvalidTransitionError('idle', 'COMPLETE')
    expect(error.message).toContain('idle')
    expect(error.message).toContain('COMPLETE')
    expect(error.currentState).toBe('idle')
    expect(error.event).toBe('COMPLETE')
    expect(error.name).toBe('InvalidTransitionError')
  })
})

describe('InvalidStateError', () => {
  it('should include state in message', () => {
    const error = new InvalidStateError('invalid')
    expect(error.message).toContain('invalid')
    expect(error.state).toBe('invalid')
    expect(error.name).toBe('InvalidStateError')
  })
})

describe('InvalidConfigError', () => {
  it('should include all errors in message', () => {
    const error = new InvalidConfigError(['error1', 'error2'])
    expect(error.message).toContain('error1')
    expect(error.message).toContain('error2')
    expect(error.errors).toEqual(['error1', 'error2'])
    expect(error.name).toBe('InvalidConfigError')
  })
})

describe('config validation', () => {
  it('should throw InvalidConfigError for invalid initialState', () => {
    const badConfig: StateMachineConfig = {
      name: 'bad',
      initialState: 'nonexistent',
      states: ['idle', 'running'],
      transitions: [],
    }
    expect(() => createStateMachine(badConfig)).toThrow(InvalidConfigError)
    try {
      createStateMachine(badConfig)
    } catch (e) {
      expect((e as InvalidConfigError).errors).toContain(
        "initialState 'nonexistent' is not in states array"
      )
    }
  })

  it('should throw InvalidConfigError for invalid transition from state', () => {
    const badConfig: StateMachineConfig = {
      name: 'bad',
      initialState: 'idle',
      states: ['idle', 'running'],
      transitions: [{ event: 'START', from: 'nonexistent', to: 'running' }],
    }
    expect(() => createStateMachine(badConfig)).toThrow(InvalidConfigError)
    try {
      createStateMachine(badConfig)
    } catch (e) {
      expect((e as InvalidConfigError).errors.some((err) => err.includes("'nonexistent'"))).toBe(
        true
      )
    }
  })

  it('should throw InvalidConfigError for invalid transition to state', () => {
    const badConfig: StateMachineConfig = {
      name: 'bad',
      initialState: 'idle',
      states: ['idle', 'running'],
      transitions: [{ event: 'START', from: 'idle', to: 'nonexistent' }],
    }
    expect(() => createStateMachine(badConfig)).toThrow(InvalidConfigError)
    try {
      createStateMachine(badConfig)
    } catch (e) {
      expect((e as InvalidConfigError).errors.some((err) => err.includes("'nonexistent'"))).toBe(
        true
      )
    }
  })

  it('should throw InvalidConfigError for invalid state in multiple from states', () => {
    const badConfig: StateMachineConfig = {
      name: 'bad',
      initialState: 'idle',
      states: ['idle', 'running', 'completed'],
      transitions: [{ event: 'RESET', from: ['completed', 'nonexistent'], to: 'idle' }],
    }
    expect(() => createStateMachine(badConfig)).toThrow(InvalidConfigError)
    try {
      createStateMachine(badConfig)
    } catch (e) {
      expect((e as InvalidConfigError).errors.some((err) => err.includes("'nonexistent'"))).toBe(
        true
      )
    }
  })

  it('should collect all errors in a single InvalidConfigError', () => {
    const badConfig: StateMachineConfig = {
      name: 'bad',
      initialState: 'nonexistent_initial',
      states: ['idle', 'running'],
      transitions: [
        { event: 'START', from: 'nonexistent_from', to: 'running' },
        { event: 'COMPLETE', from: 'running', to: 'nonexistent_to' },
      ],
    }
    expect(() => createStateMachine(badConfig)).toThrow(InvalidConfigError)
    try {
      createStateMachine(badConfig)
    } catch (e) {
      const errors = (e as InvalidConfigError).errors
      expect(errors.length).toBe(3)
      expect(errors.some((err) => err.includes('nonexistent_initial'))).toBe(true)
      expect(errors.some((err) => err.includes('nonexistent_from'))).toBe(true)
      expect(errors.some((err) => err.includes('nonexistent_to'))).toBe(true)
    }
  })
})
