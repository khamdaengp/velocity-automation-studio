import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Check, Save, Layers, AlertCircle, Copy, CheckCheck } from 'lucide-react'
import { EnvironmentsData, Environment, EnvVariable } from '../types'

interface EnvironmentManagerProps {
  onActiveEnvChanged?: (envId: string) => void
}

export const EnvironmentManager: React.FC<EnvironmentManagerProps> = ({ onActiveEnvChanged }) => {
  const [data, setData] = useState<EnvironmentsData>({
    active: 'dev',
    environments: []
  })
  const [selectedEnvId, setSelectedEnvId] = useState<string>('dev')
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const loadData = async () => {
    try {
      // @ts-ignore
      const res: EnvironmentsData = await window.api.getEnvironments()
      if (res && res.environments) {
        setData(res)
        setSelectedEnvId(res.active || res.environments[0]?.id || 'dev')
      }
    } catch (err) {
      console.error('Failed to load environments:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const currentEnv = data.environments.find((e) => e.id === selectedEnvId) || data.environments[0]

  const handleSetActive = async (envId: string) => {
    try {
      // @ts-ignore
      await window.api.setActiveEnvironment(envId)
      setData((prev) => ({ ...prev, active: envId }))
      if (onActiveEnvChanged) onActiveEnvChanged(envId)
      setSaveStatus('Active environment updated!')
      setTimeout(() => setSaveStatus(null), 2500)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSave = async () => {
    try {
      // @ts-ignore
      const res = await window.api.saveEnvironments(data)
      if (res.success) {
        setSaveStatus('Saved successfully!')
        setTimeout(() => setSaveStatus(null), 2500)
      } else {
        setSaveStatus(`Save error: ${res.error}`)
      }
    } catch (err: any) {
      setSaveStatus(`Save failed: ${err.message}`)
    }
  }

  const handleAddVariable = () => {
    if (!currentEnv) return
    const updated = data.environments.map((e) => {
      if (e.id === currentEnv.id) {
        return {
          ...e,
          variables: [...e.variables, { key: '', value: '', enabled: true }]
        }
      }
      return e
    })
    setData((prev) => ({ ...prev, environments: updated }))
  }

  const handleUpdateVariable = (index: number, field: keyof EnvVariable, value: any) => {
    if (!currentEnv) return
    const updatedVars = [...currentEnv.variables]
    updatedVars[index] = { ...updatedVars[index], [field]: value }

    const updated = data.environments.map((e) => {
      if (e.id === currentEnv.id) {
        return { ...e, variables: updatedVars }
      }
      return e
    })
    setData((prev) => ({ ...prev, environments: updated }))
  }

  const handleDeleteVariable = (index: number) => {
    if (!currentEnv) return
    const updatedVars = currentEnv.variables.filter((_, i) => i !== index)
    const updated = data.environments.map((e) => {
      if (e.id === currentEnv.id) {
        return { ...e, variables: updatedVars }
      }
      return e
    })
    setData((prev) => ({ ...prev, environments: updated }))
  }

  const handleAddEnvironment = () => {
    const name = prompt('Enter new environment name (e.g. QA, UAT):')
    if (!name || !name.trim()) return
    const id = name.trim().toLowerCase().replace(/\s+/g, '-')
    const newEnv: Environment = {
      id,
      name: name.trim(),
      variables: [
        { key: 'baseUrl', value: 'https://example.com', enabled: true },
        { key: 'apiUrl', value: 'https://example.com/api', enabled: true }
      ]
    }
    setData((prev) => ({
      ...prev,
      environments: [...prev.environments, newEnv]
    }))
    setSelectedEnvId(id)
  }

  const handleCopySnippet = (key: string) => {
    const text = `{{${key}}}`
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
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
      {/* Environments Sidebar List */}
      <div style={{
        width: '260px',
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
            <Layers size={16} color="#38bdf8" />
            Environments
          </div>
          <button
            onClick={handleAddEnvironment}
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
            title="Create new environment"
          >
            <Plus size={13} />
            New
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {data.environments.map((env) => {
            const isSelected = env.id === selectedEnvId
            const isActive = env.id === data.active

            return (
              <div
                key={env.id}
                onClick={() => setSelectedEnvId(env.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: isSelected ? '#27272a' : 'transparent',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  border: isSelected ? '1px solid #3f3f46' : '1px solid transparent'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: isSelected ? '#ffffff' : '#d4d4d8', fontSize: '13px' }}>
                    {env.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#71717a' }}>
                    {env.variables.length} variable{env.variables.length === 1 ? '' : 's'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isActive ? (
                    <span style={{
                      backgroundColor: '#14532d',
                      color: '#4ade80',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      Active
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSetActive(env.id)
                      }}
                      style={{
                        backgroundColor: '#27272a',
                        border: '1px solid #3f3f46',
                        color: '#a1a1aa',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="Set as active environment"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Variable Editor Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #2d2d2d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#18181b'
        }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
              {currentEnv?.name || 'Environment'} Variables
            </h2>
            <p style={{ fontSize: '12px', color: '#71717a', margin: '4px 0 0 0' }}>
              Reference any key using <code style={{ color: '#38bdf8' }}>{'{{key}}'}</code> in API endpoints, headers, requests, DB queries, or scripts.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {saveStatus && (
              <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 500 }}>
                {saveStatus}
              </span>
            )}
            <button
              onClick={handleAddVariable}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#27272a',
                border: '1px solid #3f3f46',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              <Plus size={14} />
              Add Variable
            </button>
            <button
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#0284c7',
                border: 'none',
                color: '#ffffff',
                padding: '6px 16px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </div>

        {/* Variables Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{
            backgroundColor: '#18181b',
            border: '1px solid #2d2d2d',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '40px 220px 1fr 90px 50px',
              padding: '10px 14px',
              backgroundColor: '#1e1e1e',
              borderBottom: '1px solid #2d2d2d',
              fontSize: '11px',
              fontWeight: 600,
              color: '#a1a1aa',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div>Use</div>
              <div>Variable Name</div>
              <div>Initial / Current Value</div>
              <div>Syntax</div>
              <div></div>
            </div>

            {/* Table Rows */}
            {(!currentEnv?.variables || currentEnv.variables.length === 0) ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
                No variables defined for this environment yet. Click <strong>Add Variable</strong> to create one.
              </div>
            ) : (
              currentEnv.variables.map((v, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 220px 1fr 90px 50px',
                    padding: '8px 14px',
                    borderBottom: '1px solid #27272a',
                    alignItems: 'center',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : '#141416'
                  }}
                >
                  {/* Enabled Checkbox */}
                  <div>
                    <input
                      type="checkbox"
                      checked={v.enabled}
                      onChange={(e) => handleUpdateVariable(idx, 'enabled', e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: '#38bdf8' }}
                    />
                  </div>

                  {/* Key */}
                  <div style={{ paddingRight: '12px' }}>
                    <input
                      type="text"
                      placeholder="e.g. baseUrl"
                      value={v.key}
                      onChange={(e) => handleUpdateVariable(idx, 'key', e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Value */}
                  <div style={{ paddingRight: '12px' }}>
                    <input
                      type="text"
                      placeholder="e.g. https://api.myproject.com"
                      value={v.value}
                      onChange={(e) => handleUpdateVariable(idx, 'value', e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        color: '#38bdf8',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Copy Syntax */}
                  <div>
                    <button
                      onClick={() => handleCopySnippet(v.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        color: '#cbd5e1',
                        cursor: 'pointer'
                      }}
                      title="Copy {{key}} syntax"
                    >
                      {copiedKey === v.key ? <CheckCheck size={12} color="#4ade80" /> : <Copy size={12} />}
                      <code>{'{{...}}'}</code>
                    </button>
                  </div>

                  {/* Delete */}
                  <div>
                    <button
                      onClick={() => handleDeleteVariable(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#71717a',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px'
                      }}
                      title="Delete variable"
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Help Card */}
          <div style={{
            marginTop: '24px',
            backgroundColor: '#18181b',
            border: '1px solid #2d2d2d',
            borderRadius: '6px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
              <AlertCircle size={16} color="#eab308" />
              Unified Environment Interpolation Guide
            </div>
            <div style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: 1.6 }}>
              <div>• <strong>API Studio & cURL:</strong> Use <code style={{ color: '#38bdf8' }}>{'{{apiUrl}}/users'}</code> in endpoint or headers.</div>
              <div>• <strong>Database Testing:</strong> Use variables in connection strings or queries.</div>
              <div>• <strong>Automation Test Scripts:</strong> Access directly via <code style={{ color: '#38bdf8' }}>env.get('baseUrl')</code> or interpolate in URLs: <code style={{ color: '#38bdf8' }}>await page.goto(env.resolve('{`{{baseUrl}}`}/login'))</code>.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
