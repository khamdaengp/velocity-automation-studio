import fs from 'fs'
import path from 'path'

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

const DEFAULT_ENV_DATA: EnvironmentsData = {
  active: 'dev',
  environments: [
    {
      id: 'dev',
      name: 'Development',
      variables: [
        { key: 'baseUrl', value: 'http://localhost:3000', enabled: true },
        { key: 'apiUrl', value: 'http://localhost:3000/api', enabled: true },
        { key: 'testUser', value: 'dev_tester@example.com', enabled: true }
      ]
    },
    {
      id: 'staging',
      name: 'Staging',
      variables: [
        { key: 'baseUrl', value: 'https://staging.example.com', enabled: true },
        { key: 'apiUrl', value: 'https://staging.example.com/api', enabled: true },
        { key: 'testUser', value: 'stage_tester@example.com', enabled: true }
      ]
    },
    {
      id: 'prod',
      name: 'Production',
      variables: [
        { key: 'baseUrl', value: 'https://example.com', enabled: true },
        { key: 'apiUrl', value: 'https://api.example.com', enabled: true },
        { key: 'testUser', value: 'prod_smoke@example.com', enabled: true }
      ]
    }
  ]
}

export class EnvService {
  private workspaceDir: string
  private filePath: string

  constructor(workspaceDir: string) {
    this.workspaceDir = workspaceDir
    this.filePath = path.join(this.workspaceDir, 'environments.json')
    this.ensureInitialized()
  }

  private ensureInitialized(): void {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify(DEFAULT_ENV_DATA, null, 2), 'utf8')
      }
    } catch (err) {
      console.error('Failed to initialize environments.json:', err)
    }
  }

  public getEnvironments(): EnvironmentsData {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8')
        return JSON.parse(raw)
      }
    } catch (err) {
      console.error('Error reading environments.json:', err)
    }
    return DEFAULT_ENV_DATA
  }

  public saveEnvironments(data: EnvironmentsData): { success: boolean; error?: string } {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8')
      return { success: true }
    } catch (err: any) {
      console.error('Error saving environments.json:', err)
      return { success: false, error: err.message }
    }
  }

  public getActiveEnvironment(): Environment | null {
    const data = this.getEnvironments()
    return data.environments.find((e) => e.id === data.active) || data.environments[0] || null
  }

  public setActiveEnvironment(envId: string): { success: boolean } {
    const data = this.getEnvironments()
    data.active = envId
    this.saveEnvironments(data)
    return { success: true }
  }

  public resolveVariables(input: string, envId?: string): string {
    if (!input || typeof input !== 'string') return input
    const data = this.getEnvironments()
    const targetEnv = envId
      ? data.environments.find((e) => e.id === envId)
      : data.environments.find((e) => e.id === data.active) || data.environments[0]

    if (!targetEnv || !targetEnv.variables) return input

    let resolved = input
    for (const v of targetEnv.variables) {
      if (v.enabled && v.key) {
        const regex = new RegExp(`\\{\\{${v.key}\\}\\}`, 'g')
        resolved = resolved.replace(regex, v.value)
      }
    }
    return resolved
  }
}
