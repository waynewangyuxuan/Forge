/**
 * ProjectListPage
 * Main landing page showing all projects
 */

import React, { useEffect } from 'react'
import { useServerStore, useVersions } from '../../stores/server.store'
import { useUIStore } from '../../stores/ui.store'
import { Button } from '../../components/primitives/Button'
import { Spinner } from '../../components/primitives/Spinner'
import { ProjectCard } from '../../components/composites/ProjectCard'

/**
 * Wrapper to get the active version for a project
 */
const ProjectCardWithVersion: React.FC<{
  projectId: string
  onOpenInEditor: () => void
}> = ({ projectId, onOpenInEditor }) => {
  const project = useServerStore((s) => s.projects.find((p) => p.id === projectId))
  const versions = useVersions(projectId)
  const currentVersionId = useServerStore((s) => s.currentVersionId[projectId])
  const fetchVersions = useServerStore((s) => s.fetchVersions)
  const setCurrentVersion = useServerStore((s) => s.setCurrentVersion)

  // Fetch versions if not loaded
  useEffect(() => {
    if (versions.length === 0) {
      fetchVersions(projectId)
    }
  }, [projectId, versions.length, fetchVersions])

  // Set current version to first one if not set
  useEffect(() => {
    if (versions.length > 0 && !currentVersionId) {
      setCurrentVersion(projectId, versions[0].id)
    }
  }, [projectId, versions, currentVersionId, setCurrentVersion])

  if (!project) return null

  const activeVersion = versions.find((v) => v.id === currentVersionId) ?? versions[0]

  return (
    <ProjectCard
      project={project}
      activeVersion={activeVersion}
      onOpenInEditor={onOpenInEditor}
    />
  )
}

export const ProjectListPage: React.FC = () => {
  const projects = useServerStore((s) => s.projects.filter((p) => !p.archivedAt))
  const loading = useServerStore((s) => s.loading.projects)
  const fetchProjects = useServerStore((s) => s.fetchProjects)
  const openModal = useUIStore((s) => s.openModal)

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleNewProject = () => {
    openModal('createProject')
  }

  const handleOpenInEditor = async (path: string) => {
    try {
      await window.api.invoke('shell:openInEditor', { path })
    } catch (error) {
      console.error('Failed to open in editor:', error)
    }
  }

  // Loading state
  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">My Projects</h1>
        <Button variant="primary" onClick={handleNewProject}>
          + New Project
        </Button>
      </div>

      {/* Empty state */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-stone-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-stone-900 mb-2">
            No projects yet
          </h2>
          <p className="text-stone-500 mb-6 max-w-sm">
            Create your first project to get started. Describe what you want to
            build and let AI generate the code for you.
          </p>
          <Button variant="primary" onClick={handleNewProject}>
            Create your first project
          </Button>
        </div>
      ) : (
        /* Project grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCardWithVersion
              key={project.id}
              projectId={project.id}
              onOpenInEditor={() => handleOpenInEditor(project.path)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
