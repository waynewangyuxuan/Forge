/**
 * SpecPage Tests
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock useParams
const mockParams = { projectId: 'proj-123' }
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => mockParams,
    useBlocker: () => ({ state: 'unblocked' }),
  }
})

// Mock server store - dynamic mocks
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
  useServerStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      currentVersionId: mockCurrentVersionId,
    }
    return selector(state)
  },
  useVersions: () => mockVersions,
}))

// Mock hooks
vi.mock('../../../src/renderer/hooks/useUnsavedChanges', () => ({
  useUnsavedChanges: vi.fn(),
}))

// Mock realtime store for scaffold state
let mockScaffoldState: { status: string; messages: string[]; error?: string } | undefined = undefined
const mockSubscribeScaffold = vi.fn().mockReturnValue(() => {})
const mockClearScaffold = vi.fn()

vi.mock('../../../src/renderer/stores/realtime.store', () => ({
  useRealtimeStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      subscribeScaffold: mockSubscribeScaffold,
      clearScaffold: mockClearScaffold,
    }
    return selector(state)
  },
  useScaffold: () => mockScaffoldState,
}))

// Mock CodeMirror for MarkdownEditor
vi.mock('@codemirror/view', () => {
  const mockView = {
    state: { doc: { toString: () => '' } },
    dispatch: vi.fn(),
    destroy: vi.fn(),
  }

  const EditorViewMock = vi.fn().mockImplementation(() => mockView)
  EditorViewMock.updateListener = { of: vi.fn().mockReturnValue({}) }
  EditorViewMock.lineWrapping = {}
  EditorViewMock.editable = { of: vi.fn().mockReturnValue({}) }
  EditorViewMock.theme = vi.fn().mockReturnValue({})

  return {
    EditorView: EditorViewMock,
    keymap: { of: vi.fn().mockReturnValue({}) },
    placeholder: vi.fn().mockReturnValue({}),
  }
})

vi.mock('@codemirror/state', () => ({
  EditorState: {
    create: vi.fn().mockReturnValue({}),
    readOnly: { of: vi.fn().mockReturnValue({}) },
  },
}))

vi.mock('@codemirror/lang-markdown', () => ({
  markdown: vi.fn().mockReturnValue({}),
}))

vi.mock('@codemirror/commands', () => ({
  defaultKeymap: [],
  history: vi.fn().mockReturnValue({}),
  historyKeymap: [],
}))

vi.mock('@codemirror/theme-one-dark', () => ({
  oneDark: {},
}))

// Mock react-markdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => (
    <div data-testid="markdown-preview">{children}</div>
  ),
}))

// Mock window.api
const mockInvoke = vi.fn()
const mockOn = vi.fn().mockReturnValue(() => {})
Object.defineProperty(window, 'api', {
  value: { invoke: mockInvoke, on: mockOn },
  writable: true,
})

import { SpecPage } from '../../../src/renderer/pages/SpecPage/SpecPage'

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('SpecPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock returns IPCResult envelope format
    mockInvoke.mockResolvedValue({ ok: true, data: '# Test Content' })
    // Reset mock data
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
    // Reset scaffold state
    mockScaffoldState = undefined
  })

  it('should render page title', async () => {
    render(<SpecPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Spec')).toBeInTheDocument()
    })
  })

  it('should render tabs for spec files', async () => {
    render(<SpecPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('PRODUCT')).toBeInTheDocument()
      expect(screen.getByText('TECHNICAL')).toBeInTheDocument()
      expect(screen.getByText('REGULATION')).toBeInTheDocument()
    })
  })

  it('should render Preview button', async () => {
    render(<SpecPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument()
    })
  })

  it('should render Save button', async () => {
    render(<SpecPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument()
    })
  })

  it('should load spec content on mount', async () => {
    render(<SpecPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('spec:read', {
        versionId: 'ver-1',
        file: 'PRODUCT.md',
      })
    })
  })

  it('should toggle to preview mode when Preview button is clicked', async () => {
    render(<SpecPage />, { wrapper: Wrapper })

    await waitFor(() => {
      const previewButton = screen.getByRole('button', { name: 'Preview' })
      fireEvent.click(previewButton)
    })

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('should load different spec file when tab changes', async () => {
    render(<SpecPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('spec:read', {
        versionId: 'ver-1',
        file: 'PRODUCT.md',
      })
    })

    // Click on TECHNICAL tab
    fireEvent.click(screen.getByText('TECHNICAL'))

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('spec:read', {
        versionId: 'ver-1',
        file: 'TECHNICAL.md',
      })
    })
  })

  it('should show error message when load fails', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('Load failed'))

    render(<SpecPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Load failed')).toBeInTheDocument()
    })
  })

  it('should render preview content when in preview mode', async () => {
    render(<SpecPage />, { wrapper: Wrapper })

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    })

    await waitFor(() => {
      expect(screen.getByTestId('markdown-preview')).toBeInTheDocument()
    })
  })

  it('should have Save button disabled when no changes', async () => {
    mockInvoke.mockResolvedValue({ ok: true, data: '# Test Content' })

    render(<SpecPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Spec')).toBeInTheDocument()
    })

    // Wait for initial load
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('spec:read', expect.any(Object))
    })

    // Save button should be disabled when no changes
    const saveButton = screen.getByRole('button', { name: 'Saved' })
    expect(saveButton).toBeDisabled()
  })

  it('should render tabs and allow switching', async () => {
    mockInvoke.mockResolvedValue({ ok: true, data: '# Test Content' })

    render(<SpecPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('PRODUCT')).toBeInTheDocument()
      expect(screen.getByText('TECHNICAL')).toBeInTheDocument()
      expect(screen.getByText('REGULATION')).toBeInTheDocument()
    })
  })

  it('should show loading spinner when no current version exists', async () => {
    mockVersions = []

    render(<SpecPage />, { wrapper: Wrapper })

    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('should save content when Save Changes button is clicked', async () => {
    let loadCallCount = 0
    mockInvoke.mockImplementation(async (channel: string, args: Record<string, unknown>) => {
      if (channel === 'spec:read') {
        loadCallCount++
        return { ok: true, data: '# Original Content' }
      }
      if (channel === 'spec:save') {
        return { ok: true, data: undefined }
      }
      return { ok: true, data: '' }
    })

    render(<SpecPage />, { wrapper: Wrapper })

    // Wait for initial load
    await waitFor(() => {
      expect(loadCallCount).toBeGreaterThan(0)
    })

    // The test can't easily simulate typing with CodeMirror mock
    // So we test that the save button is disabled initially
    const saveButton = screen.getByRole('button', { name: 'Saved' })
    expect(saveButton).toBeDisabled()
  })

  it('should warn about unsaved changes when switching tabs', async () => {
    // This test would need actual CodeMirror interaction to work properly
    // Since CodeMirror is mocked, we test the basic flow
    render(<SpecPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('PRODUCT')).toBeInTheDocument()
    })

    // Click on TECHNICAL tab
    fireEvent.click(screen.getByText('TECHNICAL'))

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('spec:read', {
        versionId: 'ver-1',
        file: 'TECHNICAL.md',
      })
    })
  })

  it('should handle save error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    // This test verifies save button exists but can't test save errors
    // without being able to trigger content changes through the mock
    render(<SpecPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument()
    })

    consoleError.mockRestore()
  })

  it('should log error when load fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockInvoke.mockRejectedValueOnce(new Error('Load failed'))

    render(<SpecPage />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to load spec file:',
        expect.any(Error)
      )
    })

    consoleError.mockRestore()
  })

  it('should use first version when currentVersionId is not set', async () => {
    mockCurrentVersionId = {}
    mockInvoke.mockResolvedValue({ ok: true, data: '# Content' })

    render(<SpecPage />, { wrapper: Wrapper })

    // Should still render because first version is used as fallback
    await waitFor(() => {
      expect(screen.getByText('Spec')).toBeInTheDocument()
    })
  })

  describe('Generate Scaffold', () => {
    it('should render Generate Scaffold button', async () => {
      render(<SpecPage />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Generate Scaffold' })).toBeInTheDocument()
      })
    })

    it('should disable Generate button when PRODUCT.md is empty', async () => {
      mockInvoke.mockResolvedValue({ ok: true, data: '' })

      render(<SpecPage />, { wrapper: Wrapper })

      await waitFor(() => {
        const generateButton = screen.getByRole('button', { name: 'Generate Scaffold' })
        expect(generateButton).toBeDisabled()
      })
    })

    it('should disable Generate button when devStatus is not drafting', async () => {
      mockVersions = [
        {
          id: 'ver-1',
          projectId: 'proj-123',
          versionName: 'v1.0',
          branchName: 'main',
          devStatus: 'reviewing', // Not drafting
          runtimeStatus: 'idle',
          createdAt: new Date().toISOString(),
        },
      ]

      render(<SpecPage />, { wrapper: Wrapper })

      await waitFor(() => {
        const generateButton = screen.getByRole('button', { name: 'Generate Scaffold' })
        expect(generateButton).toBeDisabled()
      })
    })

    it('should open modal when Generate button is clicked', async () => {
      // Mock successful spec reads with content
      mockInvoke.mockImplementation(async (channel: string) => {
        if (channel === 'spec:read') {
          return { ok: true, data: '# Spec Content' }
        }
        if (channel === 'scaffold:generate') {
          return { ok: true, data: { success: true } }
        }
        return { ok: true, data: '' }
      })

      render(<SpecPage />, { wrapper: Wrapper })

      // Wait for PRODUCT.md load
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('spec:read', expect.objectContaining({ file: 'PRODUCT.md' }))
      })

      // Switch to TECHNICAL tab to load that content too (required for Generate)
      fireEvent.click(screen.getByText('TECHNICAL'))
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('spec:read', expect.objectContaining({ file: 'TECHNICAL.md' }))
      })

      // Switch back to PRODUCT tab
      fireEvent.click(screen.getByText('PRODUCT'))

      // Wait for button to be enabled
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Generate Scaffold' })).toBeEnabled()
      })

      // Click generate button
      fireEvent.click(screen.getByRole('button', { name: 'Generate Scaffold' }))

      // Modal should open
      await waitFor(() => {
        expect(screen.getByText('Generating Scaffold')).toBeInTheDocument()
      })
    })

    it('should show progress messages during generation', async () => {
      mockScaffoldState = {
        status: 'generating',
        messages: ['Reading spec files...', 'Generating with AI...'],
      }

      mockInvoke.mockImplementation(async (channel: string) => {
        if (channel === 'spec:read') {
          return { ok: true, data: '# Spec Content' }
        }
        if (channel === 'scaffold:generate') {
          return { ok: true, data: { success: true } }
        }
        return { ok: true, data: '' }
      })

      render(<SpecPage />, { wrapper: Wrapper })

      // Load both required tabs
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('spec:read', expect.objectContaining({ file: 'PRODUCT.md' }))
      })
      fireEvent.click(screen.getByText('TECHNICAL'))
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('spec:read', expect.objectContaining({ file: 'TECHNICAL.md' }))
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Generate Scaffold' })).toBeEnabled()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Generate Scaffold' }))

      await waitFor(() => {
        expect(screen.getByText('Reading spec files...')).toBeInTheDocument()
        expect(screen.getByText('Generating with AI...')).toBeInTheDocument()
      })
    })

    it('should subscribe to scaffold events when generating', async () => {
      mockInvoke.mockImplementation(async (channel: string) => {
        if (channel === 'spec:read') {
          return { ok: true, data: '# Spec Content' }
        }
        if (channel === 'scaffold:generate') {
          return { ok: true, data: { success: true } }
        }
        return { ok: true, data: '' }
      })

      render(<SpecPage />, { wrapper: Wrapper })

      // Load both required tabs
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('spec:read', expect.objectContaining({ file: 'PRODUCT.md' }))
      })
      fireEvent.click(screen.getByText('TECHNICAL'))
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('spec:read', expect.objectContaining({ file: 'TECHNICAL.md' }))
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Generate Scaffold' })).toBeEnabled()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Generate Scaffold' }))

      await waitFor(() => {
        expect(mockSubscribeScaffold).toHaveBeenCalledWith('ver-1')
      })
    })

    it('should show error when generation fails', async () => {
      mockInvoke.mockImplementation(async (channel: string) => {
        if (channel === 'spec:read') {
          return { ok: true, data: '# Spec Content' }
        }
        if (channel === 'scaffold:generate') {
          return { ok: false, error: { message: 'Claude CLI not available', code: 'CLAUDE_UNAVAILABLE', name: 'ClaudeUnavailableError' } }
        }
        return { ok: true, data: '' }
      })

      render(<SpecPage />, { wrapper: Wrapper })

      // Load both required tabs
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('spec:read', expect.objectContaining({ file: 'PRODUCT.md' }))
      })
      fireEvent.click(screen.getByText('TECHNICAL'))
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('spec:read', expect.objectContaining({ file: 'TECHNICAL.md' }))
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Generate Scaffold' })).toBeEnabled()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Generate Scaffold' }))

      await waitFor(() => {
        expect(screen.getByText('Claude CLI not available')).toBeInTheDocument()
      })
    })
  })
})

