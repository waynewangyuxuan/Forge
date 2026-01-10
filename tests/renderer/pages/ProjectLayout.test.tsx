/**
 * ProjectLayout Tests
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock stores
let mockProject: Record<string, unknown> | null = null
let mockVersions: Record<string, unknown>[] = []
let mockCurrentVersionId: string | undefined = undefined
let mockLoading = false
const mockFetchProjects = vi.fn()
const mockFetchVersions = vi.fn()
const mockSetCurrentVersion = vi.fn()

vi.mock('../../../src/renderer/stores/server.store', () => ({
  useServerStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      currentVersionId: mockCurrentVersionId ? { 'proj-123': mockCurrentVersionId } : {},
      loading: { projects: mockLoading },
      fetchProjects: mockFetchProjects,
      fetchVersions: mockFetchVersions,
      setCurrentVersion: mockSetCurrentVersion,
    }
    return selector(state)
  },
  useProject: () => mockProject,
  useVersions: () => mockVersions,
}))

// Mock sidebar
const mockToggle = vi.fn()
vi.mock('../../../src/renderer/stores/ui.store', () => ({
  useSidebar: () => ({ collapsed: false, toggle: mockToggle }),
}))

import { ProjectLayout } from '../../../src/renderer/pages/ProjectLayout/ProjectLayout'

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/projects/proj-123']}>
    <Routes>
      <Route path="/projects/:projectId" element={children}>
        <Route index element={<div>Outlet Content</div>} />
      </Route>
    </Routes>
  </MemoryRouter>
)

describe('ProjectLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProject = null
    mockVersions = []
    mockCurrentVersionId = undefined
    mockLoading = false
  })

  it('should show loading spinner when loading with no project', () => {
    mockLoading = true
    mockProject = null

    render(<ProjectLayout />, { wrapper: Wrapper })

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should show project not found when project is null and not loading', () => {
    mockLoading = false
    mockProject = null

    render(<ProjectLayout />, { wrapper: Wrapper })

    expect(screen.getByText('Project not found')).toBeInTheDocument()
    expect(screen.getByText('The project you are looking for does not exist.')).toBeInTheDocument()
  })

  it('should render sidebar and outlet when project exists', () => {
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
    mockCurrentVersionId = 'ver-1'

    render(<ProjectLayout />, { wrapper: Wrapper })

    // Sidebar should be rendered with project name
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    // Outlet content should be rendered
    expect(screen.getByText('Outlet Content')).toBeInTheDocument()
  })

  it('should call fetchProjects on mount', () => {
    mockProject = {
      id: 'proj-123',
      name: 'Test Project',
      path: '/path/to/project',
      createdAt: new Date().toISOString(),
      archivedAt: null,
      githubOwner: 'testuser',
      githubRepo: 'test-repo',
    }
    mockVersions = []
    mockCurrentVersionId = undefined

    render(<ProjectLayout />, { wrapper: Wrapper })

    expect(mockFetchProjects).toHaveBeenCalled()
  })

  it('should call fetchVersions with projectId on mount', () => {
    mockProject = {
      id: 'proj-123',
      name: 'Test Project',
      path: '/path/to/project',
      createdAt: new Date().toISOString(),
      archivedAt: null,
      githubOwner: 'testuser',
      githubRepo: 'test-repo',
    }
    mockVersions = []

    render(<ProjectLayout />, { wrapper: Wrapper })

    expect(mockFetchVersions).toHaveBeenCalledWith('proj-123')
  })

  it('should set current version to first version when not set', () => {
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
    mockCurrentVersionId = undefined

    render(<ProjectLayout />, { wrapper: Wrapper })

    expect(mockSetCurrentVersion).toHaveBeenCalledWith('proj-123', 'ver-1')
  })

  it('should call setCurrentVersion when version is changed', () => {
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
      {
        id: 'ver-2',
        projectId: 'proj-123',
        versionName: 'v2.0',
        branchName: 'feature',
        devStatus: 'drafting',
        runtimeStatus: 'idle',
        createdAt: new Date().toISOString(),
      },
    ]
    mockCurrentVersionId = 'ver-1'

    render(<ProjectLayout />, { wrapper: Wrapper })

    // Change version using the select
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'ver-2' } })

    expect(mockSetCurrentVersion).toHaveBeenCalledWith('proj-123', 'ver-2')
  })

  it('should render version selector with all versions', () => {
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
      {
        id: 'ver-2',
        projectId: 'proj-123',
        versionName: 'v2.0',
        branchName: 'feature',
        devStatus: 'completed',
        runtimeStatus: 'running',
        createdAt: new Date().toISOString(),
      },
    ]
    mockCurrentVersionId = 'ver-1'

    render(<ProjectLayout />, { wrapper: Wrapper })

    expect(screen.getByText('v1.0')).toBeInTheDocument()
    expect(screen.getByText('v2.0')).toBeInTheDocument()
  })
})
