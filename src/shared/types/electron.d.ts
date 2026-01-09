/**
 * Electron API type declarations
 * Provides types for window.api exposed via preload script
 */

/**
 * Electron API interface exposed to renderer
 */
export interface IElectronAPI {
  /**
   * Invoke an IPC handler and wait for response
   */
  invoke: (channel: string, data?: unknown) => Promise<unknown>

  /**
   * Subscribe to events from main process
   * Returns unsubscribe function
   */
  on: (channel: string, callback: (data: unknown) => void) => () => void

  /**
   * One-time event listener
   */
  once: (channel: string, callback: (data: unknown) => void) => void
}

// Extend Window interface globally
declare global {
  interface Window {
    api: IElectronAPI
  }
}

// This export is needed to make this a module
export {}
