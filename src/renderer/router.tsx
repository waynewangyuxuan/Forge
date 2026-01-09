/**
 * Router Configuration
 * Defines all application routes
 */

import { createHashRouter, Navigate } from 'react-router-dom'
import { RootLayout } from './RootLayout'
import { ProjectListPage } from './pages/ProjectListPage'
import { ProjectLayout } from './pages/ProjectLayout'
import { OverviewPage } from './pages/OverviewPage'
import { SettingsPage } from './pages/SettingsPage'
import { SpecPage } from './pages/SpecPage'

// Placeholder page for routes not yet implemented
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h2 className="text-xl font-light tracking-tight text-[#1a1a1a] mb-2">{title}</h2>
      <p className="text-[#737373]">This page will be implemented in a future milestone.</p>
    </div>
  </div>
)

export const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Redirect root to projects
      {
        index: true,
        element: <Navigate to="/projects" replace />,
      },
      // Projects list (no sidebar)
      {
        path: 'projects',
        element: <ProjectListPage />,
      },
      // Project pages (with sidebar)
      {
        path: 'projects/:projectId',
        element: <ProjectLayout />,
        children: [
          // Overview (default)
          {
            index: true,
            element: <OverviewPage />,
          },
          // Development flow
          {
            path: 'spec',
            element: <SpecPage />,
          },
          {
            path: 'review',
            element: <PlaceholderPage title="Review" />,
          },
          {
            path: 'execute',
            element: <PlaceholderPage title="Execute" />,
          },
          // Runtime flow
          {
            path: 'runtime',
            element: <PlaceholderPage title="Runtime" />,
          },
          {
            path: 'dashboard',
            element: <PlaceholderPage title="Dashboard" />,
          },
        ],
      },
      // Settings (no sidebar)
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
])
