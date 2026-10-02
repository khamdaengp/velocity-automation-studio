import React, { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  ShieldCheck,
  Globe,
  MousePointer,
  Keyboard,
  CheckCircle,
  Eye,
  Camera,
  Clock,
  Terminal,
  Database,
  HelpCircle,
  FileText,
  Code2
} from 'lucide-react'
import { TestCaseData, TcCommand, AuthProfile } from '../types'
import { AuthSessionModal } from './AuthSessionModal'
import { convertTcToPlaywright, convertPlaywrightToTc } from '../utils/tcToPlaywright'

interface VisualStepBuilderProps {
  content: string
  onChange: (newContent: string) => void
  filePath: string
  onConvertToCode?: (sourcePath: string, codeContent: string) => void
  onSwitchToCode?: () => void
}

const ACTION_OPTIONS = [
  { value: 'open', label: '🌐 Navigate / Open URL', category: 'web', desc: 'Opens target URL' },
  { value: 'click', label: '🖱️ Click Element', category: 'web', desc: 'Clicks matching selector' },
  { value: 'dblclick', label: '🖱️ Double Click', category: 'web', desc: 'Double clicks selector' },
  { value: 'type', label: '⌨️ Type / Fill Text', category: 'web', desc: 'Fills input with value' },
  { value: 'press', label: '⌨️ Press Key', category: 'web', desc: 'Presses keyboard key (e.g. Enter)' },
  { value: 'check', label: '🔘 Check Checkbox', category: 'web', desc: 'Checks checkbox or radio' },
  { value: 'uncheck', label: '🔘 Uncheck Checkbox', category: 'web', desc: 'Unchecks checkbox' },
  { value: 'hover', label: '🎯 Hover Element', category: 'web', desc: 'Hovers over element' },
  { value: 'select', label: '📋 Select Dropdown', category: 'web', desc: 'Selects option by value' },
  { value: 'asserttext', label: '✅ Assert Text', category: 'assertion', desc: 'Verifies text contains value' },
  { value: 'assertvisible', label: '👁️ Assert Visible', category: 'assertion', desc: 'Verifies element is visible' },
  { value: 'assertnotvisible', label: '🙈 Assert Hidden', category: 'assertion', desc: 'Verifies element is hidden' },
  { value: 'asserttitle', label: '📑 Assert Title', category: 'assertion', desc: 'Verifies page title' },
  { value: 'screenshot', label: '📸 Take Screenshot', category: 'util', desc: 'Captures PNG screenshot' },
  { value: 'pause', label: '⏱️ Pause / Wait (ms)', category: 'util', desc: 'Pauses for N milliseconds' },
  { value: 'apiget', label: '📡 API GET', category: 'api', desc: 'Performs HTTP GET request' },
  { value: 'apipost', label: '📡 API POST', category: 'api', desc: 'Performs HTTP POST request' },
  { value: 'extractapi', label: '📥 Extract API Value', category: 'api', desc: 'Extracts property from last API response into {{variable}}' },
  { value: 'extractui', label: '📥 Extract UI Text', category: 'web', desc: 'Extracts text from element into {{variable}}' },
  { value: 'extractdb', label: '📥 Extract DB Value', category: 'db', desc: 'Extracts first cell from query into {{variable}}' },
  { value: 'setvar', label: '💾 Set Variable', category: 'util', desc: 'Stores value into {{variable}} for later steps' },
  { value: 'dbquery', label: '🗄️ Query Database', category: 'db', desc: 'Executes SQL query on DB profile' }
]

