/**
 * FeedbackPanel Component
 * Textarea for feedback input with action buttons
 */

import React from 'react'
import { Button } from '../../primitives/Button'

export interface FeedbackPanelProps {
  feedback: string
  onChange: (feedback: string) => void
  onRegenerate: () => void
  onClear: () => void
  onApprove: () => void
  loading?: boolean
  regenerating?: boolean
  disabled?: boolean
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  feedback,
  onChange,
  onRegenerate,
  onClear,
  onApprove,
  loading = false,
  regenerating = false,
  disabled = false,
}) => {
  const isDisabled = disabled || loading || regenerating
  const hasContent = feedback.trim().length > 0

  return (
    <div className="border border-stone-200 rounded-lg bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-200 bg-stone-50 rounded-t-lg">
        <h3 className="text-sm font-medium text-stone-700">Feedback</h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Provide feedback to regenerate the task list, or approve to continue
        </p>
      </div>

      {/* Textarea */}
      <div className="p-4">
        <textarea
          value={feedback}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your feedback here... (e.g., 'Add more granular tasks for testing', 'Split the authentication milestone into smaller tasks')"
          disabled={isDisabled}
          className="w-full h-32 px-3 py-2 text-sm border border-stone-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-stone-50 disabled:text-stone-500 placeholder:text-stone-400"
        />
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-stone-200 bg-stone-50 rounded-b-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClear}
            disabled={isDisabled || !hasContent}
          >
            Clear
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRegenerate}
            disabled={isDisabled || !hasContent}
            loading={regenerating}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onApprove}
            disabled={isDisabled}
            loading={loading}
          >
            Approve
          </Button>
        </div>
      </div>
    </div>
  )
}
