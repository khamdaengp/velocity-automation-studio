import React from 'react'
import { GitBranch, Check, X, Bell, Zap, Activity, Eye, EyeOff, Terminal } from 'lucide-react'

interface StatusBarProps {
  isRunning: boolean
  activeFile: string | null
  lastResult: { status: 'passed' | 'failed'; duration: number; code: number } | null
  memoryMB: number
  headless: boolean
  showTerminal?: boolean
  onToggleTerminal?: () => void
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isRunning,
  activeFile,
  lastResult,
  memoryMB,
  headless,
  showTerminal,
  onToggleTerminal
}) => {
  const extension = activeFile ? activeFile.split('.').pop()?.toUpperCase() : 'JS'
  const languageLabel = extension === 'TS' ? 'TypeScript' : extension === 'JSON' ? 'JSON' : extension === 'TCS' || extension === 'TC' ? 'Test Script' : 'JavaScript'

  return (
    <footer style={{
      height: '24px',
      backgroundColor: '#007acc', // VS Code iconic blue
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 8px',
      fontSize: '11px',
      userSelect: 'none',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Left items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} title="Git Branch: main">
          <GitBranch size={12} />
          <span>main*</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Zap size={11} fill="white" />
          <span>Velocity Turbo</span>
        </div>

        {isRunning ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fef08a' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#facc15' }} />
            <span>Executing Test...</span>
          </div>
        ) : lastResult ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: lastResult.status === 'passed' ? '#bbf7d0' : '#fecaca'
          }}>
            {lastResult.status === 'passed' ? <Check size={12} /> : <X size={12} />}
            <span>{lastResult.status === 'passed' ? `Passed (${lastResult.duration}ms)` : `Failed (${lastResult.duration}ms)`}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.9 }}>
            <span>Ready</span>
          </div>
        )}

        {onToggleTerminal && (
          <div
            onClick={onToggleTerminal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              backgroundColor: showTerminal ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              padding: '2px 6px',
              borderRadius: '3px'
            }}
            title="Toggle Terminal Panel (Ctrl+`)"
          >
            <Terminal size={12} />
            <span>{showTerminal ? 'Hide Terminal' : 'Show Terminal'}</span>
          </div>
        )}
      </div>

      {/* Right items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div title="Execution Mode">
          <span>{headless ? 'Headless' : 'Headed Browser'}</span>
        </div>

        <div title="Memory Footprint">
          <span>RAM: {memoryMB || 42} MB</span>
        </div>

        <div title="Indentation">
          <span>Spaces: 2</span>
        </div>

        <div title="Encoding">
          <span>UTF-8</span>
        </div>

        <div title="Language Mode">
          <span>{languageLabel}</span>
        </div>

        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Notifications">
          <Bell size={12} />
        </div>
      </div>
    </footer>
  )
}
