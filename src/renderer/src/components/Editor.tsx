import React, { useState, useEffect } from 'react'
import MonacoEditor from '@monaco-editor/react'
import appLogo from '../assets/icon.png'
import { VisualStepBuilder } from './VisualStepBuilder'
import {
  Save,
  Play,
  X,
  FileCode,
  FileJson,
  FlaskConical,
  PlusSquare,
  CheckCircle2,
  ChevronRight,
  SplitSquareVertical,
  Terminal,
  LayoutList,
  Code2
} from 'lucide-react'

interface EditorProps {
  filePath: string | null
  content: string
  onChange: (value: string) => void
  onSave: () => void
  onRunTest?: () => void
  onClose?: () => void
  onToggleTerminal?: () => void
  showTerminal?: boolean
  isDirty: boolean
}

export const Editor: React.FC<EditorProps> = ({
  filePath,
  content,
  onChange,
  onSave,
  onRunTest,
  onClose,
  onToggleTerminal,
  showTerminal,
  isDirty
}) => {
  if (!filePath) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e1e1e', // VS Code editor background
        color: '#6e7681'
      }}>
        <img
          src={appLogo}
          alt="Velocity Studio Logo"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '14px',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            objectFit: 'contain'
          }}
        />
        <h3 style={{ fontSize: '18px', color: '#cccccc', marginBottom: '8px' }}>Velocity Automation Studio</h3>
        <p style={{ fontSize: '13px', color: '#858585' }}>Select or create a test script in the Explorer sidebar to start editing.</p>
        <div style={{ marginTop: '20px', display: 'flex', gap: '16px', fontSize: '12px', color: '#858585' }}>
          <div><kbd style={{ backgroundColor: '#2d2d2d', padding: '2px 6px', borderRadius: '4px' }}>Ctrl+N</kbd> New Test</div>
          <div><kbd style={{ backgroundColor: '#2d2d2d', padding: '2px 6px', borderRadius: '4px' }}>F5</kbd> Run Test</div>
          <div><kbd style={{ backgroundColor: '#2d2d2d', padding: '2px 6px', borderRadius: '4px' }}>Ctrl+S</kbd> Save</div>
        </div>
      </div>
    )
  }

  const fileName = filePath.split(/[\\/]/).pop() || filePath
  const extension = fileName.split('.').pop() || 'js'
  const language = extension === 'json' || extension === 'tc' || extension === 'tcs' ? 'json' : extension === 'ts' ? 'typescript' : 'javascript'

  const isDeclarativeTc = filePath ? filePath.endsWith('.tc') : false
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>(isDeclarativeTc ? 'visual' : 'code')

  useEffect(() => {
    if (filePath?.endsWith('.tc')) {
      setEditorMode('visual')
    }
  }, [filePath])

  // Path segments for breadcrumbs
  const pathParts = filePath.replace(/\\/g, '/').split('/').filter(Boolean)
  const breadcrumbParts = pathParts.slice(Math.max(0, pathParts.length - 3))

  const getFileIcon = (name: string) => {
    if (name.endsWith('.spec.js') || name.endsWith('.test.js')) {
      return <FlaskConical size={14} color="#38bdf8" />
    }
    if (name.endsWith('.js')) {
      return <FileCode size={14} color="#facc15" />
    }
    if (name.endsWith('.ts')) {
      return <FileCode size={14} color="#3b82f6" />
    }
    if (name.endsWith('.tc')) {
      return <CheckCircle2 size={14} color="#10b981" />
    }
    if (name.endsWith('.tcs')) {
      return <PlusSquare size={14} color="#a855f7" />
    }
    if (name.endsWith('.json')) {
      return <FileJson size={14} color="#eab308" />
    }
    return <FileCode size={14} color="#94a3b8" />
  }

  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme('vscode-velocity-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'identifier', foreground: 'd4d4d4' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'delimiter', foreground: '808080' }
      ],
      colors: {
        'editor.background': '#1e1e1e', // Classic VS Code dark background
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2a2d2e',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
        'editorCursor.foreground': '#007acc',
        'editorWhitespace.foreground': '#3b3a32',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070'
      }
    })
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1e1e1e',
      overflow: 'hidden'
    }}>
      {/* VS Code Tab Bar */}
      <div style={{
        height: '35px',
        backgroundColor: '#18181b', // VS Code inactive tab background
        borderBottom: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0'
      }}>
        {/* Active Tab */}
        <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
          <div style={{
            height: '100%',
            backgroundColor: '#1e1e1e', // VS Code active tab background
            borderTop: '2px solid #007acc', // VS Code active tab blue top accent
            borderRight: '1px solid #27272a',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#ffffff'
          }}>
            {getFileIcon(fileName)}
            <span>{fileName}</span>
            {isDirty ? (
              <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>●</span>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClose?.()
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#858585',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '3px'
                }}
                title="Close (Ctrl+W)"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Tab Right Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingRight: '8px' }}>
          {/* Dual-Mode Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#27272a',
            borderRadius: '4px',
            padding: '2px',
            marginRight: '6px'
          }}>
            <button
              onClick={() => setEditorMode('visual')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '3px',
                border: 'none',
                backgroundColor: editorMode === 'visual' ? '#0284c7' : 'transparent',
                color: editorMode === 'visual' ? '#ffffff' : '#a1a1aa',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="No-Code Visual Step Builder"
            >
              <LayoutList size={12} />
              <span>Visual</span>
            </button>
            <button
              onClick={() => setEditorMode('code')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '3px',
                border: 'none',
                backgroundColor: editorMode === 'code' ? '#0284c7' : 'transparent',
                color: editorMode === 'code' ? '#ffffff' : '#a1a1aa',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Monaco Code Script Editor"
            >
              <Code2 size={12} />
              <span>Code</span>
            </button>
          </div>

          {onRunTest && (
            <button
              onClick={onRunTest}
              title="Run Active Test (F5)"
              style={{
                background: 'none',
                border: 'none',
                color: '#10b981',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Play size={13} fill="currentColor" />
            </button>
          )}

          <button
            onClick={onSave}
            title="Save File (Ctrl+S)"
            style={{
              background: 'none',
              border: 'none',
              color: isDirty ? '#007acc' : '#858585',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Save size={13} />
          </button>

          <button
            title="Split Editor Right"
            style={{
              background: 'none',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <SplitSquareVertical size={13} />
          </button>

          {onToggleTerminal && (
            <button
              onClick={onToggleTerminal}
              title={showTerminal ? 'Hide Terminal Panel (Ctrl+`)' : 'Show Terminal Panel (Ctrl+`)'}
              style={{
                background: showTerminal ? '#2a2d2e' : 'none',
                border: 'none',
                color: showTerminal ? '#38bdf8' : '#858585',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Terminal size={13} />
            </button>
          )}
        </div>
      </div>

      {/* VS Code Breadcrumbs Bar */}
      <div style={{
        height: '22px',
        backgroundColor: '#1e1e1e',
        borderBottom: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        fontSize: '11px',
        color: '#858585',
        gap: '4px',
        userSelect: 'none'
      }}>
        {breadcrumbParts.map((part, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight size={12} color="#555555" />}
            <span style={{ color: idx === breadcrumbParts.length - 1 ? '#cccccc' : '#858585' }}>
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Editor Body: Visual No-Code Step Builder vs Monaco Code Editor */}
      {editorMode === 'visual' ? (
        <VisualStepBuilder
          content={content}
          onChange={onChange}
          filePath={filePath}
        />
      ) : (
        <div style={{ flex: 1 }}>
          <MonacoEditor
            height="100%"
            language={language}
            value={content}
            theme="vscode-velocity-dark"
            beforeMount={handleEditorWillMount}
            onChange={(val) => onChange(val || '')}
            options={{
              fontSize: 14,
              lineHeight: 24,
              fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
              fontLigatures: true,
              fontWeight: '400',
              letterSpacing: 0.4,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              padding: { top: 8, bottom: 8 },
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on'
            }}
          />
        </div>
      )}
    </div>
  )
}
