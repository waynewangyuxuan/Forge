/**
 * App Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  RouterProvider: vi.fn(({ router }: { router: unknown }) => (
    <div data-testid="router-provider" data-router={JSON.stringify(!!router)}>
      Router Provider
    </div>
  )),
}))

// Mock the router
vi.mock('../../src/renderer/router', () => ({
  router: { routes: [] },
}))

import App from '../../src/renderer/App'

describe('App', () => {
  it('should render RouterProvider', () => {
    const { getByTestId } = render(<App />)

    expect(getByTestId('router-provider')).toBeInTheDocument()
  })

  it('should pass router to RouterProvider', () => {
    const { getByTestId } = render(<App />)

    expect(getByTestId('router-provider').getAttribute('data-router')).toBe('true')
  })
})
