/**
 * SettingsPage
 * Application settings with GitHub connection and clone root configuration
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/primitives/Button'
import { Input } from '../../components/primitives/Input'
import { useGitHubAuth } from '../../hooks/useGitHubAuth'
import { useUIStore } from '../../stores/ui.store'
import type { Settings, PushStrategy } from '@shared/types/runtime.types'

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const showToast = useUIStore((s) => s.showToast)
  const github = useGitHubAuth()

  const [settings, setSettings] = useState<Settings | null>(null)
  const [cloneRoot, setCloneRoot] = useState('')
  const [commitOnScaffold, setCommitOnScaffold] = useState(true)
  const [autoCommit, setAutoCommit] = useState(true)
  const [pushStrategy, setPushStrategy] = useState<PushStrategy>('auto')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  // Reset avatar error when user changes
  useEffect(() => {
    setAvatarError(false)
  }, [github.user?.avatarUrl])

  const handleAvatarError = useCallback(() => {
    setAvatarError(true)
  }, [])

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const s = await window.api.invoke('system:getSettings') as Settings
        setSettings(s)
        setCloneRoot(s.cloneRoot)
        setCommitOnScaffold(s.commitOnScaffold ?? true)
        setAutoCommit(s.autoCommitOnMilestone)
        setPushStrategy(s.pushStrategy ?? 'auto')
      } catch (error) {
        console.error('Failed to load settings:', error)
        showToast({ type: 'error', message: 'Failed to load settings' })
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [showToast])

  const handleSaveCloneRoot = async () => {
    if (!cloneRoot.trim()) {
      showToast({ type: 'error', message: 'Clone root path is required' })
      return
    }

    setSaving(true)
    try {
      const updated = await window.api.invoke('system:updateSettings', {
        cloneRoot: cloneRoot.trim(),
      }) as Settings
      setSettings(updated)
      showToast({ type: 'success', message: 'Settings saved' })
    } catch (error) {
      console.error('Failed to save settings:', error)
      showToast({ type: 'error', message: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleBrowse = async () => {
    try {
      const result = await window.api.invoke('system:selectFolder', {
        title: 'Select Clone Root Directory',
        defaultPath: cloneRoot,
      }) as { path: string | null }
      if (result.path) {
        setCloneRoot(result.path)
      }
    } catch (error) {
      console.error('Failed to select folder:', error)
    }
  }

  const handleCommitOnScaffoldChange = async (value: boolean) => {
    setCommitOnScaffold(value)
    try {
      const updated = await window.api.invoke('system:updateSettings', {
        commitOnScaffold: value,
      }) as Settings
      setSettings(updated)
    } catch (error) {
      console.error('Failed to save settings:', error)
      showToast({ type: 'error', message: 'Failed to save settings' })
      setCommitOnScaffold(!value) // Revert on error
    }
  }

  const handleAutoCommitChange = async (value: boolean) => {
    setAutoCommit(value)
    try {
      const updated = await window.api.invoke('system:updateSettings', {
        autoCommitOnMilestone: value,
      }) as Settings
      setSettings(updated)
    } catch (error) {
      console.error('Failed to save settings:', error)
      showToast({ type: 'error', message: 'Failed to save settings' })
      setAutoCommit(!value) // Revert on error
    }
  }

  const handlePushStrategyChange = async (value: PushStrategy) => {
    const oldValue = pushStrategy
    setPushStrategy(value)
    // Also update autoPush for backwards compatibility
    const newAutoPush = value === 'auto'
    try {
      const updated = await window.api.invoke('system:updateSettings', {
        pushStrategy: value,
        autoPush: newAutoPush,
      }) as Settings
      setSettings(updated)
    } catch (error) {
      console.error('Failed to save settings:', error)
      showToast({ type: 'error', message: 'Failed to save settings' })
      setPushStrategy(oldValue) // Revert on error
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          icon={
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          }
        >
          Back
        </Button>
        <h1 className="text-2xl font-light text-stone-900">Settings</h1>
      </div>

      {loading ? (
        <div className="bg-stone-50 rounded-xl p-6 text-center text-stone-500">
          Loading settings...
        </div>
      ) : (
        <div className="space-y-6">
          {/* GitHub Connection */}
          <section className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100">
              <h2 className="text-lg font-medium text-stone-900">GitHub Connection</h2>
              <p className="text-sm text-stone-500 mt-1">
                Forge uses the GitHub CLI (gh) for repository operations
              </p>
            </div>
            <div className="px-6 py-4">
              {github.loading ? (
                <div className="text-stone-500">Checking GitHub connection...</div>
              ) : !github.available ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium">GitHub CLI not found</span>
                  </div>
                  <p className="text-sm text-stone-600">
                    Install the GitHub CLI from{' '}
                    <a
                      href="https://cli.github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline"
                    >
                      cli.github.com
                    </a>{' '}
                    and run <code className="bg-stone-100 px-1 rounded">gh auth login</code>
                  </p>
                  <Button variant="secondary" size="sm" onClick={github.refresh}>
                    Check Again
                  </Button>
                </div>
              ) : !github.authenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium">Not authenticated</span>
                  </div>
                  <p className="text-sm text-stone-600">
                    Run <code className="bg-stone-100 px-1 rounded">gh auth login</code> in your terminal
                    to authenticate with GitHub.
                  </p>
                  <Button variant="secondary" size="sm" onClick={github.refresh}>
                    Check Again
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {github.user?.avatarUrl && !avatarError ? (
                      <img
                        src={github.user.avatarUrl}
                        alt={github.user.login}
                        className="w-10 h-10 rounded-full"
                        onError={handleAvatarError}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-medium">
                        {github.user?.login?.charAt(0).toUpperCase() || 'G'}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-stone-900">
                        {github.user?.name || github.user?.login}
                      </div>
                      <div className="text-sm text-stone-500">@{github.user?.login}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Clone Root */}
          <section className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100">
              <h2 className="text-lg font-medium text-stone-900">Projects Location</h2>
              <p className="text-sm text-stone-500 mt-1">
                Directory where new projects will be cloned
              </p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={cloneRoot}
                    onChange={setCloneRoot}
                    placeholder="~/Projects"
                    disabled={saving}
                  />
                </div>
                <Button variant="secondary" onClick={handleBrowse} disabled={saving}>
                  Browse
                </Button>
              </div>
              {cloneRoot !== settings?.cloneRoot && (
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    onClick={handleSaveCloneRoot}
                    loading={saving}
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Git Integration */}
          <section className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100">
              <h2 className="text-lg font-medium text-stone-900">Git Integration</h2>
              <p className="text-sm text-stone-500 mt-1">
                Configure automatic git commits and push behavior
              </p>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Commit on scaffold toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-stone-900">Commit on scaffold generation</div>
                  <div className="text-sm text-stone-500">
                    Automatically commit changes after scaffold generation completes
                  </div>
                </div>
                <button
                  onClick={() => handleCommitOnScaffoldChange(!commitOnScaffold)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    commitOnScaffold ? 'bg-amber-500' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      commitOnScaffold ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Auto-commit on milestone toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-stone-900">Commit on milestone completion</div>
                  <div className="text-sm text-stone-500">
                    Automatically commit changes when a milestone is completed
                  </div>
                </div>
                <button
                  onClick={() => handleAutoCommitChange(!autoCommit)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoCommit ? 'bg-amber-500' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoCommit ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Push strategy selector */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-stone-900">Push strategy</div>
                  <div className="text-sm text-stone-500">
                    How to handle pushing commits to remote
                  </div>
                </div>
                <select
                  value={pushStrategy}
                  onChange={(e) => handlePushStrategyChange(e.target.value as PushStrategy)}
                  className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="auto">Auto (push after commit)</option>
                  <option value="manual">Manual (you push later)</option>
                  <option value="disabled">Disabled (never push)</option>
                </select>
              </div>
            </div>
          </section>

          {/* App Info */}
          <section className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100">
              <h2 className="text-lg font-medium text-stone-900">About</h2>
            </div>
            <div className="px-6 py-4 text-sm text-stone-600">
              <p>Forge - AI-powered project generation</p>
              <p className="text-stone-400 mt-1">Version 0.1.0</p>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
