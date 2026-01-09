/**
 * ProjectCard Component
 * Displays a project in the project list
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project, Version } from '@shared/types/project.types'
import { Card } from '../../primitives/Card'
import { Badge } from '../../primitives/Badge'
import { Button } from '../../primitives/Button'

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

  const handleOpen = () => {
    navigate(`/projects/${project.id}`)
  }

  const handleOpenInEditor = (e: React.MouseEvent) => {
    e.stopPropagation()
    onOpenInEditor?.()
  }

  const devStatus = activeVersion?.devStatus ?? 'drafting'
  const runtimeStatus = activeVersion?.runtimeStatus ?? 'not_configured'

  return (
    <Card hover onClick={handleOpen} className="h-full">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-stone-900 truncate">
              {project.name}
            </h3>
            <p className="text-xs text-stone-500 truncate mt-0.5">
              {project.path}
            </p>
          </div>
          {activeVersion && (
            <Badge variant="default" size="sm" className="ml-2 flex-shrink-0">
              {activeVersion.versionName}
            </Badge>
          )}
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Development Status */}
          <div>
            <p className="text-xs text-stone-500 mb-1">Development</p>
            <Badge variant={devStatusVariant[devStatus]} size="md">
              {devStatusText[devStatus]}
            </Badge>
          </div>

          {/* Runtime Status */}
          <div>
            <p className="text-xs text-stone-500 mb-1">Runtime</p>
            <Badge variant={runtimeStatusVariant[runtimeStatus]} size="md">
              {runtimeStatusText[runtimeStatus]}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-stone-100">
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
        </div>
      </div>
    </Card>
  )
}
