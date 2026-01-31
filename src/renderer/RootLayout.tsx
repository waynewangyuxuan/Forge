/**
 * RootLayout
 * Main application layout with header and outlet
 */

import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { CreateProjectModal } from './components/composites/CreateProjectModal'
import { DeleteProjectModal } from './components/composites/DeleteProjectModal'
import { StaleExecutionModal } from './components/composites/StaleExecutionModal'
import { useServerStore } from './stores/server.store'
import type { IPCResult } from '@shared/types/ipc.types'

export const RootLayout: React.FC = () => {
  const staleExecutions = useServerStore((s) => s.staleExecutions)
  const checkStaleExecutions = useServerStore((s) => s.checkStaleExecutions)
  const clearStaleExecution = useServerStore((s) => s.clearStaleExecution)

  // Check for stale executions on mount
  useEffect(() => {
    checkStaleExecutions()
  }, [checkStaleExecutions])

  // Handle resume stale execution
  const handleResumeStale = async (executionId: string) => {
    const result = await window.api.invoke('execution:resume', {
      executionId,
    }) as IPCResult<void>

    if (!result.ok) {
      throw new Error(result.error.message)
    }
  }

  // Handle abort stale execution
  const handleAbortStale = async (executionId: string) => {
    const result = await window.api.invoke('execution:abort', {
      executionId,
    }) as IPCResult<void>

    if (!result.ok) {
      throw new Error(result.error.message)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#faf9f7]">
      <Header />
      <main className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </main>

      {/* Global Modals */}
      <CreateProjectModal />
      <DeleteProjectModal />

      {/* Stale Execution Recovery Modal */}
      <StaleExecutionModal
        executions={staleExecutions}
        onResume={handleResumeStale}
        onAbort={handleAbortStale}
        onDismiss={clearStaleExecution}
      />
    </div>
  )
}
