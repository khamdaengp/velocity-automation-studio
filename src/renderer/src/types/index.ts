export interface FileNode {
  name: string
  path: string
  relativePath: string
  isDir: boolean
  children?: FileNode[]
}

export interface LogEntry {
  id: string
  type: 'stdout' | 'stderr' | 'status' | 'result'
  text: string
  timestamp: string
}

export interface ApiTestState {
  url: string
  method: string
  headers: string
  body: string
  response?: {
    status: number
    statusText: string
    timeMs: number
    headers: Record<string, string>
    data: any
  }
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
