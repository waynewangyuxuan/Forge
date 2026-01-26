/**
 * RootLayout
 * Main application layout with header and outlet
 */

import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { CreateProjectModal } from './components/composites/CreateProjectModal'
import { DeleteProjectModal } from './components/composites/DeleteProjectModal'

export const RootLayout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-[#faf9f7]">
      <Header />
      <main className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </main>

      {/* Global Modals */}
      <CreateProjectModal />
      <DeleteProjectModal />
    </div>
  )
}
