import React, { useState, useEffect } from 'react'
import {
  Database,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  CheckCheck,
  RefreshCw,
  Server,
  Code2,
  Terminal,
  FileCode
} from 'lucide-react'
import { DbProfile, DbQueryResult } from '../types'

export const DatabaseStudio: React.FC = () => {
  const [profiles, setProfiles] = useState<DbProfile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')
  const [query, setQuery] = useState<string>('SELECT 1 as id, "Velocity Automation Studio" as name, "Database Ready" as status;')
  const [result, setResult] = useState<DbQueryResult | null>(null)
  const [isExecuting, setIsExecuting] = useState<boolean>(false)
  const [connectionStatus, setConnectionStatus] = useState<{ id: string; success: boolean; message: string } | null>(null)
  const [copiedCode, setCopiedCode] = useState<boolean>(false)

  // Edit / Add profile modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingProfile, setEditingProfile] = useState<DbProfile>({
    id: '',
    name: 'New Database Connection',
    type: 'sqlite',
    database: ':memory:'
  })

  const loadProfiles = async () => {
    try {
      // @ts-ignore
      const list: DbProfile[] = await window.api.getDbProfiles()
      if (list && list.length > 0) {
        setProfiles(list)
        if (!selectedProfileId || !list.find((p) => p.id === selectedProfileId)) {
          setSelectedProfileId(list[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to load database profiles:', err)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) || profiles[0]

  const handleTestConnection = async (profile: DbProfile) => {
    setConnectionStatus({ id: profile.id, success: false, message: 'Testing connection...' })
    try {
      // @ts-ignore
      const res = await window.api.testDbConnection(profile)
      setConnectionStatus({ id: profile.id, success: res.success, message: res.message })
    } catch (err: any) {
      setConnectionStatus({ id: profile.id, success: false, message: err.message })
    }
  }

  const handleRunQuery = async () => {
    if (!selectedProfile) return
    setIsExecuting(true)
    setResult(null)
    try {
      // @ts-ignore
      const res: DbQueryResult = await window.api.runDbQuery(selectedProfile.id, query)
      setResult(res)
    } catch (err: any) {
      setResult({
        success: false,
        durationMs: 0,
        error: err.message
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!editingProfile.name.trim()) return
    const id = editingProfile.id || `db-${Date.now()}`
    const profileToSave: DbProfile = { ...editingProfile, id }

    let updated: DbProfile[] = []
    if (profiles.some((p) => p.id === id)) {
      updated = profiles.map((p) => (p.id === id ? profileToSave : p))
    } else {
      updated = [...profiles, profileToSave]
    }

    try {
      // @ts-ignore
      await window.api.saveDbProfiles(updated)
      setProfiles(updated)
      setSelectedProfileId(id)
      setIsModalOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this database connection profile?')) return
    const updated = profiles.filter((p) => p.id !== id)
    try {
      // @ts-ignore
      await window.api.saveDbProfiles(updated)
      setProfiles(updated)
      if (selectedProfileId === id && updated.length > 0) {
        setSelectedProfileId(updated[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCopyTestSnippet = () => {
    if (!selectedProfile) return
    const escapedQuery = query.replace(/`/g, '\\`')
    const snippet = `// Database verification step\nconst rows = await db.query('${selectedProfile.id}', \`${escapedQuery}\`);\nconsole.log('DB Records:', rows.length);\nif (rows.length === 0) throw new Error('Expected database records to exist!');`
    navigator.clipboard.writeText(snippet)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleSampleQuery = (type: string) => {
    if (type === 'count') {
      setQuery('SELECT count(*) as total_count FROM users;')
    } else if (type === 'select') {
      setQuery('SELECT * FROM users ORDER BY id DESC LIMIT 10;')
    } else if (type === 'sqlite-create') {
      setQuery('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT);\nINSERT INTO users (name, email) VALUES ("Test User", "test@velocity.studio");\nSELECT * FROM users;')
    }
  }

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      height: '100%',
      backgroundColor: '#1e1e1e',
      color: '#cccccc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Left: Connection Profiles Sidebar */}
      <div style={{
        width: '280px',
        backgroundColor: '#18181b',
        borderRight: '1px solid #2d2d2d',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #2d2d2d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#f8fafc', fontSize: '13px' }}>
            <Database size={16} color="#38bdf8" />
            Database Connections
          </div>
          <button
            onClick={() => {
              setEditingProfile({
                id: '',
                name: 'New Database Connection',
                type: 'sqlite',
                database: ':memory:'
              })
              setIsModalOpen(true)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              color: '#38bdf8',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 500
            }}
            title="Add database connection profile"
          >
            <Plus size={13} />
            New
          </button>
        </div>

        {/* Profiles List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {profiles.map((p) => {
            const isSelected = p.id === selectedProfileId
            const status = connectionStatus?.id === p.id ? connectionStatus : null

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProfileId(p.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: isSelected ? '#27272a' : 'transparent',
                  cursor: 'pointer',
                  marginBottom: '6px',
                  border: isSelected ? '1px solid #3f3f46' : '1px solid transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 600, color: isSelected ? '#ffffff' : '#d4d4d8', fontSize: '13px' }}>
                    {p.name}
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: p.type === 'sqlite' ? '#38bdf8' : p.type === 'postgres' ? '#60a5fa' : '#f59e0b',
                    backgroundColor: '#1f2937',
                    padding: '2px 5px',
                    borderRadius: '3px'
                  }}>
                    {p.type}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>
                  {p.type === 'sqlite' ? (p.database || ':memory:') : `${p.host || 'localhost'}:${p.port || 5432}/${p.database || ''}`}
                </div>

                {/* Connection Status & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTestConnection(p)
                    }}
                    style={{
                      backgroundColor: '#27272a',
                      border: '1px solid #3f3f46',
                      color: '#cbd5e1',
                      borderRadius: '3px',
                      padding: '2px 6px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    Test Ping
                  </button>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingProfile(p)
                        setIsModalOpen(true)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#a1a1aa',
                        fontSize: '10px',
                        cursor: 'pointer',
                        padding: '2px 4px'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProfile(p.id)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        fontSize: '10px',
                        cursor: 'pointer',
                        padding: '2px 4px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {status && (
                  <div style={{
                    marginTop: '6px',
                    fontSize: '10px',
                    color: status.success ? '#4ade80' : '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {status.success ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                    {status.message}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Right: SQL Editor & Query Results */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Query Toolbar */}
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#18181b',
          borderBottom: '1px solid #2d2d2d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
              Query Editor: <span style={{ color: '#38bdf8' }}>{selectedProfile?.name || 'No connection'}</span>
            </span>

            {/* Quick Templates */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleSampleQuery('select')}
                style={{
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  color: '#a1a1aa',
                  borderRadius: '3px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                SELECT *
              </button>
              <button
                onClick={() => handleSampleQuery('count')}
                style={{
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  color: '#a1a1aa',
                  borderRadius: '3px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                SELECT count
              </button>
              {selectedProfile?.type === 'sqlite' && (
                <button
                  onClick={() => handleSampleQuery('sqlite-create')}
                  style={{
                    backgroundColor: '#27272a',
                    border: '1px solid #3f3f46',
                    color: '#38bdf8',
                    borderRadius: '3px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Create & Seed Demo Table
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleCopyTestSnippet}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#27272a',
                border: '1px solid #3f3f46',
                color: '#cbd5e1',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500
              }}
              title="Copy JavaScript code snippet to use in your automation tests"
            >
              {copiedCode ? <CheckCheck size={14} color="#4ade80" /> : <Code2 size={14} />}
              Copy Test Step
            </button>

            <button
              onClick={handleRunQuery}
              disabled={isExecuting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#15803d',
                border: 'none',
                color: '#ffffff',
                padding: '6px 16px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: isExecuting ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: isExecuting ? 0.7 : 1
              }}
            >
              <Play size={14} fill="currentColor" />
              {isExecuting ? 'Running...' : 'Run Query'}
            </button>
          </div>
        </div>

        {/* SQL Editor Area */}
        <div style={{ height: '180px', borderBottom: '1px solid #2d2d2d', backgroundColor: '#141416' }}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter SQL Query (e.g. SELECT * FROM users WHERE status = 'active';)..."
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '16px',
              color: '#f8fafc',
              fontSize: '13px',
              fontFamily: '"JetBrains Mono", Consolas, monospace',
              resize: 'none',
              lineHeight: 1.5
            }}
          />
        </div>

        {/* Results Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Results Summary Bar */}
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#18181b',
            borderBottom: '1px solid #2d2d2d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#a1a1aa'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={14} />
              <span>Query Results</span>
              {result && (
                <span style={{
                  color: result.success ? '#4ade80' : '#f87171',
                  fontWeight: 600
                }}>
                  {result.success ? `SUCCESS (${result.durationMs}ms)` : 'FAILED'}
                </span>
              )}
            </div>

            {result && result.success && (
              <div>
                <strong>{result.rowCount ?? result.rows?.length ?? 0}</strong> rows returned
              </div>
            )}
          </div>

          {/* Results Grid / Table */}
          <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#1e1e1e', padding: '16px' }}>
            {!result ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', fontSize: '13px' }}>
                Run a query to inspect records and database state.
              </div>
            ) : !result.success ? (
              <div style={{
                backgroundColor: '#451a1a',
                border: '1px solid #7f1d1d',
                borderRadius: '6px',
                padding: '16px',
                color: '#fca5a5',
                fontSize: '13px',
                fontFamily: 'monospace'
              }}>
                <strong>SQL Execution Error:</strong> {result.error}
              </div>
            ) : (!result.rows || result.rows.length === 0) ? (
              <div style={{ color: '#4ade80', fontSize: '13px', padding: '12px' }}>
                Query executed successfully. (0 rows returned or DDL statement completed).
              </div>
            ) : (
              <div style={{ border: '1px solid #2d2d2d', borderRadius: '4px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'monospace' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#252526', borderBottom: '1px solid #333333' }}>
                      {(result.fields && result.fields.length > 0 ? result.fields : Object.keys(result.rows[0])).map((col) => (
                        <th key={col} style={{ textAlign: 'left', padding: '8px 12px', color: '#38bdf8', fontWeight: 600 }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        style={{
                          borderBottom: '1px solid #27272a',
                          backgroundColor: rIdx % 2 === 0 ? 'transparent' : '#141416'
                        }}
                      >
                        {(result.fields && result.fields.length > 0 ? result.fields : Object.keys(result.rows[0])).map((col) => {
                          const val = row[col]
                          return (
                            <td key={col} style={{ padding: '8px 12px', color: val === null ? '#71717a' : '#f8fafc' }}>
                              {val === null ? 'NULL' : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit / New Profile Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: '#1e1e1e',
            border: '1px solid #333333',
            borderRadius: '8px',
            width: '460px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', margin: '0 0 16px 0' }}>
              {editingProfile.id ? 'Edit Database Connection' : 'Add Database Connection'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>
                  Database Engine
                </label>
                <select
                  value={editingProfile.type}
                  onChange={(e) => setEditingProfile({ ...editingProfile, type: e.target.value as any })}
                  style={{
                    width: '100%',
                    backgroundColor: '#27272a',
                    border: '1px solid #3f3f46',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                >
                  <option value="sqlite">SQLite (Built-in / Local File)</option>
                  <option value="postgres">PostgreSQL</option>
                  <option value="mysql">MySQL / MariaDB</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>
                  Profile Name
                </label>
                <input
                  type="text"
                  value={editingProfile.name}
                  onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  placeholder="e.g. Main PostgreSQL"
                  style={{
                    width: '100%',
                    backgroundColor: '#27272a',
                    border: '1px solid #3f3f46',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              {editingProfile.type === 'sqlite' ? (
                <div>
                  <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>
                    Database File Path (or :memory:)
                  </label>
                  <input
                    type="text"
                    value={editingProfile.database || ':memory:'}
                    onChange={(e) => setEditingProfile({ ...editingProfile, database: e.target.value })}
                    placeholder=":memory: or tests/sample.db"
                    style={{
                      width: '100%',
                      backgroundColor: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: '4px',
                      padding: '6px 10px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>
                        Host
                      </label>
                      <input
                        type="text"
                        value={editingProfile.host || 'localhost'}
                        onChange={(e) => setEditingProfile({ ...editingProfile, host: e.target.value })}
                        placeholder="localhost"
                        style={{
                          width: '100%',
                          backgroundColor: '#27272a',
                          border: '1px solid #3f3f46',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          color: '#f8fafc',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>
                        Port
                      </label>
                      <input
                        type="number"
                        value={editingProfile.port || (editingProfile.type === 'postgres' ? 5432 : 3306)}
                        onChange={(e) => setEditingProfile({ ...editingProfile, port: parseInt(e.target.value) || 0 })}
                        style={{
                          width: '100%',
                          backgroundColor: '#27272a',
                          border: '1px solid #3f3f46',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          color: '#f8fafc',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>
                      Database Name
                    </label>
                    <input
                      type="text"
                      value={editingProfile.database || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, database: e.target.value })}
                      placeholder="e.g. postgres or my_app_test"
                      style={{
                        width: '100%',
                        backgroundColor: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>
                        Username
                      </label>
                      <input
                        type="text"
                        value={editingProfile.user || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, user: e.target.value })}
                        placeholder="postgres / root"
                        style={{
                          width: '100%',
                          backgroundColor: '#27272a',
                          border: '1px solid #3f3f46',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          color: '#f8fafc',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>
                        Password
                      </label>
                      <input
                        type="password"
                        value={editingProfile.password || ''}
                        onChange={(e) => setEditingProfile({ ...editingProfile, password: e.target.value })}
                        placeholder="••••••••"
                        style={{
                          width: '100%',
                          backgroundColor: '#27272a',
                          border: '1px solid #3f3f46',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          color: '#f8fafc',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  color: '#cccccc',
                  borderRadius: '4px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                style={{
                  backgroundColor: '#0284c7',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '4px',
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Save Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
