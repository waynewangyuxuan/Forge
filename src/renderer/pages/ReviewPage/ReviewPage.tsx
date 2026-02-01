/**
 * ReviewPage
 * Review and approve the generated TODO.md scaffold
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useServerStore, useVersions } from '../../stores/server.store'
import { useRealtimeStore, useScaffold } from '../../stores/realtime.store'
import { Tabs, Tab } from '../../components/primitives/Tabs'
import { Button } from '../../components/primitives/Button'
import { Spinner } from '../../components/primitives/Spinner'
import { Modal } from '../../components/primitives/Modal'
import { TaskList } from '../../components/composites/TaskList'
import { FeedbackPanel } from '../../components/editors/FeedbackPanel'
import { MarkdownEditor } from '../../components/editors/MarkdownEditor'
import { ReviewLayout, ReviewHeader, ReviewBanner } from '../../components/review'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'
import type { IPCResult } from '@shared/types/ipc.types'
import type { ExecutionPlan, Feedback } from '@shared/types/execution.types'
import type { Version } from '@shared/types/project.types'

type ViewTab = 'tasks' | 'raw'

const VIEW_TABS: Tab[] = [
  { key: 'tasks', label: 'Tasks' },
  { key: 'raw', label: 'Raw Markdown' },
]

export const ReviewPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const versions = useVersions(projectId)
  const currentVersionId = useServerStore((s) => (projectId ? s.currentVersionId[projectId] : undefined))
  const updateVersion = useServerStore((s) => s.updateVersion)

  const currentVersion = versions.find((v) => v.id === currentVersionId) ?? versions[0]

  // Scaffold state from realtime store
  const scaffoldState = useScaffold(currentVersionId)
  const subscribeScaffold = useRealtimeStore((s) => s.subscribeScaffold)
  const clearScaffold = useRealtimeStore((s) => s.clearScaffold)

  // State
  const [activeTab, setActiveTab] = useState<ViewTab>('tasks')
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null)
  const [rawContent, setRawContent] = useState('')
  const [savedRawContent, setSavedRawContent] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Regenerate state
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)

  // Ref to store scaffold subscription cleanup function
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Check for unsaved changes (only in raw mode)
  const hasUnsaved = activeTab === 'raw' && rawContent !== savedRawContent
  useUnsavedChanges(hasUnsaved)

  // Load execution plan
  const loadExecutionPlan = useCallback(async () => {
    if (!currentVersionId) return

    try {
      const result = await window.api.invoke('review:getTodo', {
        versionId: currentVersionId,
      }) as IPCResult<ExecutionPlan>

      if (result.ok) {
        setExecutionPlan(result.data)
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks'
      setError(message)
      console.error('Failed to load execution plan:', err)
    }
  }, [currentVersionId])

  // Load raw content
  const loadRawContent = useCallback(async () => {
    if (!currentVersionId) return

    try {
      const result = await window.api.invoke('review:readTodoRaw', {
        versionId: currentVersionId,
      }) as IPCResult<string>

      if (result.ok) {
        setRawContent(result.data)
        setSavedRawContent(result.data)
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load raw content'
      setError(message)
      console.error('Failed to load raw TODO.md:', err)
    }
  }, [currentVersionId])

  // Load feedback
  const loadFeedback = useCallback(async () => {
    if (!currentVersionId) return

    try {
      const result = await window.api.invoke('review:getFeedback', {
        versionId: currentVersionId,
      }) as IPCResult<Feedback | null>

      if (result.ok && result.data) {
        setFeedback(result.data.content)
      }
    } catch (err) {
      console.error('Failed to load feedback:', err)
    }
  }, [currentVersionId])

  // Load all data
  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    await Promise.all([
      loadExecutionPlan(),
      loadRawContent(),
      loadFeedback(),
    ])

    setLoading(false)
  }, [loadExecutionPlan, loadRawContent, loadFeedback])

  // Load initial data
  useEffect(() => {
    if (currentVersionId) {
      loadAll()
    }
  }, [currentVersionId, loadAll])

  // Handle tab change
  const handleTabChange = (key: string) => {
    if (hasUnsaved) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to switch tabs?'
      )
      if (!confirmed) return
    }
    setActiveTab(key as ViewTab)
  }

  // Handle save raw content
  const handleSaveRaw = async () => {
    if (!currentVersionId) return

    setSaving(true)
    setError(null)

    try {
      const result = await window.api.invoke('review:saveTodoRaw', {
        versionId: currentVersionId,
        content: rawContent,
      }) as IPCResult<void>

      if (result.ok) {
        setSavedRawContent(rawContent)
        // Reload execution plan to reflect changes
        await loadExecutionPlan()
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save'
      setError(message)
      console.error('Failed to save raw TODO.md:', err)
    } finally {
      setSaving(false)
    }
  }

  // Handle feedback change
  const handleFeedbackChange = async (newFeedback: string) => {
    setFeedback(newFeedback)

    // Auto-save feedback
    if (currentVersionId && newFeedback.trim()) {
      try {
        await window.api.invoke('review:addFeedback', {
          versionId: currentVersionId,
          feedback: newFeedback,
        })
      } catch (err) {
        console.error('Failed to save feedback:', err)
      }
    }
  }

  // Handle clear feedback
  const handleClearFeedback = async () => {
    setFeedback('')

    if (currentVersionId) {
      try {
        await window.api.invoke('review:clearFeedback', {
          versionId: currentVersionId,
        })
      } catch (err) {
        console.error('Failed to clear feedback:', err)
      }
    }
  }

  // Handle regenerate completion
  useEffect(() => {
    if (scaffoldState?.status === 'completed' && showRegenerateModal) {
      const timer = setTimeout(() => {
        setShowRegenerateModal(false)
        setIsRegenerating(false)
        if (currentVersionId) {
          clearScaffold(currentVersionId)
        }
        // Reload data
        loadAll()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [scaffoldState?.status, showRegenerateModal, currentVersionId, clearScaffold, loadAll])

  // Handle regenerate error
  useEffect(() => {
    if (scaffoldState?.status === 'error' && scaffoldState.error) {
      setRegenerateError(scaffoldState.error)
      setIsRegenerating(false)
    }
  }, [scaffoldState?.status, scaffoldState?.error])

  // Cleanup scaffold subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [])

  // Handle regenerate
  const handleRegenerate = async () => {
    if (!currentVersionId || !feedback.trim()) return

    // Save feedback first
    try {
      await window.api.invoke('review:addFeedback', {
        versionId: currentVersionId,
        feedback: feedback,
      })
    } catch (err) {
      console.error('Failed to save feedback:', err)
    }

    setShowRegenerateModal(true)
    setIsRegenerating(true)
    setRegenerateError(null)

    // Clean up any existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    // Subscribe to scaffold events
    unsubscribeRef.current = subscribeScaffold(currentVersionId)

    try {
      const result = await window.api.invoke('review:regenerate', {
        versionId: currentVersionId,
      }) as IPCResult<void>

      if (!result.ok) {
        setRegenerateError(result.error.message)
        setIsRegenerating(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Regeneration failed'
      setRegenerateError(message)
      setIsRegenerating(false)
    }
  }

  // Handle close regenerate modal
  const handleCloseRegenerateModal = () => {
    if (isRegenerating) {
      const confirmed = window.confirm(
        'Regeneration is in progress. Are you sure you want to close?'
      )
      if (!confirmed) return
    }

    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    setShowRegenerateModal(false)
    setIsRegenerating(false)
    setRegenerateError(null)
    if (currentVersionId) {
      clearScaffold(currentVersionId)
    }
  }

  // Handle approve
  const handleApprove = async () => {
    if (!currentVersionId) return

    setApproving(true)
    setError(null)

    try {
      const result = await window.api.invoke('review:approve', {
        versionId: currentVersionId,
      }) as IPCResult<Version>

      if (result.ok) {
        // Update version in store with new devStatus
        updateVersion(result.data)
        // Navigate to execute page
        navigate(`/projects/${projectId}/execute`)
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve'
      setError(message)
      console.error('Failed to approve:', err)
    } finally {
      setApproving(false)
    }
  }

  // Loading state
  if (!currentVersion) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  // Check if we're in the right state
  const isReviewing = currentVersion.devStatus === 'reviewing'

  const headerActions = activeTab === 'raw' && (
    <Button
      variant={hasUnsaved ? 'primary' : 'secondary'}
      size="sm"
      onClick={handleSaveRaw}
      loading={saving}
      disabled={!hasUnsaved}
    >
      {hasUnsaved ? 'Save Changes' : 'Saved'}
    </Button>
  )

  return (
    <>
    <ReviewLayout
      header={<ReviewHeader title="Review" actions={headerActions} />}
      statusNotice={
        !isReviewing ? (
          <ReviewBanner variant="warning">
            This version is not in the reviewing state. Current status: {currentVersion.devStatus}
          </ReviewBanner>
        ) : undefined
      }
      errorNotice={
        error ? <ReviewBanner variant="error">{error}</ReviewBanner> : undefined
      }
      tabs={
        <Tabs
          tabs={VIEW_TABS}
          activeKey={activeTab}
          onChange={handleTabChange}
          className="mb-4"
        />
      }
      content={
        loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size="lg" />
          </div>
        ) : activeTab === 'tasks' ? (
          <TaskList plan={executionPlan || { milestones: [], totalTasks: 0, completedTasks: 0 }} />
        ) : (
          <MarkdownEditor
            value={rawContent}
            onChange={setRawContent}
            placeholder="TODO.md content..."
            minHeight={400}
            className="h-full"
          />
        )
      }
      feedback={
        isReviewing ? (
          <FeedbackPanel
            feedback={feedback}
            onChange={handleFeedbackChange}
            onRegenerate={handleRegenerate}
            onClear={handleClearFeedback}
            onApprove={handleApprove}
            loading={approving}
            regenerating={isRegenerating}
            disabled={!isReviewing}
          />
        ) : undefined
      }
    >
      {/* children not used; layout handled via props */}
    </ReviewLayout>

      {/* Regenerate Modal */}
      <Modal
        open={showRegenerateModal}
        onClose={handleCloseRegenerateModal}
        title="Regenerating Scaffold"
        width="md"
        footer={
          regenerateError ? (
            <Button variant="secondary" onClick={handleCloseRegenerateModal}>
              Close
            </Button>
          ) : scaffoldState?.status === 'completed' ? (
            <Button
              variant="primary"
              onClick={handleCloseRegenerateModal}
            >
              Done
            </Button>
          ) : null
        }
      >
        <div className="space-y-4">
          {/* Status indicator */}
          <div className="flex items-center gap-3">
            {isRegenerating && scaffoldState?.status !== 'completed' && (
              <Spinner size="sm" />
            )}
            {scaffoldState?.status === 'completed' && (
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {regenerateError && (
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span className="text-[#525252]">
              {scaffoldState?.status === 'completed'
                ? 'Scaffold regenerated successfully!'
                : regenerateError
                  ? 'Regeneration failed'
                  : 'Regenerating based on your feedback...'}
            </span>
          </div>

          {/* Progress messages */}
          {scaffoldState?.messages && scaffoldState.messages.length > 0 && (
            <div className="bg-[#fafafa] rounded-xl p-3 max-h-48 overflow-y-auto">
              <div className="space-y-1 font-mono text-xs text-[#737373]">
                {scaffoldState.messages.map((msg, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-[#a3a3a3]">&gt;</span>
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {regenerateError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {regenerateError}
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
