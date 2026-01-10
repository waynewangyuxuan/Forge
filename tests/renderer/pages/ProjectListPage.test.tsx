/**
 * ProjectListPage Tests
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock server store with different states
let mockProjects: Record<string, unknown>[] = []
let mockLoading = false
let mockVersions: Record<string, unknown>[] = []

vi.mock('../../../src/renderer/stores/server.store', () => ({
  useServerStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      projects: mockProjects,
      loading: { projects: mockLoading },
      fetchProjects: vi.fn(),
      fetchVersions: vi.fn(),
      setCurrentVersion: vi.fn(),
      currentVersionId: {},
    }
    return selector(state)
  },
  useVersions: () => mockVersions,
}))

// Mock UI store
const mockOpenModal = vi.fn()
vi.mock('../../../src/renderer/stores/ui.store', () => ({
  useUIStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      openModal: mockOpenModal,
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

import { ProjectListPage } from '../../../src/renderer/pages/ProjectListPage/ProjectListPage'

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('ProjectListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProjects = []
    mockLoading = false
    mockVersions = []
  })

  it('should render page title', () => {
    render(<ProjectListPage />, { wrapper: Wrapper })

    expect(screen.getByText('My Projects')).toBeInTheDocument()
  })

  it('should render New Project button', () => {
    render(<ProjectListPage />, { wrapper: Wrapper })

    expect(screen.getByRole('button', { name: '+ New Project' })).toBeInTheDocument()
  })

  it('should open createProject modal when New Project is clicked', () => {
    render(<ProjectListPage />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: '+ New Project' }))

    expect(mockOpenModal).toHaveBeenCalledWith('createProject')
  })

  it('should show loading spinner when loading with no projects', () => {
    mockLoading = true
    mockProjects = []

    render(<ProjectListPage />, { wrapper: Wrapper })

    // Spinner should be present
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should show empty state when no projects', () => {
    mockProjects = []

    render(<ProjectListPage />, { wrapper: Wrapper })

    expect(screen.getByText('No projects yet')).toBeInTheDocument()
    expect(screen.getByText('Create your first project')).toBeInTheDocument()
  })

  it('should render project cards when projects exist', () => {
    mockProjects = [
      {
        id: 'proj-1',
        name: 'Project One',
        path: '/path/one',
        createdAt: new Date().toISOString(),
        archivedAt: null,
        githubOwner: 'user',
        githubRepo: 'repo',
      },
    ]
    mockVersions = [
      {
        id: 'ver-1',
        projectId: 'proj-1',
        versionName: 'v1.0',
        branchName: 'main',
        devStatus: 'drafting',
        runtimeStatus: 'idle',
        createdAt: new Date().toISOString(),
      },
    ]

    render(<ProjectListPage />, { wrapper: Wrapper })

    expect(screen.getByText('Project One')).toBeInTheDocument()
  })

  it('should not show archived projects', () => {
    mockProjects = [
      {
        id: 'proj-1',
        name: 'Active Project',
        path: '/path/one',
        createdAt: new Date().toISOString(),
        archivedAt: null,
        githubOwner: 'user',
        githubRepo: 'repo',
      },
      {
        id: 'proj-2',
        name: 'Archived Project',
        path: '/path/two',
        createdAt: new Date().toISOString(),
        archivedAt: new Date().toISOString(),
        githubOwner: 'user',
        githubRepo: 'repo2',
      },
    ]

    render(<ProjectListPage />, { wrapper: Wrapper })

    expect(screen.getByText('Active Project')).toBeInTheDocument()
    expect(screen.queryByText('Archived Project')).not.toBeInTheDocument()
  })

  it('should open createProject modal from empty state button', () => {
    mockProjects = []

    render(<ProjectListPage />, { wrapper: Wrapper })

    fireEvent.click(screen.getByText('Create your first project'))

    expect(mockOpenModal).toHaveBeenCalledWith('createProject')
  })
})
