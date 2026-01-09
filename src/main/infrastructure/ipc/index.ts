/**
 * IPC Handlers Registration
 * Central entry point for all IPC handler registration
 */

import { registerProjectHandlers } from './project.ipc'
import { registerVersionHandlers } from './version.ipc'
import { registerSystemHandlers } from './system.ipc'
import { registerGitHubHandlers } from './github.ipc'

/**
 * Register all IPC handlers
 * Call this once during app initialization
 */
export function registerAllIPCHandlers(): void {
  registerProjectHandlers()
  registerVersionHandlers()
  registerSystemHandlers()
  registerGitHubHandlers()

  // Future handlers will be registered here:
  // registerSpecHandlers()
  // registerReviewHandlers()
  // registerExecutionHandlers()
  // registerRuntimeHandlers()
  // registerDashboardHandlers()
  // registerCredentialsHandlers()
  // registerShellHandlers()
}

// Re-export individual registrations for testing
export { registerProjectHandlers } from './project.ipc'
export { registerVersionHandlers } from './version.ipc'
export { registerSystemHandlers } from './system.ipc'
export { registerGitHubHandlers } from './github.ipc'
