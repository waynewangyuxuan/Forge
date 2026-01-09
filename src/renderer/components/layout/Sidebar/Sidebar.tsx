/**
 * Sidebar Component
 * Navigation sidebar for project pages
 */

import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import type { Project, Version } from '@shared/types/project.types'
import { useSidebar } from '../../../stores/ui.store'
import { Badge } from '../../primitives/Badge'

export interface SidebarProps {
  project: Project
  versions: Version[]
  currentVersionId?: string
  onVersionChange: (versionId: string) => void
}

// Navigation items
const devNavItems = [
  { path: '', label: 'Overview', icon: 'home' },
  { path: 'spec', label: 'Spec', icon: 'document' },
  { path: 'review', label: 'Review', icon: 'check' },
  { path: 'execute', label: 'Execute', icon: 'play' },
]

const runtimeNavItems = [
  { path: 'runtime', label: 'Runtime', icon: 'server' },
  { path: 'dashboard', label: 'Dashboard', icon: 'chart' },
]

// Icon components
const icons: Record<string, React.FC<{ className?: string }>> = {
  home: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  document: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  check: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  play: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  server: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  ),
  chart: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  back: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  ),
  chevron: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
    </svg>
  ),
}

export const Sidebar: React.FC<SidebarProps> = ({
  project,
  versions,
  currentVersionId,
  onVersionChange,
}) => {
  const navigate = useNavigate()
  const { collapsed, toggle } = useSidebar()

  const currentVersion = versions.find((v) => v.id === currentVersionId)

  if (collapsed) {
    // Collapsed sidebar - just icons
    return (
      <aside className="w-14 bg-white border-r border-stone-200 flex flex-col">
        <button
          onClick={toggle}
          className="p-4 hover:bg-stone-50 transition-colors"
          aria-label="Expand sidebar"
        >
          <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </aside>
    )
  }

  return (
    <aside className="w-56 bg-white border-r border-stone-200 flex flex-col">
      {/* Project Header */}
      <div className="p-4 border-b border-stone-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-stone-900 truncate">{project.name}</h2>
          <button
            onClick={toggle}
            className="p-1 rounded hover:bg-stone-100 transition-colors"
            aria-label="Collapse sidebar"
          >
            <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Version Selector */}
        <div className="relative">
          <select
            value={currentVersionId || ''}
            onChange={(e) => onVersionChange(e.target.value)}
            className="w-full appearance-none bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-sm text-stone-700 pr-8 focus:outline-none focus:ring-2 focus:ring-amber-200"
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.versionName}
              </option>
            ))}
          </select>
          <icons.chevron className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
        </div>

        {/* Current Status */}
        {currentVersion && (
          <div className="mt-2">
            <Badge
              variant={currentVersion.devStatus === 'completed' ? 'success' : 'default'}
              size="sm"
            >
              {currentVersion.devStatus}
            </Badge>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {/* Development Section */}
        <div className="px-3 py-2">
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            Development
          </span>
        </div>
        {devNavItems.map((item) => (
          <NavItem key={item.path} {...item} projectId={project.id} />
        ))}

        {/* Runtime Section */}
        <div className="px-3 py-2 mt-4">
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            Runtime
          </span>
        </div>
        {runtimeNavItems.map((item) => (
          <NavItem key={item.path} {...item} projectId={project.id} />
        ))}
      </nav>

      {/* Back to Projects */}
      <div className="p-3 border-t border-stone-200">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
        >
          <icons.back className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
      </div>
    </aside>
  )
}

// Navigation item component
const NavItem: React.FC<{
  path: string
  label: string
  icon: string
  projectId: string
}> = ({ path, label, icon, projectId }) => {
  const Icon = icons[icon]
  const to = path ? `/projects/${projectId}/${path}` : `/projects/${projectId}`

  return (
    <NavLink
      to={to}
      end={!path}
      className={({ isActive }) =>
        `flex items-center gap-3 mx-2 px-3 py-2 text-sm rounded-lg transition-colors ${
          isActive
            ? 'bg-amber-50 text-amber-700 font-medium'
            : 'text-stone-600 hover:bg-stone-50'
        }`
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
  )
}
