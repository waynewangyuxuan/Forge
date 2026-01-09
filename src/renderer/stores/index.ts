/**
 * Zustand Stores barrel export
 * Central entry point for all state management
 */

// Server Store - IPC data (projects, versions, settings, credentials)
export {
  useServerStore,
  useProject,
  useVersions,
  useCurrentVersion,
} from './server.store'

// Realtime Store - Live updates (scaffold, execution, runtime)
export {
  useRealtimeStore,
  useScaffold,
  useActiveExecution,
  useActiveRun,
} from './realtime.store'
export type { ScaffoldState, ExecutionState, RunState } from './realtime.store'

// UI Store - UI state (modals, sidebar, toasts)
export {
  useUIStore,
  useModalOpen,
  useConfirmDialog,
  useSidebar,
  useToasts,
} from './ui.store'
export type { ModalName, Toast } from './ui.store'
