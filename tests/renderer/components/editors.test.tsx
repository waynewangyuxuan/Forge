/**
 * Editor Components Tests
 * Tests for MarkdownEditor and MarkdownPreview
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock CodeMirror modules for MarkdownEditor
vi.mock('@codemirror/view', () => {
  const mockView = {
    state: { doc: { toString: () => '' } },
    dispatch: vi.fn(),
    destroy: vi.fn(),
  }

  const EditorViewMock = vi.fn().mockImplementation(() => mockView)
  // Add static methods
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

// Mock react-markdown for MarkdownPreview
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => (
    <div data-testid="markdown-content">{children}</div>
  ),
}))

import { MarkdownEditor } from '../../../src/renderer/components/editors/MarkdownEditor/MarkdownEditor'
import { MarkdownPreview } from '../../../src/renderer/components/editors/MarkdownPreview/MarkdownPreview'

describe('MarkdownPreview', () => {
  it('should render empty state when no content', () => {
    render(<MarkdownPreview content="" />)

    expect(screen.getByText('No content to preview')).toBeInTheDocument()
  })

  it('should render markdown content when provided', () => {
    render(<MarkdownPreview content="# Hello World" />)

    expect(screen.getByTestId('markdown-content')).toBeInTheDocument()
    expect(screen.getByText('# Hello World')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <MarkdownPreview content="Test" className="custom-class" />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should have displayName', () => {
    expect(MarkdownPreview.displayName).toBe('MarkdownPreview')
  })

  it('should render complex markdown', () => {
    const markdown = `
# Title
## Subtitle
- List item 1
- List item 2
    `
    render(<MarkdownPreview content={markdown} />)

    expect(screen.getByTestId('markdown-content')).toHaveTextContent('Title')
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('List item 1')
  })
})

describe('MarkdownEditor', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render container element', () => {
    const { container } = render(<MarkdownEditor {...defaultProps} />)

    expect(container.querySelector('div')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <MarkdownEditor {...defaultProps} className="custom-editor" />
    )

    expect(container.firstChild).toHaveClass('custom-editor')
  })

  it('should apply readOnly styling when readOnly is true', () => {
    const { container } = render(
      <MarkdownEditor {...defaultProps} readOnly={true} />
    )

    expect(container.firstChild).toHaveClass('bg-[#faf9f7]')
  })

  it('should not apply readOnly styling when readOnly is false', () => {
    const { container } = render(
      <MarkdownEditor {...defaultProps} readOnly={false} />
    )

    expect(container.firstChild).toHaveClass('bg-white')
  })

  it('should have displayName', () => {
    expect(MarkdownEditor.displayName).toBe('MarkdownEditor')
  })

  it('should render with different minHeight values', () => {
    const { container, rerender } = render(
      <MarkdownEditor {...defaultProps} minHeight={200} />
    )

    expect(container.firstChild).toBeInTheDocument()

    rerender(<MarkdownEditor {...defaultProps} minHeight={600} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should handle placeholder prop', () => {
    const { container } = render(
      <MarkdownEditor {...defaultProps} placeholder="Enter markdown..." />
    )

    expect(container.firstChild).toBeInTheDocument()
  })

  it('should handle darkMode prop', () => {
    const { container } = render(
      <MarkdownEditor {...defaultProps} darkMode={true} />
    )

    expect(container.firstChild).toBeInTheDocument()
  })
})
