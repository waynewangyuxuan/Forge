/**
 * IPC Handlers Registration
 * Central entry point for all IPC handler registration
 */

import { registerProjectHandlers } from './project.ipc'
import { registerVersionHandlers } from './version.ipc'
import { registerSystemHandlers } from './system.ipc'
import { registerGitHubHandlers } from './github.ipc'
import { registerSpecHandlers } from './spec.ipc'
import { registerScaffoldHandlers } from './scaffold.ipc'
import { registerReviewHandlers } from './review.ipc'
import { registerExecutionHandlers } from './execution.ipc'

/**
 * Register all IPC handlers
 * Call this once during app initialization
 */
export function registerAllIPCHandlers(): void {
  registerProjectHandlers()
  registerVersionHandlers()
  registerSystemHandlers()
  registerGitHubHandlers()
  registerSpecHandlers()
  registerScaffoldHandlers()
  registerReviewHandlers()
  registerExecutionHandlers()

  // Future handlers will be registered here:
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
export { registerSpecHandlers } from './spec.ipc'
export { registerScaffoldHandlers } from './scaffold.ipc'
export { registerReviewHandlers } from './review.ipc'
export { registerExecutionHandlers } from './execution.ipc'
