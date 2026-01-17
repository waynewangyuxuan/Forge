/**
 * State Machine Engine
 * Manages state transitions based on configuration
 *
 * Domain engine: Pure functions, zero I/O dependencies
 * The state machine definition is injected, not loaded internally
 */

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
 * Error thrown when a transition is not allowed
 */
export class InvalidTransitionError extends Error {
  public readonly currentState: string
  public readonly event: string

  constructor(currentState: string, event: string) {
    super(`Invalid transition: cannot transition from '${currentState}' with event '${event}'`)
    this.name = 'InvalidTransitionError'
    this.currentState = currentState
    this.event = event
  }
}

/**
 * Error thrown when a state is not valid
 */
export class InvalidStateError extends Error {
  public readonly state: string

  constructor(state: string) {
    super(`Invalid state: '${state}' is not a valid state`)
    this.name = 'InvalidStateError'
    this.state = state
  }
}

/**
 * Error thrown when state machine configuration is invalid
 */
export class InvalidConfigError extends Error {
  public readonly errors: string[]

  constructor(errors: string[]) {
    super(`Invalid state machine configuration:\n${errors.join('\n')}`)
    this.name = 'InvalidConfigError'
    this.errors = errors
  }
}

/**
 * State Machine class
 * Manages transitions based on a configuration
 */
export class StateMachine {
  private readonly config: StateMachineConfig
  private readonly transitionMap: Map<string, string> // "from:event" -> "to"

  constructor(config: StateMachineConfig) {
    this.validateConfig(config)
    this.config = config
    this.transitionMap = this.buildTransitionMap()
  }

  /**
   * Validate state machine configuration at construction time
   * Throws InvalidConfigError if configuration is malformed
   */
  private validateConfig(config: StateMachineConfig): void {
    const errors: string[] = []
    const statesSet = new Set(config.states)

    // Check initialState is in states
    if (!statesSet.has(config.initialState)) {
      errors.push(`initialState '${config.initialState}' is not in states array`)
    }

    // Check all transition endpoints are valid states
    for (const transition of config.transitions) {
      const fromStates = Array.isArray(transition.from)
        ? transition.from
        : [transition.from]

      for (const from of fromStates) {
        if (!statesSet.has(from)) {
          errors.push(`transition '${transition.event}' has invalid 'from' state '${from}'`)
        }
      }

      if (!statesSet.has(transition.to)) {
        errors.push(`transition '${transition.event}' has invalid 'to' state '${transition.to}'`)
      }
    }

    if (errors.length > 0) {
      throw new InvalidConfigError(errors)
    }
  }

  /**
   * Build a lookup map for fast transition queries
   */
  private buildTransitionMap(): Map<string, string> {
    const map = new Map<string, string>()

    for (const transition of this.config.transitions) {
      // Handle transitions with multiple "from" states
      const fromStates = Array.isArray(transition.from)
        ? transition.from
        : [transition.from]

      for (const from of fromStates) {
        const key = `${from}:${transition.event}`
        map.set(key, transition.to)
      }
    }

    return map
  }

  /**
   * Get the initial state
   */
  get initialState(): string {
    return this.config.initialState
  }

  /**
   * Get all valid states
   */
  get states(): string[] {
    return this.config.states
  }

  /**
   * Check if a state is valid
   */
  isValidState(state: string): boolean {
    return this.config.states.includes(state)
  }

  /**
   * Check if a transition is possible from the current state with the given event
   */
  canTransition(currentState: string, event: string): boolean {
    if (!this.isValidState(currentState)) {
      return false
    }
    const key = `${currentState}:${event}`
    return this.transitionMap.has(key)
  }

  /**
   * Execute a transition and return the new state
   * Throws InvalidTransitionError if the transition is not allowed
   * Throws InvalidStateError if the current state is not valid
   */
  transition(currentState: string, event: string): string {
    if (!this.isValidState(currentState)) {
      throw new InvalidStateError(currentState)
    }

    const key = `${currentState}:${event}`
    const nextState = this.transitionMap.get(key)

    if (nextState === undefined) {
      throw new InvalidTransitionError(currentState, event)
    }

    return nextState
  }

  /**
   * Get all available events from a given state
   */
  getAvailableEvents(currentState: string): string[] {
    if (!this.isValidState(currentState)) {
      return []
    }

    const events: string[] = []
    for (const transition of this.config.transitions) {
      const fromStates = Array.isArray(transition.from)
        ? transition.from
        : [transition.from]

      if (fromStates.includes(currentState)) {
        events.push(transition.event)
      }
    }

    return events
  }

  /**
   * Get all possible next states from a given state
   */
  getNextStates(currentState: string): string[] {
    if (!this.isValidState(currentState)) {
      return []
    }

    const nextStates = new Set<string>()
    for (const transition of this.config.transitions) {
      const fromStates = Array.isArray(transition.from)
        ? transition.from
        : [transition.from]

      if (fromStates.includes(currentState)) {
        nextStates.add(transition.to)
      }
    }

    return Array.from(nextStates)
  }
}

/**
 * Create a state machine instance from configuration
 */
export function createStateMachine(config: StateMachineConfig): StateMachine {
  return new StateMachine(config)
}
