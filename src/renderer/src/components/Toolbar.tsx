import React, { useState, useRef, useEffect } from 'react'
import appLogo from '../assets/icon.png'
import {
  Play,
  Square,
  Video,
  Eye,
  EyeOff,
  Search,
  FileCode,
  FolderPlus,
  Save,
  Trash2,
  HelpCircle,
  ChevronDown,
  FolderInput,
  FolderOutput
} from 'lucide-react'

interface ToolbarProps {
  isRunning: boolean
  headless: boolean
  onToggleHeadless: () => void
  onRunTest: () => void
  onStopTest: () => void
  onRecord?: () => void
  recordUrl?: string
  setRecordUrl?: (url: string) => void
  memoryMB: number
  onNewTest?: () => void
  onNewSuite?: () => void
  onSave?: () => void
  onClearLogs?: () => void
  onToggleTerminal?: () => void
  onImportProject?: () => void
  onExportProject?: () => void
  activeEnv?: string
  environments?: { id: string; name: string }[]
  onSelectEnv?: (envId: string) => void
}

export const Toolbar: React.FC<ToolbarProps> = ({
  isRunning,
  headless,
  onToggleHeadless,
  onRunTest,
  onStopTest,
  onRecord,
  recordUrl,
  setRecordUrl,
  memoryMB,
  onNewTest,
  onNewSuite,
  onSave,
  onClearLogs,
  onToggleTerminal,
  onImportProject,
  onExportProject,
  activeEnv,
  environments,
  onSelectEnv
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null)
      }
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const menuItems = [
    {
      label: 'File',
      items: [
        { label: 'New Test File...', shortcut: 'Ctrl+N', action: () => onNewTest?.() },
        { label: 'New Automation Suite...', shortcut: 'Ctrl+Shift+S', action: () => onNewSuite?.() },
        { label: 'Save File', shortcut: 'Ctrl+S', action: () => onSave?.() },
        { label: 'Import Project / Suite...', shortcut: 'Ctrl+O', action: () => onImportProject?.() },
        { label: 'Export Selected Project...', shortcut: 'Ctrl+E', action: () => onExportProject?.() }
      ]
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: () => {} },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: () => {} },
        { label: 'Cut', shortcut: 'Ctrl+X', action: () => {} },
        { label: 'Copy', shortcut: 'Ctrl+C', action: () => {} },
        { label: 'Paste', shortcut: 'Ctrl+V', action: () => {} }
      ]
    },
    {
      label: 'Selection',
      items: [
        { label: 'Select All', shortcut: 'Ctrl+A', action: () => {} },
        { label: 'Expand Selection', shortcut: 'Shift+Alt+Right', action: () => {} }
      ]
    },
    {
      label: 'View',
      items: [
        { label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: () => {} },
        { label: 'Toggle Terminal Panel', shortcut: 'Ctrl+`', action: () => onToggleTerminal?.() }
      ]
    },
    {
      label: 'Run',
      items: [
        { label: isRunning ? 'Stop Execution' : 'Run Active Test', shortcut: 'F5', action: () => isRunning ? onStopTest() : onRunTest() },
        { label: headless ? 'Switch to Headed Mode' : 'Switch to Headless Mode', action: () => onToggleHeadless() },
        { label: 'Launch Codegen Recorder', shortcut: 'Ctrl+R', action: () => onRecord() }
      ]
    },
    {
      label: 'Terminal',
      items: [
        { label: 'Toggle Terminal Panel', shortcut: 'Ctrl+`', action: () => onToggleTerminal?.() },
        { label: 'Clear Output Console', shortcut: 'Ctrl+K', action: () => onClearLogs?.() }
      ]
    },
    {
      label: 'Help',
      items: [
        { label: 'About Velocity Automation Studio', action: () => alert('Velocity Automation Studio v1.0.7\nPlaywright Turbo Engine\nFast, Lightweight QA IDE') }
      ]
    }
  ]

  return (
    <header
      className="drag-region"
      style={{
        height: '42px',
        backgroundColor: '#18181b', // VS Code menu bar background
        borderBottom: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        paddingRight: '140px', // clearance for Windows caption buttons
        gap: '12px',
        fontSize: '12px',
        userSelect: 'none'
      }}
    >
      {/* Left: App Icon & VS Code Menu Items */}
      <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} ref={menuRef}>
        <img
          src={appLogo}
          alt="Velocity Studio"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '5px',
            objectFit: 'contain',
            marginRight: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        />

        {/* VS Code Menu Bar Items */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {menuItems.map((menu) => (
            <div key={menu.label} style={{ position: 'relative' }}>
              <button
                onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
                onMouseEnter={() => {
                  if (activeMenu) setActiveMenu(menu.label)
                }}
                style={{
                  background: activeMenu === menu.label ? '#27272a' : 'transparent',
                  border: 'none',
                  color: activeMenu === menu.label ? '#ffffff' : '#cccccc',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {menu.label}
              </button>

              {/* Dropdown Menu */}
              {activeMenu === menu.label && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '2px',
                  backgroundColor: '#1f1f23',
                  border: '1px solid #333338',
                  borderRadius: '6px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  minWidth: '220px',
                  zIndex: 9999,
                  padding: '4px 0'
                }}>
                  {menu.items.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        item.action()
                        setActiveMenu(null)
                      }}
                      style={{
                        padding: '6px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        color: '#e4e4e7',
                        fontSize: '12px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#0066b8'
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#e4e4e7'
                      }}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '16px' }}>{item.shortcut}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Center: VS Code Command Center search pill */}
      <div className="no-drag" style={{
        flex: 1,
        maxWidth: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '100%',
          height: '26px',
          backgroundColor: '#27272a',
          border: '1px solid #3f3f46',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: '#a1a1aa',
          cursor: 'pointer',
          padding: '0 12px',
          fontSize: '12px'
        }}
        title="Open Command Palette (Ctrl+P)"
        >
          <Search size={13} color="#71717a" />
          <span>Velocity Automation Studio</span>
          <span style={{
            fontSize: '10px',
            backgroundColor: '#18181b',
            padding: '1px 5px',
            borderRadius: '4px',
            color: '#71717a'
          }}>Ctrl+P</span>
        </div>
      </div>

      {/* Right: Quick Run & Debug Controls */}
      <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Environment Selector Dropdown */}
        <select
          value={activeEnv || 'dev'}
          onChange={(e) => onSelectEnv && onSelectEnv(e.target.value)}
          style={{
            backgroundColor: '#27272a',
            border: '1px solid #3f3f46',
            color: '#38bdf8',
            borderRadius: '4px',
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none'
          }}
          title="Active Environment Profile"
        >
          {(environments && environments.length > 0 ? environments : [
            { id: 'dev', name: 'Dev' },
            { id: 'staging', name: 'Staging' },
            { id: 'prod', name: 'Prod' }
          ]).map((env) => (
            <option key={env.id} value={env.id}>
              {env.name}
            </option>
          ))}
        </select>

        <button
          onClick={onRunTest}
          disabled={isRunning}
          title="Run Active Test (F5)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 12px',
            borderRadius: '4px',
            backgroundColor: isRunning ? '#27272a' : '#15803d',
            color: 'white',
            border: 'none',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '12px',
            opacity: isRunning ? 0.6 : 1
          }}
        >
          <Play size={13} fill="currentColor" />
          <span>{isRunning ? 'Running...' : 'Run Test'}</span>
        </button>

        {isRunning && (
          <button
            onClick={onStopTest}
            title="Stop Execution (Shift+F5)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '4px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px'
            }}
          >
            <Square size={12} fill="currentColor" />
            <span>Stop</span>
          </button>
        )}

        <button
          onClick={onToggleHeadless}
          title={headless ? 'Headless Mode (Fast execution)' : 'Headed Mode (Visual browser window shown)'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: '#27272a',
            color: '#e4e4e7',
            border: '1px solid #3f3f46',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          {headless ? <EyeOff size={13} color="#9ca3af" /> : <Eye size={13} color="#38bdf8" />}
          <span>{headless ? 'Headless' : 'Headed'}</span>
        </button>
      </div>
    </header>
  )
}
