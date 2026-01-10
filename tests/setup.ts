/**
 * Test setup file
 * Configures global mocks and testing utilities
 */

import { vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Mock window.api for renderer tests
const mockApi = {
  invoke: vi.fn(),
}

// Only set up window mock in jsdom environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'api', {
    value: mockApi,
    writable: true,
  })
}

// Export for test usage
export { mockApi }

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})
