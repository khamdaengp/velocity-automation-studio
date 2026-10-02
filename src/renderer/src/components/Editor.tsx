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
import { EditorTab } from '../types'
import { convertTcToPlaywright } from '../utils/tcToPlaywright'

interface EditorProps {
  filePath: string | null
  content: string
  onChange: (value: string) => void
  onSave: () => void
  onRunTest?: (targetPath?: string) => void
  onClose?: () => void
  onToggleTerminal?: () => void
  showTerminal?: boolean
  isDirty: boolean
  allFiles?: { path: string; name: string }[]
  tabs?: EditorTab[]
  activeTabPath?: string | null
  onSelectTab?: (path: string) => void
  onCloseTab?: (path: string) => void
  onConvertToCode?: (sourcePath: string, codeContent: string) => void
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
  isDirty,
  allFiles = [],
  tabs = [],
  activeTabPath,
  onSelectTab,
  onCloseTab,
  onConvertToCode
}) => {
  // Split Editor states
  const [isSplit, setIsSplit] = useState<boolean>(false)
  const [splitFilePath, setSplitFilePath] = useState<string | null>(null)
  const [splitContent, setSplitContent] = useState<string>('')
  const [splitIsDirty, setSplitIsDirty] = useState<boolean>(false)
  const [splitEditorMode, setSplitEditorMode] = useState<'visual' | 'code'>('code')

  // Main editor mode (Visual or Code for .tc files)
  const isDeclarativeTc = filePath ? filePath.endsWith('.tc') : false
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>(isDeclarativeTc ? 'visual' : 'code')

  useEffect(() => {
    if (filePath?.endsWith('.tc')) {
      setEditorMode('visual')
    } else {
      setEditorMode('code')
    }
    // If split is open with same file, update splitContent as well
    if (isSplit && splitFilePath === filePath) {
      setSplitContent(content)
    }
  }, [filePath])

  // Split toggle action
  const handleToggleSplit = () => {
    if (!isSplit) {
      setSplitFilePath(filePath)
      setSplitContent(content)
      setSplitIsDirty(false)
      // When splitting a .tc file, make left Visual and right Code by default
      if (filePath?.endsWith('.tc')) {
        setEditorMode('visual')
        setSplitEditorMode('code')
      } else {
        setSplitEditorMode('code')
      }
      setIsSplit(true)
    } else {
      setIsSplit(false)
    }
  }

  // Handle changes in left editor
  const handleLeftChange = (val: string) => {
    onChange(val)
    if (isSplit && splitFilePath === filePath) {
      setSplitContent(val)
    }
  }

  // Handle changes in right split editor
  const handleRightChange = (val: string) => {
    setSplitContent(val)
    if (splitFilePath === filePath) {
      onChange(val)
    } else {
      setSplitIsDirty(true)
    }
  }

  // Switch right pane file
  const handleSelectRightFile = async (newPath: string) => {
    if (newPath === splitFilePath) return
    if (newPath === filePath) {
      setSplitFilePath(filePath)
      setSplitContent(content)
      setSplitIsDirty(false)
      if (filePath.endsWith('.tc')) {
        setSplitEditorMode(editorMode === 'visual' ? 'code' : 'visual')
      }
      return
    }
    try {
      // @ts-ignore
      const text = await window.api.readFile(newPath)
      setSplitFilePath(newPath)
      setSplitContent(text)
      setSplitIsDirty(false)
      if (newPath.endsWith('.tc')) {
        setSplitEditorMode('visual')
      } else {
        setSplitEditorMode('code')
      }
    } catch (e) {
      console.error('Error opening file in right split:', e)
    }
  }

  // Save right pane file
  const handleSaveRight = async () => {
    if (!splitFilePath) return
    if (splitFilePath === filePath) {
      onSave()
      setSplitIsDirty(false)
    } else {
      try {
        // @ts-ignore
        await window.api.writeFile(splitFilePath, splitContent)
        setSplitIsDirty(false)
      } catch (e) {
        console.error('Failed to save file in right editor:', e)
      }
    }
  }

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

  // Right pane metadata
  const rightFileName = splitFilePath ? (splitFilePath.split(/[\\/]/).pop() || splitFilePath) : ''
  const rightExtension = rightFileName.split('.').pop() || 'js'
  const rightLanguage = rightExtension === 'json' || rightExtension === 'tc' || rightExtension === 'tcs' ? 'json' : rightExtension === 'ts' ? 'typescript' : 'javascript'
  const isRightTc = splitFilePath ? splitFilePath.endsWith('.tc') : false

  // Path segments for breadcrumbs
  const pathParts = filePath.replace(/\\/g, '/').split('/').filter(Boolean)
  const breadcrumbParts = pathParts.slice(Math.max(0, pathParts.length - 3))

  const rightPathParts = splitFilePath ? splitFilePath.replace(/\\/g, '/').split('/').filter(Boolean) : []
  const rightBreadcrumbParts = rightPathParts.slice(Math.max(0, rightPathParts.length - 3))

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
    try {
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
          'editor.background': '#1e1e1e',
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
    } catch {}
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1e1e1e',
      overflow: 'hidden'
    }}>
      {/* Top VS Code Tab Bar (Primary) */}
      <div style={{
        height: '35px',
        backgroundColor: '#18181b',
        borderBottom: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0'
      }}>
        {/* Multi-Tab List or Single Tab */}
        <div style={{
          display: 'flex',
          height: '100%',
          alignItems: 'center',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          flex: 1,
          minWidth: 0
        }}>
          {tabs && tabs.length > 0 ? (
            tabs.map((tab) => {
              const isActive = tab.path === (activeTabPath || filePath)
              const tabFileName = tab.name || tab.path.split(/[\\/]/).pop() || tab.path
              return (
                <div
                  key={tab.path}
                  onClick={() => onSelectTab?.(tab.path)}
                  onMouseDown={(e) => {
                    if (e.button === 1) {
                      e.preventDefault()
                      e.stopPropagation()
                      onCloseTab?.(tab.path)
                    }
                  }}
                  style={{
                    height: '100%',
                    backgroundColor: isActive ? '#1e1e1e' : '#18181b',
                    borderTop: isActive ? '2px solid #007acc' : '2px solid transparent',
                    borderRight: '1px solid #27272a',
                    padding: '0 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: isActive ? '#ffffff' : '#9ca3af',
                    flexShrink: 0,
                    maxWidth: '180px',
                    userSelect: 'none',
                    transition: 'background-color 0.1s, color 0.1s'
                  }}
                  title={tab.path}
                >
                  {getFileIcon(tabFileName)}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tabFileName}
                  </span>

                  <div
                    style={{ display: 'flex', alignItems: 'center' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onCloseTab?.(tab.path)
                    }}
                  >
                    {tab.isDirty ? (
                      <span
                        style={{ color: '#ffffff', fontSize: '13px', lineHeight: 1, padding: '2px' }}
                        title="Unsaved changes (Click to close)"
                      >
                        ●
                      </span>
                    ) : (
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'inherit',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: '3px',
                          opacity: isActive ? 0.8 : 0.4
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = isActive ? '0.8' : '0.4')}
                        title="Close Tab (Ctrl+W)"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div style={{
              height: '100%',
              backgroundColor: '#1e1e1e',
              borderTop: '2px solid #007acc',
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
          )}
        </div>

        {/* Tab Right Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingRight: '8px' }}>
          {/* Dual-Mode Switcher for Left/Primary Editor */}
          {isDeclarativeTc && (
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
          )}

          {isDeclarativeTc && (
            <button
              onClick={() => {
                if (filePath) {
                  try {
                    const jsCode = convertTcToPlaywright(content)
                    onConvertToCode?.(filePath, jsCode)
                  } catch (e: any) {
                    console.error('Conversion error:', e)
                  }
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid #0284c7',
                backgroundColor: 'rgba(2, 132, 199, 0.15)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                marginRight: '6px'
              }}
              title="Convert this No-Code (.tc) visual test case into native Playwright code (.spec.js)"
            >
              <Code2 size={12} color="#38bdf8" />
              <span>Convert to .spec.js</span>
            </button>
          )}

          {onRunTest && (
            <button
              onClick={() => onRunTest(filePath)}
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

          {/* Split Editor Right Toggle */}
          <button
            onClick={handleToggleSplit}
            title={isSplit ? 'Close Split Editor' : 'Split Editor Right'}
            style={{
              background: isSplit ? '#007acc' : 'none',
              border: 'none',
              color: isSplit ? '#ffffff' : '#858585',
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

      {/* Editor Body: Single or Split Panes */}
      {!isSplit ? (
        /* SINGLE PANE MODE */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Breadcrumbs Bar */}
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

          {/* Main Body */}
          {editorMode === 'visual' && isDeclarativeTc ? (
            <VisualStepBuilder
              content={content}
              onChange={handleLeftChange}
              filePath={filePath}
              onConvertToCode={onConvertToCode}
              onSwitchToCode={() => setEditorMode('code')}
            />
          ) : (
            <div style={{ flex: 1 }}>
              <MonacoEditor
                height="100%"
                language={language}
                value={content}
                theme="vscode-velocity-dark"
                beforeMount={handleEditorWillMount}
                onChange={(val) => handleLeftChange(val || '')}
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
      ) : (
        /* SPLIT PANE MODE (50% / 50%) */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
          {/* LEFT PANE */}
          <div style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #27272a',
            overflow: 'hidden'
          }}>
            {/* Left Breadcrumbs */}
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

            {/* Left Content */}
            {editorMode === 'visual' ? (
              <VisualStepBuilder
                content={content}
                onChange={handleLeftChange}
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
                  onChange={(val) => handleLeftChange(val || '')}
                  options={{
                    fontSize: 13,
                    lineHeight: 22,
                    fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
                    fontLigatures: true,
                    fontWeight: '400',
                    letterSpacing: 0.3,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    padding: { top: 8, bottom: 8 }
                  }}
                />
              </div>
            )}
          </div>

          {/* RIGHT PANE (SPLIT) */}
          <div style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Right Pane Tab Bar */}
            <div style={{
              height: '35px',
              backgroundColor: '#18181b',
              borderBottom: '1px solid #27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0'
            }}>
              {/* Right Tab with File Selector */}
              <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
                <div style={{
                  height: '100%',
                  backgroundColor: '#1e1e1e',
                  borderTop: '2px solid #38bdf8',
                  borderRight: '1px solid #27272a',
                  padding: '0 8px 0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: '#ffffff'
                }}>
                  {getFileIcon(rightFileName)}
                  {/* File Selector Dropdown */}
                  <select
                    value={splitFilePath || ''}
                    onChange={(e) => handleSelectRightFile(e.target.value)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      outline: 'none',
                      maxWidth: '180px'
                    }}
                    title="Switch file in right pane"
                  >
                    <option value={filePath} style={{ backgroundColor: '#27272a' }}>
                      {fileName} (Active)
                    </option>
                    {allFiles
                      .filter((f) => f.path !== filePath)
                      .map((f) => (
                        <option key={f.path} value={f.path} style={{ backgroundColor: '#27272a' }}>
                          {f.name}
                        </option>
                      ))}
                  </select>
                  {splitIsDirty || (splitFilePath === filePath && isDirty) ? (
                    <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1 }}>●</span>
                  ) : null}
                </div>
              </div>

              {/* Right Tab Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingRight: '8px' }}>
                {/* Dual-Mode Switcher for Right Pane (if .tc) */}
                {isRightTc && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#27272a',
                    borderRadius: '4px',
                    padding: '2px',
                    marginRight: '6px'
                  }}>
                    <button
                      onClick={() => setSplitEditorMode('visual')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        border: 'none',
                        backgroundColor: splitEditorMode === 'visual' ? '#0284c7' : 'transparent',
                        color: splitEditorMode === 'visual' ? '#ffffff' : '#a1a1aa',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title="Visual Step Builder"
                    >
                      <LayoutList size={11} />
                      <span>Visual</span>
                    </button>
                    <button
                      onClick={() => setSplitEditorMode('code')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        border: 'none',
                        backgroundColor: splitEditorMode === 'code' ? '#0284c7' : 'transparent',
                        color: splitEditorMode === 'code' ? '#ffffff' : '#a1a1aa',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title="Monaco Code Script Editor"
                    >
                      <Code2 size={11} />
                      <span>Code</span>
                    </button>
                  </div>
                )}

                {onRunTest && splitFilePath && (
                  <button
                    onClick={() => onRunTest(splitFilePath)}
                    title="Run This Test (Right Pane)"
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
                  onClick={handleSaveRight}
                  title="Save Right File (Ctrl+S)"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: splitIsDirty || (splitFilePath === filePath && isDirty) ? '#007acc' : '#858585',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Save size={13} />
                </button>

                {/* Close Split Button */}
                <button
                  onClick={() => setIsSplit(false)}
                  title="Close Split Editor"
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
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Right Breadcrumbs */}
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
              {rightBreadcrumbParts.map((part, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight size={12} color="#555555" />}
                  <span style={{ color: idx === rightBreadcrumbParts.length - 1 ? '#cccccc' : '#858585' }}>
                    {part}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* Right Content */}
            {splitEditorMode === 'visual' && splitFilePath && isRightTc ? (
              <VisualStepBuilder
                content={splitContent}
                onChange={handleRightChange}
                filePath={splitFilePath}
                onConvertToCode={onConvertToCode}
                onSwitchToCode={() => setSplitEditorMode('code')}
              />
            ) : (
              <div style={{ flex: 1 }}>
                <MonacoEditor
                  height="100%"
                  language={rightLanguage}
                  value={splitContent}
                  theme="vscode-velocity-dark"
                  beforeMount={handleEditorWillMount}
                  onChange={(val) => handleRightChange(val || '')}
                  options={{
                    fontSize: 13,
                    lineHeight: 22,
                    fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
                    fontLigatures: true,
                    fontWeight: '400',
                    letterSpacing: 0.3,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    padding: { top: 8, bottom: 8 }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
