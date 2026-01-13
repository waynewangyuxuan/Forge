/**
 * CreateProjectModal Tests
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock stores
let mockIsOpen = false
const mockCloseModal = vi.fn()
const mockShowToast = vi.fn()
const mockCreateProject = vi.fn()

vi.mock('../../../src/renderer/stores/ui.store', () => ({
  useUIStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      closeModal: mockCloseModal,
      showToast: mockShowToast,
    }
    return selector(state)
  },
  useModalOpen: () => mockIsOpen,
}))

vi.mock('../../../src/renderer/stores/server.store', () => ({
  useServerStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      createProject: mockCreateProject,
    }
    return selector(state)
  },
}))

import { CreateProjectModal } from '../../../src/renderer/components/composites/CreateProjectModal/CreateProjectModal'

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('CreateProjectModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOpen = true
  })

  it('should not render when modal is closed', () => {
    mockIsOpen = false
    render(<CreateProjectModal />, { wrapper: Wrapper })

    expect(screen.queryByText('Create New Project')).not.toBeInTheDocument()
  })

  it('should render title when open', () => {
    render(<CreateProjectModal />, { wrapper: Wrapper })

    expect(screen.getByText('Create New Project')).toBeInTheDocument()
  })

  it('should render project name input', () => {
    render(<CreateProjectModal />, { wrapper: Wrapper })

    expect(screen.getByPlaceholderText('my-awesome-project')).toBeInTheDocument()
  })

  it('should render description input', () => {
    render(<CreateProjectModal />, { wrapper: Wrapper })

    expect(screen.getByPlaceholderText('A brief description of your project')).toBeInTheDocument()
  })

  it('should render private checkbox', () => {
    render(<CreateProjectModal />, { wrapper: Wrapper })

    expect(screen.getByLabelText('Private repository')).toBeInTheDocument()
  })

  it('should render Cancel and Create buttons', () => {
    render(<CreateProjectModal />, { wrapper: Wrapper })

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Project' })).toBeInTheDocument()
  })

  it('should close modal when Cancel is clicked', () => {
    render(<CreateProjectModal />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockCloseModal).toHaveBeenCalledWith('createProject')
  })

  it('should show error when submitting empty name', async () => {
    render(<CreateProjectModal />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: 'Create Project' }))

    await waitFor(() => {
      expect(screen.getByText('Project name is required')).toBeInTheDocument()
    })
  })

  it('should show error for invalid project name', async () => {
    render(<CreateProjectModal />, { wrapper: Wrapper })

    const input = screen.getByPlaceholderText('my-awesome-project')
    fireEvent.change(input, { target: { value: '-invalid-name' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Project' }))

    await waitFor(() => {
      expect(
        screen.getByText(/Name must start with a letter\/number/)
      ).toBeInTheDocument()
    })
  })

  it('should call createProject with form data', async () => {
    mockCreateProject.mockResolvedValue({ ok: true, data: { id: 'proj-123', name: 'my-project' } })

    render(<CreateProjectModal />, { wrapper: Wrapper })

    const nameInput = screen.getByPlaceholderText('my-awesome-project')
    const descInput = screen.getByPlaceholderText('A brief description of your project')
    const privateCheckbox = screen.getByLabelText('Private repository')

    fireEvent.change(nameInput, { target: { value: 'my-project' } })
    fireEvent.change(descInput, { target: { value: 'A description' } })
    fireEvent.click(privateCheckbox)
    fireEvent.click(screen.getByRole('button', { name: 'Create Project' }))

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: 'my-project',
        description: 'A description',
        private: true,
      })
    })
  })

  it('should show success toast and navigate on success', async () => {
    mockCreateProject.mockResolvedValue({ ok: true, data: { id: 'proj-123', name: 'my-project' } })

    render(<CreateProjectModal />, { wrapper: Wrapper })

    const nameInput = screen.getByPlaceholderText('my-awesome-project')
    fireEvent.change(nameInput, { target: { value: 'my-project' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Project' }))

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'Project "my-project" created successfully',
      })
      expect(mockNavigate).toHaveBeenCalledWith('/projects/proj-123')
      expect(mockCloseModal).toHaveBeenCalledWith('createProject')
    })
  })

  it('should handle GITHUB_NOT_AUTHENTICATED error', async () => {
    mockCreateProject.mockResolvedValue({
      ok: false,
      error: { code: 'GITHUB_NOT_AUTHENTICATED', message: 'Not authenticated' },
    })

    render(<CreateProjectModal />, { wrapper: Wrapper })

    const nameInput = screen.getByPlaceholderText('my-awesome-project')
    fireEvent.change(nameInput, { target: { value: 'my-project' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Project' }))

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Please connect GitHub in Settings first',
      })
    })
  })

  it('should handle GITHUB_CLI_NOT_FOUND error', async () => {
    mockCreateProject.mockResolvedValue({
      ok: false,
      error: { code: 'GITHUB_CLI_NOT_FOUND', message: 'CLI not found' },
    })

    render(<CreateProjectModal />, { wrapper: Wrapper })

    const nameInput = screen.getByPlaceholderText('my-awesome-project')
    fireEvent.change(nameInput, { target: { value: 'my-project' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Project' }))

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'GitHub CLI not found. Please install gh from https://cli.github.com',
      })
    })
  })

  it('should handle GITHUB_REPO_EXISTS error', async () => {
    mockCreateProject.mockResolvedValue({
      ok: false,
      error: { code: 'GITHUB_REPO_EXISTS', message: 'Repo exists' },
    })

    render(<CreateProjectModal />, { wrapper: Wrapper })

    const nameInput = screen.getByPlaceholderText('my-awesome-project')
    fireEvent.change(nameInput, { target: { value: 'my-project' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Project' }))

    await waitFor(() => {
      expect(screen.getByText('A repository with this name already exists')).toBeInTheDocument()
    })
  })

  it('should handle VALIDATION_ERROR', async () => {
    mockCreateProject.mockResolvedValue({
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: 'Custom validation error' },
    })

    render(<CreateProjectModal />, { wrapper: Wrapper })

    const nameInput = screen.getByPlaceholderText('my-awesome-project')
    fireEvent.change(nameInput, { target: { value: 'my-project' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Project' }))

    await waitFor(() => {
      expect(screen.getByText('Custom validation error')).toBeInTheDocument()
    })
  })

  it('should handle generic error', async () => {
    mockCreateProject.mockResolvedValue({
      ok: false,
      error: { code: 'UNKNOWN_ERROR', message: 'Something went wrong' },
    })

    render(<CreateProjectModal />, { wrapper: Wrapper })

    const nameInput = screen.getByPlaceholderText('my-awesome-project')
    fireEvent.change(nameInput, { target: { value: 'my-project' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Project' }))

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Something went wrong',
      })
    })
  })

  it('should update name input when typing', () => {
    render(<CreateProjectModal />, { wrapper: Wrapper })

    const input = screen.getByPlaceholderText('my-awesome-project')
    fireEvent.change(input, { target: { value: 'new-project' } })

    expect(input).toHaveValue('new-project')
  })

  it('should toggle private checkbox', () => {
    render(<CreateProjectModal />, { wrapper: Wrapper })

    const checkbox = screen.getByLabelText('Private repository')
    expect(checkbox).not.toBeChecked()

    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()

    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })
})
