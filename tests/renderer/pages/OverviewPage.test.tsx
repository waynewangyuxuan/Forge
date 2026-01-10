/**
 * OverviewPage Tests
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock react-router-dom
const mockNavigate = vi.fn()
const mockParams = { projectId: 'proj-123' }

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  }
})

// Mock server store - make it dynamic
let mockProject: Record<string, unknown> | null = {
  id: 'proj-123',
  name: 'Test Project',
  path: '/path/to/project',
  createdAt: new Date().toISOString(),
  archivedAt: null,
  githubOwner: 'testuser',
  githubRepo: 'test-repo',
}

let mockVersions: Array<Record<string, unknown>> = [
  {
    id: 'ver-1',
    projectId: 'proj-123',
    versionName: 'v1.0',
    branchName: 'main',
    devStatus: 'drafting',
    runtimeStatus: 'idle',
    createdAt: new Date().toISOString(),
  },
]

let mockCurrentVersionId: Record<string, string> = { 'proj-123': 'ver-1' }

vi.mock('../../../src/renderer/stores/server.store', () => ({
  useProject: () => mockProject,
  useVersions: () => mockVersions,
  useServerStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      currentVersionId: mockCurrentVersionId,
    }
    return selector(state)
  },
}))

// Mock window.api
const mockInvoke = vi.fn()
Object.defineProperty(window, 'api', {
  value: { invoke: mockInvoke },
  writable: true,
})

import { OverviewPage } from '../../../src/renderer/pages/OverviewPage/OverviewPage'

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('OverviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock data
    mockProject = {
      id: 'proj-123',
      name: 'Test Project',
      path: '/path/to/project',
      createdAt: new Date().toISOString(),
      archivedAt: null,
      githubOwner: 'testuser',
      githubRepo: 'test-repo',
    }
    mockVersions = [
      {
        id: 'ver-1',
        projectId: 'proj-123',
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: 'drafting',
        runtimeStatus: 'idle',
        createdAt: new Date().toISOString(),
      },
    ]
    mockCurrentVersionId = { 'proj-123': 'ver-1' }
  })

  it('should render project name', () => {
    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })

  it('should render project path', () => {
    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByText('/path/to/project')).toBeInTheDocument()
  })

  it('should render Development card with status', () => {
    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByText('Development')).toBeInTheDocument()
    // "Drafting" appears multiple times (in card and version history)
    expect(screen.getAllByText('Drafting').length).toBeGreaterThan(0)
  })

  it('should render Runtime card with status', () => {
    render(<OverviewPage />, { wrapper: Wrapper })

    // There are multiple "Runtime" texts
    expect(screen.getAllByText('Runtime').length).toBeGreaterThan(0)
    expect(screen.getByText('Idle')).toBeInTheDocument()
  })

  it('should render version info', () => {
    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByText('v1.0 (main)')).toBeInTheDocument()
  })

  it('should render Start Writing button when drafting', () => {
    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByRole('button', { name: 'Start Writing' })).toBeInTheDocument()
  })

  it('should navigate to spec page when Start Writing is clicked', () => {
    render(<OverviewPage />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: 'Start Writing' }))

    expect(mockNavigate).toHaveBeenCalledWith('/projects/proj-123/spec')
  })

  it('should render Open in VSCode button', () => {
    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByRole('button', { name: 'Open in VSCode' })).toBeInTheDocument()
  })

  it('should call shell:openInEditor when Open in VSCode is clicked', async () => {
    mockInvoke.mockResolvedValue(undefined)
    render(<OverviewPage />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: 'Open in VSCode' }))

    expect(mockInvoke).toHaveBeenCalledWith('shell:openInEditor', { path: '/path/to/project' })
  })

  it('should render Version History card', () => {
    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByText('Version History')).toBeInTheDocument()
  })

  it('should render version in history with (current) marker', () => {
    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByText('(current)')).toBeInTheDocument()
  })

  it('should render Dashboard button', () => {
    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('should navigate to dashboard when Dashboard button is clicked', () => {
    render(<OverviewPage />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }))

    expect(mockNavigate).toHaveBeenCalledWith('/projects/proj-123/dashboard')
  })

  it('should show loading spinner when project is null', () => {
    mockProject = null
    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('should show loading spinner when no versions exist', () => {
    mockVersions = []
    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('should show Continue button when devStatus is not drafting', () => {
    mockVersions = [
      {
        id: 'ver-1',
        projectId: 'proj-123',
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: 'reviewing',
        runtimeStatus: 'idle',
        createdAt: new Date().toISOString(),
      },
    ]

    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  })

  it('should show not_configured runtime message', () => {
    mockVersions = [
      {
        id: 'ver-1',
        projectId: 'proj-123',
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: 'drafting',
        runtimeStatus: 'not_configured',
        createdAt: new Date().toISOString(),
      },
    ]

    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByText(/Runtime is not configured yet/)).toBeInTheDocument()
  })

  it('should show Configure button when devStatus is completed and runtime not configured', () => {
    mockVersions = [
      {
        id: 'ver-1',
        projectId: 'proj-123',
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: 'completed',
        runtimeStatus: 'not_configured',
        createdAt: new Date().toISOString(),
      },
    ]

    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByRole('button', { name: 'Configure' })).toBeInTheDocument()
  })

  it('should show Run Now button when devStatus is completed and runtime is idle', () => {
    mockVersions = [
      {
        id: 'ver-1',
        projectId: 'proj-123',
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: 'completed',
        runtimeStatus: 'idle',
        createdAt: new Date().toISOString(),
      },
    ]

    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByRole('button', { name: 'Run Now' })).toBeInTheDocument()
  })

  it('should navigate to runtime page when Configure is clicked', () => {
    mockVersions = [
      {
        id: 'ver-1',
        projectId: 'proj-123',
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: 'completed',
        runtimeStatus: 'not_configured',
        createdAt: new Date().toISOString(),
      },
    ]

    render(<OverviewPage />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: 'Configure' }))

    expect(mockNavigate).toHaveBeenCalledWith('/projects/proj-123/runtime')
  })

  it('should handle error when opening in editor fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockInvoke.mockRejectedValue(new Error('Failed to open'))

    render(<OverviewPage />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: 'Open in VSCode' }))

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to open in editor:', expect.any(Error))
    })

    consoleError.mockRestore()
  })

  it('should use first version when currentVersionId is not set', () => {
    mockCurrentVersionId = {}

    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByText('v1.0 (main)')).toBeInTheDocument()
  })

  it('should show Trigger Mode info for configured runtime', () => {
    mockVersions = [
      {
        id: 'ver-1',
        projectId: 'proj-123',
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: 'drafting',
        runtimeStatus: 'idle',
        createdAt: new Date().toISOString(),
      },
    ]

    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByText('Trigger Mode')).toBeInTheDocument()
    expect(screen.getByText('Manual')).toBeInTheDocument()
  })

  it('should show multiple versions in history', () => {
    mockVersions = [
      {
        id: 'ver-1',
        projectId: 'proj-123',
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: 'drafting',
        runtimeStatus: 'idle',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'ver-2',
        projectId: 'proj-123',
        versionName: 'v0.9',
        branchName: 'develop',
        devStatus: 'completed',
        runtimeStatus: 'success',
        createdAt: new Date().toISOString(),
      },
    ]

    render(<OverviewPage />, { wrapper: Wrapper })

    expect(screen.getByText('v1.0')).toBeInTheDocument()
    expect(screen.getByText('v0.9')).toBeInTheDocument()
  })
})
