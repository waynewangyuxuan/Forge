/**
 * RootLayout Component Tests
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock components
vi.mock('../../src/renderer/components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}))

vi.mock('../../src/renderer/components/composites/CreateProjectModal', () => ({
  CreateProjectModal: () => <div data-testid="mock-create-modal">Create Modal</div>,
}))

import { RootLayout } from '../../src/renderer/RootLayout'

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('RootLayout', () => {
  it('should render Header component', () => {
    render(<RootLayout />, { wrapper: Wrapper })

    expect(screen.getByTestId('mock-header')).toBeInTheDocument()
  })

  it('should render CreateProjectModal', () => {
    render(<RootLayout />, { wrapper: Wrapper })

    expect(screen.getByTestId('mock-create-modal')).toBeInTheDocument()
  })

  it('should render main content area', () => {
    render(<RootLayout />, { wrapper: Wrapper })

    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('should have correct layout structure', () => {
    const { container } = render(<RootLayout />, { wrapper: Wrapper })

    // Check that the root div has flex flex-col h-screen classes
    const rootDiv = container.firstChild as HTMLElement
    expect(rootDiv).toHaveClass('flex', 'flex-col', 'h-screen')
  })
})