export const VisualStepBuilder: React.FC<VisualStepBuilderProps> = ({
  content,
  onChange,
  filePath,
  onConvertToCode,
  onSwitchToCode
}) => {
  const [testCase, setTestCase] = useState<TestCaseData>({
    id: 'tc-' + Date.now(),
    name: 'Untitled Test Case',
    description: '',
    authState: '',
    commands: []
  })

  const [authProfiles, setAuthProfiles] = useState<AuthProfile[]>([])
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  // Load auth profiles
  const loadAuthProfiles = async () => {
    try {
      // @ts-ignore
      const list = await window.api.getAuthProfiles()
      if (list) setAuthProfiles(list)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadAuthProfiles()
  }, [])

  // Sync content into local state (supports both JSON .tc and Playwright code)
  useEffect(() => {
    try {
      if (!content.trim()) {
        const initData: TestCaseData = {
          id: 'tc-' + Date.now(),
          name: filePath ? filePath.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || 'New Test' : 'New Test',
          description: '',
          commands: [{ command: 'open', target: '{{baseUrl}}', value: '', description: 'Navigate to base URL' }]
        }
        setTestCase(initData)
        setParseError(null)
        return
      }

      const trimmed = content.trim()
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(content)
          if (parsed && Array.isArray(parsed.commands)) {
            setTestCase(parsed)
            setParseError(null)
            return
          }
        } catch {}
      }

      // If not JSON, parse Playwright / JavaScript code into visual steps
      const parsedFromCode = convertPlaywrightToTc(content, filePath)
      setTestCase(parsedFromCode)
      setParseError(null)
    } catch (err: any) {
      const parsedFromCode = convertPlaywrightToTc(content, filePath)
      setTestCase(parsedFromCode)
      setParseError(null)
    }
  }, [content, filePath])

  const notifyChange = (updated: TestCaseData) => {
    setTestCase(updated)
    const isCodeFile = filePath && !filePath.endsWith('.tc')
    if (isCodeFile) {
      onChange(convertTcToPlaywright(updated))
    } else {
      onChange(JSON.stringify(updated, null, 2))
    }
  }

  const handleUpdateCommand = (index: number, field: keyof TcCommand, val: string) => {
    const updatedCmds = [...testCase.commands]
    updatedCmds[index] = { ...updatedCmds[index], [field]: val }
    notifyChange({ ...testCase, commands: updatedCmds })
  }

  const handleAddCommand = (cmd: Partial<TcCommand> = {}) => {
    const newCmd: TcCommand = {
      command: cmd.command || 'click',
      target: cmd.target || '',
      value: cmd.value || '',
      description: cmd.description || ''
    }
    notifyChange({ ...testCase, commands: [...testCase.commands, newCmd] })
  }

  const handleDeleteCommand = (index: number) => {
    const updatedCmds = testCase.commands.filter((_, i) => i !== index)
    notifyChange({ ...testCase, commands: updatedCmds })
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= testCase.commands.length) return
    const updatedCmds = [...testCase.commands]
    const temp = updatedCmds[index]
    updatedCmds[index] = updatedCmds[targetIdx]
    updatedCmds[targetIdx] = temp
    notifyChange({ ...testCase, commands: updatedCmds })
  }

  const handleDuplicate = (index: number) => {
    const item = testCase.commands[index]
    const updatedCmds = [...testCase.commands]
    updatedCmds.splice(index + 1, 0, { ...item })
    notifyChange({ ...testCase, commands: updatedCmds })
  }

  const handleInitTestCase = () => {
    const initData: TestCaseData = {
      id: 'tc-' + Date.now(),
      name: 'New Test Case',
      description: 'Declarative No-Code Automation Flow',
      commands: [
        { command: 'open', target: '{{baseUrl}}', value: '', description: 'Open app' },
        { command: 'click', target: '#login-btn', value: '', description: 'Click login' },
        { command: 'assertvisible', target: '#dashboard', value: '', description: 'Verify dashboard' }
      ]
    }
    notifyChange(initData)
    setParseError(null)
  }

  if (parseError) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        backgroundColor: '#1e1e1e',
        color: '#cccccc',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: '#252526',
          border: '1px solid #333333',
          borderRadius: '8px',
          padding: '28px',
          maxWidth: '480px'
        }}>
          <h3 style={{ color: '#f8fafc', fontSize: '16px', marginBottom: '8px' }}>
            Non-Declarative Test Format
          </h3>
          <p style={{ color: '#a1a1aa', fontSize: '13px', marginBottom: '20px' }}>
            {parseError}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {onSwitchToCode && (
              <button
                onClick={onSwitchToCode}
                style={{
                  backgroundColor: '#27272a',
                  color: '#38bdf8',
                  border: '1px solid #0284c7',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Open in Code Editor
              </button>
            )}
            <button
              onClick={handleInitTestCase}
              style={{
                backgroundColor: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Reset to No-Code Visual Test Case
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      height: '100%',
      backgroundColor: '#1e1e1e',
      color: '#cccccc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Top Test Case Metadata Bar */}
      <div style={{
        padding: '14px 20px',
        backgroundColor: '#18181b',
        borderBottom: '1px solid #2d2d2d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div>
            <input
              type="text"
              value={testCase.name}
              onChange={(e) => notifyChange({ ...testCase, name: e.target.value })}
              placeholder="Test Case Name"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: '1px solid #3f3f46',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
                outline: 'none',
                padding: '2px 4px',
                width: '260px'
              }}
            />
          </div>
          <div>
            <input
              type="text"
              value={testCase.description || ''}
              onChange={(e) => notifyChange({ ...testCase, description: e.target.value })}
              placeholder="Description / User Story (optional)..."
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: '1px dashed #3f3f46',
                color: '#71717a',
                fontSize: '12px',
                outline: 'none',
                padding: '2px 4px',
                width: '240px'
              }}
            />
          </div>
        </div>

        {/* Persistent Auth Session Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a1a1aa' }}>
            <ShieldCheck size={15} color="#38bdf8" />
            <span>Session Auth:</span>
          </div>
          <select
            value={testCase.authState || ''}
            onChange={(e) => notifyChange({ ...testCase, authState: e.target.value })}
            style={{
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              color: testCase.authState ? '#4ade80' : '#a1a1aa',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">None (Fresh Browser)</option>
            {authProfiles.map((p) => (
              <option key={p.id} value={p.name}>
                🔑 {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            style={{
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              color: '#38bdf8',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
            title="Manage saved browser sessions (e.g. Google Login)"
          >
            Manage Sessions...
          </button>

          <button
            onClick={() => {
              try {
                const jsCode = convertTcToPlaywright(content)
                onConvertToCode?.(filePath, jsCode)
              } catch (err: any) {
                console.error('Conversion error:', err)
              }
            }}
            style={{
              backgroundColor: '#0284c7',
              border: 'none',
              color: '#ffffff',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Convert this visual test case into native Playwright code (.spec.js)"
          >
            <Code2 size={13} />
            <span>Convert to Code (.spec.js)</span>
          </button>
        </div>
      </div>

      {/* Steps Table Container */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        <div style={{
          backgroundColor: '#18181b',
          border: '1px solid #2d2d2d',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          {/* Header Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 180px 1.5fr 1.2fr 1fr 110px',
            padding: '10px 14px',
            backgroundColor: '#1e1e1e',
            borderBottom: '1px solid #2d2d2d',
            fontSize: '11px',
            fontWeight: 600,
            color: '#a1a1aa',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div>#</div>
            <div>Action / Keyword</div>
            <div>Target / Locator</div>
            <div>Value / Input</div>
            <div>Description</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {/* Rows */}
          {testCase.commands.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
              No steps in this test case yet. Click <strong>Add Step</strong> below or use the quick buttons.
            </div>
          ) : (
            testCase.commands.map((cmd, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 180px 1.5fr 1.2fr 1fr 110px',
                  padding: '8px 14px',
                  borderBottom: '1px solid #27272a',
                  alignItems: 'center',
                  backgroundColor: idx % 2 === 0 ? 'transparent' : '#141416'
                }}
              >
                {/* Index */}
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#71717a' }}>
                  {idx + 1}
                </div>

                {/* Command Select */}
                <div style={{ paddingRight: '10px' }}>
                  <select
                    value={cmd.command}
                    onChange={(e) => handleUpdateCommand(idx, 'command', e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: '4px',
                      padding: '5px 8px',
                      color: cmd.command.startsWith('assert')
                        ? '#4ade80'
                        : cmd.command.startsWith('api')
                        ? '#60a5fa'
                        : cmd.command.startsWith('extract') || cmd.command === 'setvar'
                        ? '#a78bfa'
                        : cmd.command === 'dbquery'
                        ? '#f59e0b'
                        : '#ffffff',
                      fontSize: '12px',
                      fontWeight: 500,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {ACTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target */}
                <div style={{ paddingRight: '10px' }}>
                  <input
                    type="text"
                    value={cmd.target}
                    onChange={(e) => handleUpdateCommand(idx, 'target', e.target.value)}
                    placeholder={
                      cmd.command === 'open'
                        ? 'e.g. {{baseUrl}}/dashboard'
                        : cmd.command.startsWith('api')
                        ? 'e.g. {{apiUrl}}/users'
                        : cmd.command === 'extractapi'
                        ? 'JSON property: e.g. token or data.id'
                        : cmd.command === 'extractui'
                        ? 'UI selector: e.g. #order-id'
                        : cmd.command === 'extractdb'
                        ? 'SQL query: e.g. SELECT id FROM orders'
                        : cmd.command === 'setvar'
                        ? 'Variable name: e.g. MY_KEY'
                        : cmd.command === 'dbquery'
                        ? 'e.g. SELECT * FROM users'
                        : 'Selector: #id, .class, button[type="submit"]'
                    }
                    style={{
                      width: '100%',
                      backgroundColor: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: '4px',
                      padding: '5px 10px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontFamily: '"JetBrains Mono", Consolas, monospace',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Value */}
                <div style={{ paddingRight: '10px' }}>
                  <input
                    type="text"
                    value={cmd.value || ''}
                    onChange={(e) => handleUpdateCommand(idx, 'value', e.target.value)}
                    placeholder={
                      cmd.command === 'type'
                        ? 'Text to type (or {{var}})'
                        : cmd.command === 'press'
                        ? 'Enter, Tab, Escape'
                        : cmd.command.startsWith('assert')
                        ? 'Expected text or value'
                        : cmd.command === 'extractapi' || cmd.command === 'extractui' || cmd.command === 'extractdb'
                        ? 'Variable to store into: e.g. USER_ID'
                        : cmd.command === 'setvar'
                        ? 'Value to store'
                        : cmd.command === 'dbquery'
                        ? 'DB Profile (e.g. sqlite-local)'
                        : 'Value (optional)'
                    }
                    style={{
                      width: '100%',
                      backgroundColor: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: '4px',
                      padding: '5px 10px',
                      color: '#38bdf8',
                      fontSize: '12px',
                      fontFamily: '"JetBrains Mono", Consolas, monospace',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Description */}
                <div style={{ paddingRight: '10px' }}>
                  <input
                    type="text"
                    value={cmd.description || ''}
                    onChange={(e) => handleUpdateCommand(idx, 'description', e.target.value)}
                    placeholder="Step note..."
                    style={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#a1a1aa',
                      fontSize: '11px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Row Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                  <button
                    onClick={() => handleMove(idx, 'up')}
                    disabled={idx === 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: idx === 0 ? '#3f3f46' : '#a1a1aa',
                      cursor: idx === 0 ? 'default' : 'pointer',
                      padding: '3px'
                    }}
                    title="Move up"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => handleMove(idx, 'down')}
                    disabled={idx === testCase.commands.length - 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: idx === testCase.commands.length - 1 ? '#3f3f46' : '#a1a1aa',
                      cursor: idx === testCase.commands.length - 1 ? 'default' : 'pointer',
                      padding: '3px'
                    }}
                    title="Move down"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    onClick={() => handleDuplicate(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#a1a1aa',
                      cursor: 'pointer',
                      padding: '3px'
                    }}
                    title="Duplicate step"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteCommand(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '3px'
                    }}
                    title="Delete step"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Quick Action Bar */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: '#18181b',
        borderTop: '1px solid #2d2d2d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {/* Quick Add Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleAddCommand({ command: 'click', target: '', description: 'Click element' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#0284c7',
              border: 'none',
              color: 'white',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={13} />
            Add Step
          </button>
          <button
            onClick={() => handleAddCommand({ command: 'open', target: '{{baseUrl}}', description: 'Open page' })}
            style={{
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              color: '#cbd5e1',
              borderRadius: '4px',
              padding: '6px 10px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            🌐 Navigate
          </button>
          <button
            onClick={() => handleAddCommand({ command: 'type', target: '', value: '', description: 'Fill input' })}
            style={{
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              color: '#cbd5e1',
              borderRadius: '4px',
              padding: '6px 10px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            ⌨️ Type
          </button>
          <button
            onClick={() => handleAddCommand({ command: 'asserttext', target: '', value: '', description: 'Assert text' })}
            style={{
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              color: '#4ade80',
              borderRadius: '4px',
              padding: '6px 10px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            ✅ Assert Text
          </button>
          <button
            onClick={() => handleAddCommand({ command: 'screenshot', target: 'tests/screenshot.png', description: 'Take screenshot' })}
            style={{
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              color: '#cbd5e1',
              borderRadius: '4px',
              padding: '6px 10px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            📸 Screenshot
          </button>
          <button
            onClick={() => handleAddCommand({ command: 'apiget', target: '{{apiUrl}}', value: '200', description: 'API call' })}
            style={{
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              color: '#60a5fa',
              borderRadius: '4px',
              padding: '6px 10px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            📡 API
          </button>
          <button
            onClick={() => handleAddCommand({ command: 'dbquery', target: 'SELECT count(*) FROM users;', value: 'sqlite-local', description: 'Verify DB' })}
            style={{
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              color: '#f59e0b',
              borderRadius: '4px',
              padding: '6px 10px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            🗄️ Database
          </button>
        </div>

        <div style={{ fontSize: '11px', color: '#71717a' }}>
          Total Steps: <strong>{testCase.commands.length}</strong>
        </div>
      </div>

      {/* Auth Session Modal */}
      <AuthSessionModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSelectProfile={(profileName) => {
          notifyChange({ ...testCase, authState: profileName })
          loadAuthProfiles()
        }}
      />
    </div>
  )
}
