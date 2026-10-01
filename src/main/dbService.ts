import fs from 'fs'
import path from 'path'
import { Client as PgClient } from 'pg'
import mysql from 'mysql2/promise'

export type DbType = 'sqlite' | 'postgres' | 'mysql'

export interface DbProfile {
  id: string
  name: string
  type: DbType
  database?: string // SQLite file path (or memory), or PG/MySQL db name
  host?: string
  port?: number
  user?: string
  password?: string
  ssl?: boolean
}

export interface QueryResult {
  success: boolean
  rows?: any[]
  rowCount?: number
  fields?: string[]
  durationMs: number
  error?: string
}

const DEFAULT_PROFILES: DbProfile[] = [
  {
    id: 'sqlite-local',
    name: 'Built-in SQLite (Demo)',
    type: 'sqlite',
    database: ':memory:'
  },
  {
    id: 'pg-local',
    name: 'Local PostgreSQL',
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '',
    database: 'postgres'
  },
  {
    id: 'mysql-local',
    name: 'Local MySQL',
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'test'
  }
]

export class DbService {
  private workspaceDir: string
  private filePath: string

  constructor(workspaceDir: string) {
    this.workspaceDir = workspaceDir
    this.filePath = path.join(this.workspaceDir, 'databases.json')
    this.ensureInitialized()
  }

  private ensureInitialized(): void {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify(DEFAULT_PROFILES, null, 2), 'utf8')
      }
    } catch (err) {
      console.error('Failed to initialize databases.json:', err)
    }
  }

  public getProfiles(): DbProfile[] {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8')
        return JSON.parse(raw)
      }
    } catch (err) {
      console.error('Error reading databases.json:', err)
    }
    return DEFAULT_PROFILES
  }

  public saveProfiles(profiles: DbProfile[]): { success: boolean; error?: string } {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(profiles, null, 2), 'utf8')
      return { success: true }
    } catch (err: any) {
      console.error('Error saving databases.json:', err)
      return { success: false, error: err.message }
    }
  }

  public getProfileById(id: string): DbProfile | undefined {
    const list = this.getProfiles()
    return list.find((p) => p.id === id)
  }

  public async testConnection(profile: DbProfile): Promise<{ success: boolean; message: string }> {
    const start = Date.now()
    try {
      if (profile.type === 'sqlite') {
        const { DatabaseSync } = await import('node:sqlite')
        let dbPath = profile.database || ':memory:'
        if (dbPath !== ':memory:' && !path.isAbsolute(dbPath)) {
          dbPath = path.resolve(this.workspaceDir, dbPath)
        }
        const db = new DatabaseSync(dbPath)
        db.exec('SELECT 1;')
        db.close()
        return { success: true, message: `Connected to SQLite successfully in ${Date.now() - start}ms` }
      }

      if (profile.type === 'postgres') {
        const client = new PgClient({
          host: profile.host || 'localhost',
          port: profile.port || 5432,
          user: profile.user || 'postgres',
          password: profile.password || '',
          database: profile.database || 'postgres',
          connectionTimeoutMillis: 4000,
          ssl: profile.ssl ? { rejectUnauthorized: false } : undefined
        })
        await client.connect()
        const res = await client.query('SELECT 1 as connected;')
        await client.end()
        return { success: true, message: `Connected to PostgreSQL successfully in ${Date.now() - start}ms` }
      }

      if (profile.type === 'mysql') {
        const conn = await mysql.createConnection({
          host: profile.host || 'localhost',
          port: profile.port || 3306,
          user: profile.user || 'root',
          password: profile.password || '',
          database: profile.database || undefined,
          connectTimeout: 4000
        })
        await conn.execute('SELECT 1 as connected;')
        await conn.end()
        return { success: true, message: `Connected to MySQL successfully in ${Date.now() - start}ms` }
      }

      return { success: false, message: `Unsupported database type: ${profile.type}` }
    } catch (err: any) {
      return { success: false, message: `Connection failed: ${err.message}` }
    }
  }

  public async runQuery(
    profileOrId: DbProfile | string,
    sql: string,
    params: any[] = []
  ): Promise<QueryResult> {
    const start = Date.now()
    const profile = typeof profileOrId === 'string' ? this.getProfileById(profileOrId) : profileOrId

    if (!profile) {
      return {
        success: false,
        durationMs: 0,
        error: `Database profile not found: ${profileOrId}`
      }
    }

    try {
      if (profile.type === 'sqlite') {
        const { DatabaseSync } = await import('node:sqlite')
        let dbPath = profile.database || ':memory:'
        if (dbPath !== ':memory:' && !path.isAbsolute(dbPath)) {
          dbPath = path.resolve(this.workspaceDir, dbPath)
        }
        const db = new DatabaseSync(dbPath)
        try {
          const trimmed = sql.trim()
          if (trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('PRAGMA')) {
            const stmt = db.prepare(sql)
            const rows = stmt.all(...params)
            const durationMs = Date.now() - start
            const fields = rows.length > 0 ? Object.keys(rows[0]) : []
            return {
              success: true,
              rows,
              rowCount: rows.length,
              fields,
              durationMs
            }
          } else {
            // Exec DDL or DML (INSERT, UPDATE, CREATE, DROP)
            db.exec(sql)
            const durationMs = Date.now() - start
            return {
              success: true,
              rows: [],
              rowCount: 0,
              fields: [],
              durationMs
            }
          }
        } finally {
          db.close()
        }
      }

      if (profile.type === 'postgres') {
        const client = new PgClient({
          host: profile.host || 'localhost',
          port: profile.port || 5432,
          user: profile.user || 'postgres',
          password: profile.password || '',
          database: profile.database || 'postgres',
          connectionTimeoutMillis: 5000,
          ssl: profile.ssl ? { rejectUnauthorized: false } : undefined
        })
        await client.connect()
        try {
          const res = await client.query(sql, params)
          const durationMs = Date.now() - start
          const fields = res.fields ? res.fields.map((f) => f.name) : []
          return {
            success: true,
            rows: res.rows || [],
            rowCount: res.rowCount ?? (res.rows ? res.rows.length : 0),
            fields,
            durationMs
          }
        } finally {
          await client.end()
        }
      }

      if (profile.type === 'mysql') {
        const conn = await mysql.createConnection({
          host: profile.host || 'localhost',
          port: profile.port || 3306,
          user: profile.user || 'root',
          password: profile.password || '',
          database: profile.database || undefined,
          connectTimeout: 5000
        })
        try {
          const [result, fields] = await conn.execute(sql, params)
          const durationMs = Date.now() - start
          const rows = Array.isArray(result) ? result : []
          const fieldNames = fields ? fields.map((f: any) => f.name) : rows.length > 0 ? Object.keys(rows[0]) : []
          return {
            success: true,
            rows,
            rowCount: rows.length,
            fields: fieldNames,
            durationMs
          }
        } finally {
          await conn.end()
        }
      }

      return {
        success: false,
        durationMs: Date.now() - start,
        error: `Unsupported database engine: ${profile.type}`
      }
    } catch (err: any) {
      return {
        success: false,
        durationMs: Date.now() - start,
        error: err.message
      }
    }
  }
}
