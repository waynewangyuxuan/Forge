/**
 * OverviewPage
 * Project overview showing development and runtime status
 */

import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProject, useVersions, useServerStore } from '../../stores/server.store'
import { Card } from '../../components/primitives/Card'
import { Badge } from '../../components/primitives/Badge'
import { Button } from '../../components/primitives/Button'
import { Spinner } from '../../components/primitives/Spinner'

// Dev status display configuration
const devStatusConfig: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
  drafting: { variant: 'default', label: 'Drafting' },
  scaffolding: { variant: 'info', label: 'Scaffolding' },
  reviewing: { variant: 'info', label: 'Reviewing' },
  ready: { variant: 'info', label: 'Ready' },
  executing: { variant: 'warning', label: 'Executing' },
  paused: { variant: 'default', label: 'Paused' },
  completed: { variant: 'success', label: 'Completed' },
  error: { variant: 'error', label: 'Error' },
}

// Runtime status display configuration
const runtimeStatusConfig: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
  not_configured: { variant: 'default', label: 'Not Configured' },
  idle: { variant: 'info', label: 'Idle' },
  running: { variant: 'warning', label: 'Running' },
  success: { variant: 'success', label: 'Success' },
  failed: { variant: 'error', label: 'Failed' },
}

export const OverviewPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const project = useProject(projectId)
  const versions = useVersions(projectId)
  const currentVersionId = useServerStore((s) => (projectId ? s.currentVersionId[projectId] : undefined))

  const currentVersion = versions.find((v) => v.id === currentVersionId) ?? versions[0]

  // Loading state
  if (!project || !currentVersion) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  const devStatus = devStatusConfig[currentVersion.devStatus] ?? devStatusConfig.drafting
  const runtimeStatus = runtimeStatusConfig[currentVersion.runtimeStatus] ?? runtimeStatusConfig.not_configured

  const handleOpenInEditor = async () => {
    try {
      await window.api.invoke('shell:openInEditor', { path: project.path })
    } catch (error) {
      console.error('Failed to open in editor:', error)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">{project.name}</h1>
        <p className="text-sm text-stone-500 mt-1">{project.path}</p>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Development Status Card */}
        <Card
          header={{
            title: 'Development',
            actions: <Badge variant={devStatus.variant}>{devStatus.label}</Badge>,
          }}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs text-stone-500 mb-1">Version</p>
              <p className="text-sm font-medium text-stone-900">
                {currentVersion.versionName} ({currentVersion.branchName})
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/projects/${projectId}/spec`)}
              >
                {currentVersion.devStatus === 'drafting' ? 'Start Writing' : 'Continue'}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleOpenInEditor}>
                Open in VSCode
              </Button>
            </div>
          </div>
        </Card>

        {/* Runtime Status Card */}
        <Card
          header={{
            title: 'Runtime',
            actions: <Badge variant={runtimeStatus.variant}>{runtimeStatus.label}</Badge>,
          }}
        >
          <div className="space-y-4">
            {currentVersion.runtimeStatus === 'not_configured' ? (
              <p className="text-sm text-stone-500">
                Runtime is not configured yet. Complete development first, then configure how your
                project should run.
              </p>
            ) : (
              <div>
                <p className="text-xs text-stone-500 mb-1">Trigger Mode</p>
                <p className="text-sm font-medium text-stone-900">Manual</p>
              </div>
            )}

            <div className="flex gap-2">
              {currentVersion.devStatus === 'completed' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/projects/${projectId}/runtime`)}
                >
                  {currentVersion.runtimeStatus === 'not_configured' ? 'Configure' : 'Run Now'}
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/projects/${projectId}/dashboard`)}
              >
                Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Version History */}
      <Card header={{ title: 'Version History' }}>
        <div className="divide-y divide-stone-100">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`py-3 flex items-center justify-between ${
                version.id === currentVersionId ? 'bg-amber-50 -mx-4 px-4' : ''
              }`}
            >
              <div>
                <p className="text-sm font-medium text-stone-900">
                  {version.versionName}
                  {version.id === currentVersionId && (
                    <span className="ml-2 text-xs text-amber-600">(current)</span>
                  )}
                </p>
                <p className="text-xs text-stone-500">
                  Branch: {version.branchName}
                </p>
              </div>
              <Badge
                variant={devStatusConfig[version.devStatus]?.variant ?? 'default'}
                size="sm"
              >
                {devStatusConfig[version.devStatus]?.label ?? version.devStatus}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
