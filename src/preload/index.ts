import { contextBridge, ipcRenderer } from 'electron'

export interface FileNode {
  name: string
  path: string
  relativePath: string
  isDir: boolean
  children?: FileNode[]
}

export interface EnvVariable {
  key: string
  value: string
  enabled: boolean
}

export interface Environment {
  id: string
  name: string
  variables: EnvVariable[]
}

export interface EnvironmentsData {
  active: string
  environments: Environment[]
}

export interface DbProfile {
  id: string
  name: string
  type: 'sqlite' | 'postgres' | 'mysql'
  database?: string
  host?: string
  port?: number
  user?: string
  password?: string
  ssl?: boolean
}

export interface DbQueryResult {
  success: boolean
  rows?: any[]
  rowCount?: number
  fields?: string[]
  durationMs: number
  error?: string
}

export interface IElectronAPI {
  runTest: (options: { filePath: string; headless: boolean }) => Promise<{ success: boolean; message?: string }>
  stopTest: () => Promise<void>
  recordTest: (url?: string) => Promise<{ success: boolean; message?: string }>
  onTestOutput: (callback: (data: { type: 'stdout' | 'stderr' | 'status' | 'result'; text: string; data?: any }) => void) => () => void
  getProjectTree: () => Promise<FileNode[]>
  createFolder: (folderPath: string) => Promise<boolean>
  createReferenceProject: (projectName: string) => Promise<boolean>
  deleteItem: (itemPath: string) => Promise<boolean>
  renameItem: (itemPath: string, newName: string) => Promise<{ success: boolean; newPath: string }>
  importProject: () => Promise<{ success: boolean; projectName: string } | null>
  exportProject: (relativePath: string) => Promise<{ success: boolean; destPath: string } | null>
  readFile: (filePath: string) => Promise<string>
  writeFile: (filePath: string, content: string) => Promise<boolean>
  runApiRequest: (req: { url: string; method: string; headers?: Record<string, string>; body?: string }) => Promise<{
    status: number
    statusText: string
    timeMs: number
    headers: Record<string, string>
    data: any
  }>
  getSystemMetrics: () => Promise<{ memoryMB: number; platform: string }>

  // Multi-Environment & Variable System
  getEnvironments: () => Promise<EnvironmentsData>
  saveEnvironments: (data: EnvironmentsData) => Promise<{ success: boolean; error?: string }>
  setActiveEnvironment: (envId: string) => Promise<{ success: boolean }>
  resolveVariables: (text: string, envId?: string) => Promise<string>

  // Database Testing & Query Runner
  getDbProfiles: () => Promise<DbProfile[]>
  saveDbProfiles: (profiles: DbProfile[]) => Promise<{ success: boolean; error?: string }>
  testDbConnection: (profile: DbProfile) => Promise<{ success: boolean; message: string }>
  runDbQuery: (profileOrId: DbProfile | string, sql: string, params?: any[]) => Promise<DbQueryResult>

  // Persistent Auth State Management
  getAuthProfiles: () => Promise<{ id: string; name: string; file: string }[]>
  recordAuthSession: (options: { url: string; profileName: string }) => Promise<{ success: boolean; profileName?: string; error?: string }>
  deleteAuthProfile: (profileName: string) => Promise<{ success: boolean }>
}

const api: IElectronAPI = {
  runTest: (options) => ipcRenderer.invoke('test:run', options),
  stopTest: () => ipcRenderer.invoke('test:stop'),
  recordTest: (url) => ipcRenderer.invoke('test:record', url),
  onTestOutput: (callback) => {
    const subscription = (_: any, data: any) => callback(data)
    ipcRenderer.on('test:output', subscription)
    return () => ipcRenderer.removeListener('test:output', subscription)
  },
  getProjectTree: () => ipcRenderer.invoke('project:tree'),
  createFolder: (folderPath) => ipcRenderer.invoke('project:createFolder', folderPath),
  createReferenceProject: (projectName) => ipcRenderer.invoke('project:createReference', projectName),
  deleteItem: (itemPath) => ipcRenderer.invoke('project:delete', itemPath),
  renameItem: (itemPath, newName) => ipcRenderer.invoke('project:rename', itemPath, newName),
  importProject: () => ipcRenderer.invoke('project:import'),
  exportProject: (relativePath) => ipcRenderer.invoke('project:export', relativePath),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('file:write', filePath, content),
  runApiRequest: (req) => ipcRenderer.invoke('api:request', req),
  getSystemMetrics: () => ipcRenderer.invoke('system:metrics'),

  // Environment & Variables
  getEnvironments: () => ipcRenderer.invoke('env:get'),
  saveEnvironments: (data) => ipcRenderer.invoke('env:save', data),
  setActiveEnvironment: (envId) => ipcRenderer.invoke('env:setActive', envId),
  resolveVariables: (text, envId) => ipcRenderer.invoke('env:resolve', text, envId),

  // Database Testing & Query Runner
  getDbProfiles: () => ipcRenderer.invoke('db:getProfiles'),
  saveDbProfiles: (profiles) => ipcRenderer.invoke('db:saveProfiles', profiles),
  testDbConnection: (profile) => ipcRenderer.invoke('db:testConnection', profile),
  runDbQuery: (profileOrId, sql, params) => ipcRenderer.invoke('db:query', profileOrId, sql, params),

  // Persistent Auth State Management
  getAuthProfiles: () => ipcRenderer.invoke('auth:listProfiles'),
  recordAuthSession: (options) => ipcRenderer.invoke('auth:recordSession', options),
  deleteAuthProfile: (profileName) => ipcRenderer.invoke('auth:deleteProfile', profileName)
}

contextBridge.exposeInMainWorld('api', api)
