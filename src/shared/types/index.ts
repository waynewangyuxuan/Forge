// Shared type definitions between main and renderer processes
// This file will be populated as we build out the application

export interface Project {
  id: string
  name: string
  path: string
  createdAt: string
  updatedAt: string
  archived: boolean
}

export interface Version {
  id: string
  projectId: string
  versionName: string
  branchName: string
  devStatus: DevStatus
  createdAt: string
}

export type DevStatus =
  | 'drafting'
  | 'scaffolding'
  | 'reviewing'
  | 'ready'
  | 'executing'
  | 'paused'
  | 'completed'
  | 'error'
