/**
 * Modal Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '../../../src/renderer/components/primitives/Modal/Modal'

describe('Modal', () => {
  it('should not render when open is false', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Test">
        <div>Modal content</div>
      </Modal>
    )

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('should render when open is true', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test">
        <div>Modal content</div>
      </Modal>
    )

    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('should render title', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test Title">
        <div>Content</div>
      </Modal>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} onClose={onClose} title="Test">
        <div>Content</div>
      </Modal>
    )

    // Click backdrop (the div with aria-hidden="true")
    const backdrop = document.querySelector('[aria-hidden="true"]')
    if (backdrop) {
      fireEvent.click(backdrop)
    }

    expect(onClose).toHaveBeenCalled()
  })

  it('should not call onClose when modal content is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} onClose={onClose} title="Test">
        <div>Content</div>
      </Modal>
    )

    fireEvent.click(screen.getByText('Content'))

    expect(onClose).not.toHaveBeenCalled()
  })

  it('should call onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} onClose={onClose} title="Test">
        <div>Content</div>
      </Modal>
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalled()
  })

  it('should render close button', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test">
        <div>Content</div>
      </Modal>
    )

    expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} onClose={onClose} title="Test">
        <div>Content</div>
      </Modal>
    )

    fireEvent.click(screen.getByLabelText('Close modal'))

    expect(onClose).toHaveBeenCalled()
  })

  it('should handle different width sizes', () => {
    const { rerender } = render(
      <Modal open={true} onClose={() => {}} title="Test" width="sm">
        <div>Content</div>
      </Modal>
    )

    let dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('max-w-md')

    rerender(
      <Modal open={true} onClose={() => {}} title="Test" width="md">
        <div>Content</div>
      </Modal>
    )
    dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('max-w-lg')

    rerender(
      <Modal open={true} onClose={() => {}} title="Test" width="lg">
        <div>Content</div>
      </Modal>
    )
    dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('max-w-xl')
  })

  it('should render footer when provided', () => {
    render(
      <Modal
        open={true}
        onClose={() => {}}
        title="Test"
        footer={<button>Save</button>}
      >
        <div>Content</div>
      </Modal>
    )

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('should have correct aria attributes', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test Modal">
        <div>Content</div>
      </Modal>
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
  })
})
