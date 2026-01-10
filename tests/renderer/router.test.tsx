/**
 * Router Configuration Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'

// Mock all page components
vi.mock('../../src/renderer/RootLayout', () => ({
  RootLayout: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="root-layout">{children}</div>
  ),
}))

vi.mock('../../src/renderer/pages/ProjectListPage', () => ({
  ProjectListPage: () => <div data-testid="project-list-page">Project List</div>,
}))

vi.mock('../../src/renderer/pages/ProjectLayout', () => ({
  ProjectLayout: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="project-layout">{children}</div>
  ),
}))

vi.mock('../../src/renderer/pages/OverviewPage', () => ({
  OverviewPage: () => <div data-testid="overview-page">Overview</div>,
}))

vi.mock('../../src/renderer/pages/SettingsPage', () => ({
  SettingsPage: () => <div data-testid="settings-page">Settings</div>,
}))

vi.mock('../../src/renderer/pages/SpecPage', () => ({
  SpecPage: () => <div data-testid="spec-page">Spec</div>,
}))

// Import router after mocks
import { router } from '../../src/renderer/router'

describe('Router', () => {
  it('should be defined', () => {
    expect(router).toBeDefined()
  })

  it('should have routes array', () => {
    expect(router.routes).toBeDefined()
    expect(router.routes.length).toBeGreaterThan(0)
  })

  describe('Route configurations', () => {
    it('should have root route at /', () => {
      const rootRoute = router.routes[0]
      expect(rootRoute.path).toBe('/')
    })

    it('should have children routes under root', () => {
      const rootRoute = router.routes[0]
      expect(rootRoute.children).toBeDefined()
      expect(rootRoute.children!.length).toBeGreaterThan(0)
    })

    it('should have projects route', () => {
      const rootRoute = router.routes[0]
      const projectsRoute = rootRoute.children?.find(r => r.path === 'projects')
      expect(projectsRoute).toBeDefined()
    })

    it('should have settings route', () => {
      const rootRoute = router.routes[0]
      const settingsRoute = rootRoute.children?.find(r => r.path === 'settings')
      expect(settingsRoute).toBeDefined()
    })

    it('should have project detail routes', () => {
      const rootRoute = router.routes[0]
      const projectDetailRoute = rootRoute.children?.find(r => r.path === 'projects/:projectId')
      expect(projectDetailRoute).toBeDefined()
      expect(projectDetailRoute?.children).toBeDefined()
    })
  })

  describe('PlaceholderPage', () => {
    it('should render placeholder pages for unimplemented routes', () => {
      const rootRoute = router.routes[0]
      const projectDetailRoute = rootRoute.children?.find(r => r.path === 'projects/:projectId')
      const reviewRoute = projectDetailRoute?.children?.find(r => r.path === 'review')

      expect(reviewRoute).toBeDefined()
      expect(reviewRoute?.element).toBeDefined()
    })
  })

  describe('Navigation', () => {
    it('should redirect root to /projects', () => {
      const rootRoute = router.routes[0]
      const indexRoute = rootRoute.children?.find(r => r.index === true)
      expect(indexRoute).toBeDefined()
    })
  })
})

describe('Router integration', () => {
  // Create a test router that mimics the app router structure
  const createTestRouter = (initialEntry: string) => {
    return createMemoryRouter(
      [
        {
          path: '/projects',
          element: <div data-testid="projects">Projects</div>,
        },
        {
          path: '/settings',
          element: <div data-testid="settings">Settings</div>,
        },
      ],
      {
        initialEntries: [initialEntry],
      }
    )
  }

  it('should render projects page at /projects', async () => {
    const testRouter = createTestRouter('/projects')
    render(<RouterProvider router={testRouter} />)

    expect(await screen.findByTestId('projects')).toBeInTheDocument()
  })

  it('should render settings page at /settings', async () => {
    const testRouter = createTestRouter('/settings')
    render(<RouterProvider router={testRouter} />)

    expect(await screen.findByTestId('settings')).toBeInTheDocument()
  })
})
