/**
 * SettingsPage Tests
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

// Mock GitHub auth hook with different states
let mockGitHubState = {
  loading: false,
  available: true,
  authenticated: true,
  user: { login: 'testuser', name: 'Test User', avatarUrl: 'https://example.com/avatar.png' },
  error: null,
  refresh: vi.fn(),
}

vi.mock('../../../src/renderer/hooks/useGitHubAuth', () => ({
  useGitHubAuth: () => mockGitHubState,
}))

// Mock UI store
const mockShowToast = vi.fn()
vi.mock('../../../src/renderer/stores/ui.store', () => ({
  useUIStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      showToast: mockShowToast,
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

import { SettingsPage } from '../../../src/renderer/pages/SettingsPage/SettingsPage'

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGitHubState = {
      loading: false,
      available: true,
      authenticated: true,
      user: { login: 'testuser', name: 'Test User', avatarUrl: 'https://example.com/avatar.png' },
      error: null,
      refresh: vi.fn(),
    }
    mockInvoke.mockResolvedValue({ cloneRoot: '/Users/test/Projects' })
  })

  it('should render page title', async () => {
    render(<SettingsPage />, { wrapper: Wrapper })

    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('should render Back button', () => {
    render(<SettingsPage />, { wrapper: Wrapper })

    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('should navigate back when Back button is clicked', () => {
    render(<SettingsPage />, { wrapper: Wrapper })

    fireEvent.click(screen.getByText('Back'))

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('should show loading state initially', () => {
    render(<SettingsPage />, { wrapper: Wrapper })

    expect(screen.getByText('Loading settings...')).toBeInTheDocument()
  })

  it('should render GitHub Connection section', async () => {
    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('GitHub Connection')).toBeInTheDocument()
    })
  })

  it('should show authenticated user info when logged in', async () => {
    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('@testuser')).toBeInTheDocument()
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
  })

  it('should show GitHub CLI not found message when unavailable', async () => {
    mockGitHubState = {
      ...mockGitHubState,
      available: false,
      authenticated: false,
      user: null,
    }

    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('GitHub CLI not found')).toBeInTheDocument()
    })
  })

  it('should show not authenticated message when CLI available but not logged in', async () => {
    mockGitHubState = {
      ...mockGitHubState,
      available: true,
      authenticated: false,
      user: null,
    }

    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument()
    })
  })

  it('should render Check Again button when not authenticated', async () => {
    mockGitHubState = {
      ...mockGitHubState,
      available: true,
      authenticated: false,
      user: null,
    }

    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Check Again')).toBeInTheDocument()
    })
  })

  it('should call refresh when Check Again is clicked', async () => {
    mockGitHubState = {
      ...mockGitHubState,
      available: true,
      authenticated: false,
      user: null,
    }

    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      fireEvent.click(screen.getByText('Check Again'))
    })

    expect(mockGitHubState.refresh).toHaveBeenCalled()
  })

  it('should render Projects Location section', async () => {
    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Projects Location')).toBeInTheDocument()
    })
  })

  it('should render About section', async () => {
    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('About')).toBeInTheDocument()
      expect(screen.getByText('Forge - AI-powered project generation')).toBeInTheDocument()
    })
  })

  it('should load settings on mount', async () => {
    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('system:getSettings')
    })
  })

  it('should show error toast when settings fail to load', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('Failed'))

    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to load settings',
      })
    })
  })

  it('should render Browse button', async () => {
    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Browse')).toBeInTheDocument()
    })
  })

  it('should show checking GitHub connection when loading', async () => {
    mockGitHubState = {
      ...mockGitHubState,
      loading: true,
    }

    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Checking GitHub connection...')).toBeInTheDocument()
    })
  })

  it('should show Save Changes button when clone root is modified', async () => {
    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('~/Projects')).toBeInTheDocument()
    })

    // Change the clone root value
    const input = screen.getByPlaceholderText('~/Projects')
    fireEvent.change(input, { target: { value: '/new/path' } })

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })
  })

  it('should save clone root when Save Changes is clicked', async () => {
    mockInvoke.mockResolvedValue({ cloneRoot: '/Users/test/Projects' })

    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('~/Projects')).toBeInTheDocument()
    })

    // Change the clone root value
    const input = screen.getByPlaceholderText('~/Projects')
    fireEvent.change(input, { target: { value: '/new/path' } })

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })

    // Mock the update call
    mockInvoke.mockResolvedValueOnce({ cloneRoot: '/new/path' })

    // Click save
    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('system:updateSettings', {
        cloneRoot: '/new/path',
      })
    })

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        type: 'success',
        message: 'Settings saved',
      })
    })
  })

  it('should show error when saving clone root fails', async () => {
    mockInvoke.mockResolvedValue({ cloneRoot: '/Users/test/Projects' })

    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('~/Projects')).toBeInTheDocument()
    })

    // Change the clone root value
    const input = screen.getByPlaceholderText('~/Projects')
    fireEvent.change(input, { target: { value: '/new/path' } })

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })

    // Mock the update call to fail
    mockInvoke.mockRejectedValueOnce(new Error('Save failed'))

    // Click save
    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to save settings',
      })
    })
  })

  it('should show error when clone root is empty', async () => {
    mockInvoke.mockResolvedValue({ cloneRoot: '/Users/test/Projects' })

    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('~/Projects')).toBeInTheDocument()
    })

    // Clear the clone root value
    const input = screen.getByPlaceholderText('~/Projects')
    fireEvent.change(input, { target: { value: '' } })

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })

    // Click save
    fireEvent.click(screen.getByText('Save Changes'))

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Clone root path is required',
      })
    })
  })

  it('should open folder browser when Browse is clicked', async () => {
    mockInvoke.mockResolvedValue({ cloneRoot: '/Users/test/Projects' })

    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Browse')).toBeInTheDocument()
    })

    // Mock the selectFolder call
    mockInvoke.mockResolvedValueOnce({ path: '/selected/folder' })

    // Click browse
    fireEvent.click(screen.getByText('Browse'))

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('system:selectFolder', {
        title: 'Select Clone Root Directory',
        defaultPath: '/Users/test/Projects',
      })
    })
  })

  it('should update clone root when folder is selected', async () => {
    mockInvoke.mockResolvedValue({ cloneRoot: '/Users/test/Projects' })

    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Browse')).toBeInTheDocument()
    })

    // Mock the selectFolder call
    mockInvoke.mockResolvedValueOnce({ path: '/selected/folder' })

    // Click browse
    fireEvent.click(screen.getByText('Browse'))

    await waitFor(() => {
      const input = screen.getByPlaceholderText('~/Projects') as HTMLInputElement
      expect(input.value).toBe('/selected/folder')
    })
  })

  it('should not update clone root when folder selection is cancelled', async () => {
    mockInvoke.mockResolvedValue({ cloneRoot: '/Users/test/Projects' })

    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Browse')).toBeInTheDocument()
    })

    // Mock the selectFolder call returning null (cancelled)
    mockInvoke.mockResolvedValueOnce({ path: null })

    // Click browse
    fireEvent.click(screen.getByText('Browse'))

    await waitFor(() => {
      const input = screen.getByPlaceholderText('~/Projects') as HTMLInputElement
      expect(input.value).toBe('/Users/test/Projects')
    })
  })

  it('should handle browse error gracefully', async () => {
    mockInvoke.mockResolvedValue({ cloneRoot: '/Users/test/Projects' })

    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Browse')).toBeInTheDocument()
    })

    // Mock the selectFolder call to fail
    mockInvoke.mockRejectedValueOnce(new Error('Browse failed'))

    // Click browse - should not throw
    fireEvent.click(screen.getByText('Browse'))

    // Original value should remain
    await waitFor(() => {
      const input = screen.getByPlaceholderText('~/Projects') as HTMLInputElement
      expect(input.value).toBe('/Users/test/Projects')
    })
  })

  it('should show user avatar when available', async () => {
    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      const avatar = screen.getByRole('img')
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.png')
      expect(avatar).toHaveAttribute('alt', 'testuser')
    })
  })

  it('should show login as name when name is not available', async () => {
    mockGitHubState = {
      ...mockGitHubState,
      user: { login: 'onlylogin', name: '', avatarUrl: '' },
    }

    render(<SettingsPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('@onlylogin')).toBeInTheDocument()
    })
  })
})
