/**
 * Domain Layer - Engines
 *
 * Pure business logic functions with zero external dependencies.
 * All I/O operations are handled by the Application layer via adapters.
 */

export * from './engines/prompt-renderer'
export * from './engines/scaffold-validator'
export * from './engines/scaffold-writer'
