/**
 * ProjectCard Component Tests
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ProjectCard } from '../../../src/renderer/components/composites/ProjectCard/ProjectCard'
import type { Project, Version } from '../../../src/shared/types/domain.types'

const mockProject: Project = {
  id: 'proj-123',
  name: 'Test Project',
  path: '/path/to/project',
  createdAt: new Date().toISOString(),
  archivedAt: null,
  githubOwner: 'testuser',
  githubRepo: 'test-project',
}

const mockVersion: Version = {
  id: 'ver-456',
  projectId: 'proj-123',
  versionName: 'v1.0',
  branchName: 'main',
  devStatus: 'drafting',
  runtimeStatus: 'idle',
  createdAt: new Date().toISOString(),
}

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('ProjectCard', () => {
  it('should render project name', () => {
    render(
      <ProjectCard project={mockProject} />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })

  it('should render project path', () => {
    render(
      <ProjectCard project={mockProject} />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText('/path/to/project')).toBeInTheDocument()
  })

  it('should render active version when provided', () => {
    render(
      <ProjectCard project={mockProject} activeVersion={mockVersion} />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText('v1.0')).toBeInTheDocument()
  })

  it('should render version dev status', () => {
    render(
      <ProjectCard project={mockProject} activeVersion={mockVersion} />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText('Drafting')).toBeInTheDocument()
  })

  it('should render runtime status', () => {
    render(
      <ProjectCard project={mockProject} activeVersion={mockVersion} />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText('Idle')).toBeInTheDocument()
  })

  it('should render default status when no active version', () => {
    render(
      <ProjectCard project={mockProject} />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText('Drafting')).toBeInTheDocument()
    expect(screen.getByText('Not configured')).toBeInTheDocument()
  })

  it('should render Open button', () => {
    render(
      <ProjectCard project={mockProject} />,
      { wrapper: Wrapper }
    )

    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
  })

  it('should render VSCode button', () => {
    render(
      <ProjectCard project={mockProject} />,
      { wrapper: Wrapper }
    )

    expect(screen.getByRole('button', { name: 'VSCode' })).toBeInTheDocument()
  })

  it('should call onOpenInEditor when VSCode button is clicked', () => {
    const onOpenInEditor = vi.fn()

    render(
      <ProjectCard project={mockProject} onOpenInEditor={onOpenInEditor} />,
      { wrapper: Wrapper }
    )

    fireEvent.click(screen.getByRole('button', { name: 'VSCode' }))

    expect(onOpenInEditor).toHaveBeenCalled()
  })

  it('should render different dev statuses correctly', () => {
    const completedVersion: Version = {
      ...mockVersion,
      devStatus: 'completed',
    }

    render(
      <ProjectCard project={mockProject} activeVersion={completedVersion} />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('should render different runtime statuses correctly', () => {
    const runningVersion: Version = {
      ...mockVersion,
      runtimeStatus: 'running',
    }

    render(
      <ProjectCard project={mockProject} activeVersion={runningVersion} />,
      { wrapper: Wrapper }
    )

    expect(screen.getByText('Running')).toBeInTheDocument()
  })
})
