/**
 * RootLayout
 * Main application layout with header and outlet
 */

import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { CreateProjectModal } from './components/composites/CreateProjectModal'

export const RootLayout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-stone-50">
      <Header />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Global Modals */}
      <CreateProjectModal />
    </div>
  )
}
