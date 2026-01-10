/**
 * SpecPage
 * Edit and preview spec files (PRODUCT.md, TECHNICAL.md, REGULATION.md)
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useServerStore, useVersions } from '../../stores/server.store'
import { Tabs, Tab } from '../../components/primitives/Tabs'
import { Button } from '../../components/primitives/Button'
import { Spinner } from '../../components/primitives/Spinner'
import { MarkdownEditor } from '../../components/editors/MarkdownEditor'
import { MarkdownPreview } from '../../components/editors/MarkdownPreview'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'
import type { SpecFile } from '@shared/types/ipc.types'

type ViewMode = 'edit' | 'preview'

const SPEC_TABS: Tab[] = [
  { key: 'PRODUCT.md', label: 'PRODUCT' },
  { key: 'TECHNICAL.md', label: 'TECHNICAL' },
  { key: 'REGULATION.md', label: 'REGULATION' },
]

export const SpecPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const versions = useVersions(projectId)
  const currentVersionId = useServerStore((s) => (projectId ? s.currentVersionId[projectId] : undefined))

  const currentVersion = versions.find((v) => v.id === currentVersionId) ?? versions[0]

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
      })
      setContent((prev) => ({ ...prev, [file]: result }))
      setSavedContent((prev) => ({ ...prev, [file]: result }))
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
    </div>
  )
}
