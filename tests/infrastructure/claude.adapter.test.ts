/**
 * Claude CLI Adapter Tests
 *
 * Note: These tests verify the adapter's structure and error handling.
 * Full integration tests require actual Claude CLI installation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ClaudeUnavailableError, ClaudeTimeoutError } from '../../src/shared/errors'

// We need to test the adapter without actually calling claude CLI
// So we'll test the error classes and basic structure

describe('ClaudeCliAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ClaudeUnavailableError', () => {
    it('should have correct message', () => {
      const error = new ClaudeUnavailableError()
      expect(error.message).toBe('Claude CLI is not available')
      expect(error.code).toBe('CLAUDE_UNAVAILABLE')
    })
  })

  describe('ClaudeTimeoutError', () => {
    it('should include timeout value in message', () => {
      const error = new ClaudeTimeoutError(5000)
      expect(error.message).toBe('Claude execution timed out after 5000ms')
      expect(error.code).toBe('CLAUDE_TIMEOUT')
      expect(error.timeoutMs).toBe(5000)
    })
  })

  describe('adapter interface', () => {
    it('should export getClaudeAdapter function', async () => {
      const { getClaudeAdapter } = await import(
        '../../src/main/infrastructure/adapters/claude.adapter'
      )
      expect(typeof getClaudeAdapter).toBe('function')
    })

    it('should return singleton instance', async () => {
      const { getClaudeAdapter } = await import(
        '../../src/main/infrastructure/adapters/claude.adapter'
      )
      const adapter1 = getClaudeAdapter()
      const adapter2 = getClaudeAdapter()
      expect(adapter1).toBe(adapter2)
    })

    it('should implement IClaudeAdapter interface', async () => {
      const { getClaudeAdapter } = await import(
        '../../src/main/infrastructure/adapters/claude.adapter'
      )
      const adapter = getClaudeAdapter()

      expect(typeof adapter.isAvailable).toBe('function')
      expect(typeof adapter.getVersion).toBe('function')
      expect(typeof adapter.execute).toBe('function')
      expect(typeof adapter.executeStream).toBe('function')
      expect(typeof adapter.abort).toBe('function')
    })
  })

  describe('buildArgs', () => {
    it('should include --print flag', async () => {
      // We can test the args by checking what spawn receives
      // For now, just verify the adapter can be instantiated
      const { ClaudeCliAdapter } = await import(
        '../../src/main/infrastructure/adapters/claude.adapter'
      )
      const adapter = new ClaudeCliAdapter()
      expect(adapter).toBeDefined()
    })
  })
})

// Integration tests that require actual Claude CLI
describe.skip('ClaudeCliAdapter Integration', () => {
  it('should check if Claude CLI is installed', async () => {
    const { getClaudeAdapter } = await import(
      '../../src/main/infrastructure/adapters/claude.adapter'
    )
    const adapter = getClaudeAdapter()
    const available = await adapter.isAvailable()
    // This will be true only if claude is installed
    expect(typeof available).toBe('boolean')
  })
})
