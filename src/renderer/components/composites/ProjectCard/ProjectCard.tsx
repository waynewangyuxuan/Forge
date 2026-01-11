/**
 * ProjectCard Component
 * Displays a project in the project list
 * Shows inactive state when local files don't exist
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project, Version } from '@shared/types/project.types'
import { Card } from '../../primitives/Card'
import { Badge } from '../../primitives/Badge'
import { Button } from '../../primitives/Button'
import { useUIStore } from '../../../stores/ui.store'
import { useServerStore } from '../../../stores/server.store'

export interface ProjectCardProps {
  project: Project
  activeVersion?: Version
  onOpenInEditor?: () => void
}

// Map dev status to badge variant
const devStatusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  drafting: 'default',
  scaffolding: 'info',
  reviewing: 'info',
  ready: 'info',
  executing: 'warning',
  paused: 'default',
  completed: 'success',
  error: 'error',
}

// Map dev status to display text
const devStatusText: Record<string, string> = {
  drafting: 'Drafting',
  scaffolding: 'Scaffolding...',
  reviewing: 'Reviewing',
  ready: 'Ready',
  executing: 'Executing',
  paused: 'Paused',
  completed: 'Completed',
  error: 'Error',
}

// Map runtime status to badge variant
const runtimeStatusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  not_configured: 'default',
  idle: 'info',
  running: 'warning',
  success: 'success',
  failed: 'error',
}

// Map runtime status to display text
const runtimeStatusText: Record<string, string> = {
  not_configured: 'Not configured',
  idle: 'Idle',
  running: 'Running',
  success: 'Success',
  failed: 'Failed',
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  activeVersion,
  onOpenInEditor,
}) => {
  const navigate = useNavigate()
  const openModal = useUIStore((s) => s.openModal)
  const showToast = useUIStore((s) => s.showToast)
  const activateProject = useServerStore((s) => s.activateProject)
  const [activating, setActivating] = useState(false)

  // Check if project has local files (defaults to true for backwards compatibility)
  const hasLocalFiles = project.hasLocalFiles !== false
  const isInactive = !hasLocalFiles

  const handleOpen = () => {
    if (isInactive) return // Don't navigate if inactive
    navigate(`/projects/${project.id}`)
  }

  const handleOpenInEditor = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isInactive) return
    onOpenInEditor?.()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    openModal('deleteProject', {
      projectId: project.id,
      projectName: project.name,
      hasGitHub: Boolean(project.githubOwner && project.githubRepo),
    })
  }

  const handleActivate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setActivating(true)
    try {
      await activateProject(project.id)
      showToast({
        type: 'success',
        message: `Project "${project.name}" activated successfully`,
      })
    } catch (error) {
      console.error('Failed to activate project:', error)
      showToast({
        type: 'error',
        message: 'Failed to activate project. Make sure GitHub CLI is authenticated.',
      })
    } finally {
      setActivating(false)
    }
  }

  const devStatus = activeVersion?.devStatus ?? 'drafting'
  const runtimeStatus = activeVersion?.runtimeStatus ?? 'not_configured'

  return (
    <Card
      hover={!isInactive}
      onClick={isInactive ? undefined : handleOpen}
      className={`h-full ${isInactive ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className={`text-base font-medium truncate ${isInactive ? 'text-stone-500' : 'text-[#1a1a1a]'}`}>
              {project.name}
            </h3>
            <p className="text-xs text-[#a3a3a3] truncate mt-0.5 font-mono">
              {project.path}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            {isInactive && (
              <Badge variant="warning" size="sm">
                Inactive
              </Badge>
            )}
            {activeVersion && (
              <Badge variant="default" size="sm">
                {activeVersion.versionName}
              </Badge>
            )}
          </div>
        </div>

        {/* Status Grid */}
        <div className={`grid grid-cols-2 gap-4 mb-4 ${isInactive ? 'opacity-50' : ''}`}>
          {/* Development Status */}
          <div>
            <p className="text-xs text-[#a3a3a3] uppercase tracking-wider mb-1">Development</p>
            <Badge variant={devStatusVariant[devStatus]} size="md">
              {devStatusText[devStatus]}
            </Badge>
          </div>

          {/* Runtime Status */}
          <div>
            <p className="text-xs text-[#a3a3a3] uppercase tracking-wider mb-1">Runtime</p>
            <Badge variant={runtimeStatusVariant[runtimeStatus]} size="md">
              {runtimeStatusText[runtimeStatus]}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-[#f0f0f0]">
          {isInactive ? (
            // Show Activate button for inactive projects
            <Button
              variant="primary"
              size="sm"
              onClick={handleActivate}
              loading={activating}
              className="flex-1 bg-amber-500 hover:bg-amber-600"
            >
              Activate
            </Button>
          ) : (
            // Show normal buttons for active projects
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpen}
                className="flex-1"
              >
                Open
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenInEditor}
              >
                VSCode
              </Button>
            </>
          )}
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-[#a3a3a3] hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Delete project"
          >
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  )
}
