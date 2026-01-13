import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// Type definitions for the API exposed to renderer
export interface IElectronAPI {
  invoke: (channel: string, data?: unknown) => Promise<unknown>
  on: (channel: string, callback: (data: unknown) => void) => () => void
  once: (channel: string, callback: (data: unknown) => void) => void
}

// Expose API to renderer process
const api: IElectronAPI = {
  // Request-response pattern
  // All IPC handlers now return IPCResult<T> envelope, no throwing
  invoke: async (channel: string, data?: unknown) => {
    return await ipcRenderer.invoke(channel, data)
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
