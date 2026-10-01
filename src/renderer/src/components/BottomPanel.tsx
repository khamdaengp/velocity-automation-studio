import React, { useRef, useEffect, useState } from 'react'
import {
  Terminal,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { LogEntry } from '../types'

interface BottomPanelProps {
  logs: LogEntry[]
  onClearLogs: () => void
  onClose?: () => void
  lastResult: { status: 'passed' | 'failed'; duration: number; code: number } | null
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  logs,
  onClearLogs,
  onClose,
  lastResult
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'output' | 'problems'>('terminal')
  const [isMaximized, setIsMaximized] = useState(false)
  const logContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  const tabs: { id: 'terminal' | 'output' | 'problems'; label: string; count?: number }[] = [
    { id: 'terminal', label: 'TERMINAL' },
    { id: 'output', label: 'OUTPUT' },
    { id: 'problems', label: 'PROBLEMS', count: lastResult?.status === 'failed' ? 1 : 0 }
  ]

  return (
    <div style={{
      height: isMaximized ? '480px' : '220px',
      backgroundColor: '#18181b', // VS Code bottom panel background
      borderTop: '1px solid #27272a',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'text',
      transition: 'height 0.2s ease-in-out'
    }}>
      {/* VS Code Panel Tab Header */}
      <div style={{
        height: '35px',
        backgroundColor: '#18181b',
        borderBottom: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        userSelect: 'none'
      }}>
        {/* Left Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '100%' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  height: '100%',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '1px solid #ffffff' : '1px solid transparent',
                  color: isActive ? '#ffffff' : '#858585',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  padding: '0 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    backgroundColor: '#dc2626',
                    color: 'white'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}

          {/* Test Execution Result Pill */}
          {lastResult && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: lastResult.status === 'passed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: lastResult.status === 'passed' ? '#34d399' : '#f87171'
            }}>
              {lastResult.status === 'passed' ? (
                <CheckCircle2 size={13} color="#10b981" />
              ) : (
                <XCircle size={13} color="#ef4444" />
              )}
              <span>{lastResult.status === 'passed' ? `PASSED (${lastResult.duration}ms)` : `FAILED (${lastResult.duration}ms)`}</span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onClearLogs}
            title="Clear Console (Ctrl+K)"
            style={{
              background: 'none',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Restore Panel Size' : 'Maximize Panel'}
            style={{
              background: 'none',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Hide Terminal (Ctrl+`)"
              style={{
                background: 'none',
                border: 'none',
                color: '#858585',
                cursor: 'pointer',
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Terminal / Output View */}
      <div
        ref={logContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 14px',
          fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
          fontSize: '12px',
          lineHeight: '1.6',
          backgroundColor: '#18181b'
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#52525b', padding: '12px 0' }}>
            Velocity Turbo Terminal Ready. Click [Run Test] or press F5 to execute tests.
          </div>
        ) : (
          logs.map((log) => {
            let textColor = '#e4e4e7'
            if (log.type === 'stderr') textColor = '#f87171'
            if (log.type === 'status') textColor = '#38bdf8'
            if (log.type === 'result') textColor = log.data?.status === 'passed' ? '#4ade80' : '#f87171'

            return (
              <div key={log.id} style={{ display: 'flex', gap: '8px', wordBreak: 'break-all' }}>
                <span style={{ color: '#52525b', userSelect: 'none' }}>[{log.timestamp}]</span>
                <span style={{ color: textColor }}>{log.text}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
