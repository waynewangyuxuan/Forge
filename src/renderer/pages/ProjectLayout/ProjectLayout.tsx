/**
 * ProjectLayout
 * Layout wrapper for project pages, includes sidebar
 */

import React, { useEffect } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useServerStore, useProject, useVersions } from '../../stores/server.store'
import { Spinner } from '../../components/primitives/Spinner'
import { Sidebar } from '../../components/layout/Sidebar'

export const ProjectLayout: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const project = useProject(projectId)
  const versions = useVersions(projectId)
  const currentVersionId = useServerStore((s) => (projectId ? s.currentVersionId[projectId] : undefined))
  const fetchProjects = useServerStore((s) => s.fetchProjects)
  const fetchVersions = useServerStore((s) => s.fetchVersions)
  const setCurrentVersion = useServerStore((s) => s.setCurrentVersion)
  const loading = useServerStore((s) => s.loading.projects)

  // Fetch projects if not loaded
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Fetch versions when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchVersions(projectId)
    }
  }, [projectId, fetchVersions])

  // Set current version to first one if not set
  useEffect(() => {
    if (projectId && versions.length > 0 && !currentVersionId) {
      setCurrentVersion(projectId, versions[0].id)
    }
  }, [projectId, versions, currentVersionId, setCurrentVersion])

  const handleVersionChange = (versionId: string) => {
    if (projectId) {
      setCurrentVersion(projectId, versionId)
    }
  }

  // Loading state
  if (loading && !project) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  // Project not found
  if (!loading && !project && projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-light tracking-tight text-[#1a1a1a] mb-2">
            Project not found
          </h2>
          <p className="text-[#737373]">
            The project you are looking for does not exist.
          </p>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="flex h-full">
      <Sidebar
        project={project}
        versions={versions}
        currentVersionId={currentVersionId}
        onVersionChange={handleVersionChange}
      />
      <div className="flex-1 overflow-auto">
        <Outlet context={{ projectId, project, currentVersionId }} />
      </div>
    </div>
  )
}

/**
 * Hook to access project context in nested routes
 */
export function useProjectContext() {
  return useParams<{ projectId: string }>()
}
