import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// Type definitions for the API exposed to renderer
export interface IElectronAPI {
  invoke: (channel: string, data?: unknown) => Promise<unknown>
  on: (channel: string, callback: (data: unknown) => void) => () => void
  once: (channel: string, callback: (data: unknown) => void) => void
}

/**
 * Custom error class that preserves error properties across IPC
 */
class IPCError extends Error {
  code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'IPCError'
    this.code = code
  }
}

// Expose API to renderer process
const api: IElectronAPI = {
  // Request-response pattern with error handling
  invoke: async (channel: string, data?: unknown) => {
    try {
      return await ipcRenderer.invoke(channel, data)
    } catch (error) {
      // Electron serializes errors but loses custom properties
      // The error message from our serializeError should contain useful info
      const err = error as { message?: string; code?: string }
      const message = err.message || String(error)

      // Try to extract code from error if it's our serialized format
      // Our serializeError throws { message, code, name }
      const code = err.code || undefined

      // Create a proper error with code property
      const ipcError = new IPCError(message, code)
      throw ipcError
    }
  },

  // Subscribe to events from main process
  on: (channel: string, callback: (data: unknown) => void) => {
    const subscription = (_event: IpcRendererEvent, data: unknown) => callback(data)
    ipcRenderer.on(channel, subscription)
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },

  // One-time event listener
  once: (channel: string, callback: (data: unknown) => void) => {
    ipcRenderer.once(channel, (_event, data) => callback(data))
  }
}

// Expose in main world
contextBridge.exposeInMainWorld('api', api)

// Type declaration for window.api
declare global {
  interface Window {
    api: IElectronAPI
  }
}
