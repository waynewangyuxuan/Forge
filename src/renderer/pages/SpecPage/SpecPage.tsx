/**
 * SpecPage
 * Edit and preview spec files (PRODUCT.md, TECHNICAL.md, REGULATION.md)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useServerStore, useVersions } from '../../stores/server.store'
import { useRealtimeStore, useScaffold } from '../../stores/realtime.store'
import { Tabs, Tab } from '../../components/primitives/Tabs'
import { Button } from '../../components/primitives/Button'
import { Spinner } from '../../components/primitives/Spinner'
import { Modal } from '../../components/primitives/Modal'
import { MarkdownEditor } from '../../components/editors/MarkdownEditor'
import { MarkdownPreview } from '../../components/editors/MarkdownPreview'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'
import type { SpecFile, IPCResult } from '@shared/types/ipc.types'
import type { GenerateScaffoldResult } from '@shared/types/scaffold.types'

type ViewMode = 'edit' | 'preview'

const SPEC_TABS: Tab[] = [
  { key: 'PRODUCT.md', label: 'PRODUCT' },
  { key: 'TECHNICAL.md', label: 'TECHNICAL' },
  { key: 'REGULATION.md', label: 'REGULATION' },
]

export const SpecPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const versions = useVersions(projectId)
  const currentVersionId = useServerStore((s) => (projectId ? s.currentVersionId[projectId] : undefined))

  const currentVersion = versions.find((v) => v.id === currentVersionId) ?? versions[0]

  // Scaffold state from realtime store
  const scaffoldState = useScaffold(currentVersionId)
  const subscribeScaffold = useRealtimeStore((s) => s.subscribeScaffold)
  const clearScaffold = useRealtimeStore((s) => s.clearScaffold)

  // State
  const [activeTab, setActiveTab] = useState<SpecFile>('PRODUCT.md')
  const [content, setContent] = useState<Record<SpecFile, string>>({
    'PRODUCT.md': '',
    'TECHNICAL.md': '',
    'REGULATION.md': '',
  })
  const [savedContent, setSavedContent] = useState<Record<SpecFile, string>>({
    'PRODUCT.md': '',
    'TECHNICAL.md': '',
    'REGULATION.md': '',
  })
  const [mode, setMode] = useState<ViewMode>('edit')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Scaffold generation state
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // Ref to store scaffold subscription cleanup function
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Check for unsaved changes
  const hasUnsaved = content[activeTab] !== savedContent[activeTab]
  useUnsavedChanges(hasUnsaved)

  // Load content when version changes or tab changes
  const loadContent = useCallback(async (file: SpecFile) => {
    if (!currentVersionId) return

    setLoading(true)
    setError(null)

    try {
      const result = await window.api.invoke('spec:read', {
        versionId: currentVersionId,
        file,
      }) as IPCResult<string>

      if (result.ok) {
        setContent((prev) => ({ ...prev, [file]: result.data }))
        setSavedContent((prev) => ({ ...prev, [file]: result.data }))
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load file'
      setError(message)
      console.error('Failed to load spec file:', err)
    } finally {
      setLoading(false)
    }
  }, [currentVersionId])

  // Load initial content
  useEffect(() => {
    if (currentVersionId) {
      loadContent(activeTab)
    }
  }, [currentVersionId, activeTab, loadContent])

  // Handle tab change
  const handleTabChange = (key: string) => {
    // Check for unsaved changes before switching
    if (hasUnsaved) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to switch tabs?'
      )
      if (!confirmed) return
    }
    setActiveTab(key as SpecFile)
  }

  // Handle save
  const handleSave = async () => {
    if (!currentVersionId) return

    setSaving(true)
    setError(null)

    try {
      await window.api.invoke('spec:save', {
        versionId: currentVersionId,
        file: activeTab,
        content: content[activeTab],
      })
      setSavedContent((prev) => ({ ...prev, [activeTab]: content[activeTab] }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save file'
      setError(message)
      console.error('Failed to save spec file:', err)
    } finally {
      setSaving(false)
    }
  }

  // Handle content change
  const handleContentChange = (newContent: string) => {
    setContent((prev) => ({ ...prev, [activeTab]: newContent }))
  }

  // Toggle view mode
  const toggleMode = () => {
    setMode((prev) => (prev === 'edit' ? 'preview' : 'edit'))
  }

  // Handle scaffold completion - navigate to review page
  useEffect(() => {
    if (scaffoldState?.status === 'completed' && showGenerateModal) {
      // Small delay to show completion status
      const timer = setTimeout(() => {
        setShowGenerateModal(false)
        setIsGenerating(false)
        if (currentVersionId) {
          clearScaffold(currentVersionId)
        }
        // Navigate to review page
        navigate(`/projects/${projectId}/review`)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [scaffoldState?.status, showGenerateModal, projectId, currentVersionId, clearScaffold, navigate])

  // Handle scaffold error
  useEffect(() => {
    if (scaffoldState?.status === 'error' && scaffoldState.error) {
      setGenerateError(scaffoldState.error)
      setIsGenerating(false)
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

  // Start scaffold generation
  const handleGenerateScaffold = async () => {
    if (!currentVersionId) return

    // Check for unsaved changes
    const hasAnyUnsaved = Object.keys(content).some(
      (key) => content[key as SpecFile] !== savedContent[key as SpecFile]
    )
    if (hasAnyUnsaved) {
      const confirmed = window.confirm(
        'You have unsaved changes. Save all files before generating?'
      )
      if (!confirmed) return

      // Save all files with unsaved changes
      for (const file of Object.keys(content) as SpecFile[]) {
        if (content[file] !== savedContent[file]) {
          await window.api.invoke('spec:save', {
            versionId: currentVersionId,
            file,
            content: content[file],
          })
          setSavedContent((prev) => ({ ...prev, [file]: content[file] }))
        }
      }
    }

    // Show modal and start generation
    setShowGenerateModal(true)
    setIsGenerating(true)
    setGenerateError(null)

    // Clean up any existing subscription before creating new one
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    // Subscribe to scaffold events and store cleanup function
    unsubscribeRef.current = subscribeScaffold(currentVersionId)

    try {
      const result = await window.api.invoke('scaffold:generate', {
        versionId: currentVersionId,
      }) as IPCResult<GenerateScaffoldResult>

      if (!result.ok) {
        setGenerateError(result.error.message)
        setIsGenerating(false)
      }
      // Success is handled by the scaffold:completed event
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      setGenerateError(message)
      setIsGenerating(false)
    }
  }

  // Close generate modal
  const handleCloseGenerateModal = () => {
    if (isGenerating) {
      const confirmed = window.confirm(
        'Generation is in progress. Are you sure you want to close?'
      )
      if (!confirmed) return
    }

    // Clean up subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    setShowGenerateModal(false)
    setIsGenerating(false)
    setGenerateError(null)
    if (currentVersionId) {
      clearScaffold(currentVersionId)
    }
  }

  // Check if generation is allowed (requires PRODUCT.md and TECHNICAL.md)
  const canGenerate =
    currentVersion?.devStatus === 'drafting' &&
    savedContent['PRODUCT.md'].trim() !== '' &&
    savedContent['TECHNICAL.md'].trim() !== ''

  // Loading state (no version)
  if (!currentVersion) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-light tracking-tight text-[#1a1a1a]">
          Spec
        </h1>
        <div className="flex items-center gap-3">
          {/* Edit/Preview toggle */}
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleMode}
          >
            {mode === 'edit' ? 'Preview' : 'Edit'}
          </Button>
          {/* Save button */}
          <Button
            variant={hasUnsaved ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={!hasUnsaved}
          >
            {hasUnsaved ? 'Save Changes' : 'Saved'}
          </Button>
          {/* Generate Scaffold button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateScaffold}
            disabled={!canGenerate}
            title={
              !canGenerate
                ? 'Save PRODUCT.md and TECHNICAL.md first'
                : 'Generate task breakdown with AI'
            }
          >
            Generate Scaffold
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={SPEC_TABS}
        activeKey={activeTab}
        onChange={handleTabChange}
        className="mb-4"
      />

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size="lg" />
          </div>
        ) : mode === 'edit' ? (
          <MarkdownEditor
            value={content[activeTab]}
            onChange={handleContentChange}
            placeholder={`Start writing your ${activeTab.replace('.md', '')} spec...`}
            minHeight={500}
            className="h-full"
          />
        ) : (
          <MarkdownPreview
            content={content[activeTab]}
            className="h-full overflow-auto"
          />
        )}
      </div>

      {/* Scaffold Generation Modal */}
      <Modal
        open={showGenerateModal}
        onClose={handleCloseGenerateModal}
        title="Generating Scaffold"
        width="md"
        footer={
          generateError ? (
            <Button variant="secondary" onClick={handleCloseGenerateModal}>
              Close
            </Button>
          ) : scaffoldState?.status === 'completed' ? (
            <Button
              variant="primary"
              onClick={() => navigate(`/projects/${projectId}/review`)}
            >
              View Scaffold
            </Button>
          ) : null
        }
      >
        <div className="space-y-4">
          {/* Status indicator */}
          <div className="flex items-center gap-3">
            {isGenerating && scaffoldState?.status !== 'completed' && (
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
            {generateError && (
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
                ? 'Scaffold generated successfully!'
                : generateError
                  ? 'Generation failed'
                  : 'Generating task breakdown...'}
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
          {generateError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {generateError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
