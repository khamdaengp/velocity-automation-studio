import React, { useState, useEffect } from 'react'
import { Toolbar } from './components/Toolbar'
import { ActivityBar, ActivityView } from './components/ActivityBar'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { BottomPanel } from './components/BottomPanel'
import { ApiTester } from './components/ApiTester'
import { DatabaseStudio } from './components/DatabaseStudio'
import { EnvironmentManager } from './components/EnvironmentManager'
import { WebInspector } from './components/WebInspector'
import { StatusBar } from './components/StatusBar'
import { DialogModal, DialogConfig } from './components/DialogModal'
import { FileNode, LogEntry, EnvironmentsData, EditorTab } from './types'
import { Folder, Play, Plus, FolderPlus, Pencil, Settings, FolderOutput } from 'lucide-react'

export const App: React.FC = () => {
  const [tree, setTree] = useState<FileNode[]>([])
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null)
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [isDirty, setIsDirty] = useState<boolean>(false)
  const [showSidebar, setShowSidebar] = useState<boolean>(true)
  const [tabs, setTabs] = useState<EditorTab[]>([])
  const [activeTabPath, setActiveTabPath] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ActivityView>('explorer')
  const [dialog, setDialog] = useState<DialogConfig>({
    isOpen: false,
    title: '',
    isPrompt: true,
    onConfirm: () => {},
    onCancel: () => {}
  })

  // Execution states
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [headless, setHeadless] = useState<boolean>(true)
  const [recordUrl, setRecordUrl] = useState<string>('https://google.com')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [lastResult, setLastResult] = useState<{ status: 'passed' | 'failed'; duration: number; code: number } | null>(null)
  const [memoryMB, setMemoryMB] = useState<number>(45)
  const [showTerminal, setShowTerminal] = useState<boolean>(true)
  const [environmentsData, setEnvironmentsData] = useState<EnvironmentsData | null>(null)
  const [activeEnv, setActiveEnv] = useState<string>('dev')

  const loadEnvironments = async () => {
    try {
      // @ts-ignore
      const res: EnvironmentsData = await window.api.getEnvironments()
      if (res) {
        setEnvironmentsData(res)
        setActiveEnv(res.active || 'dev')
      }
    } catch (e) {
      console.error('Failed to load environments:', e)
    }
  }

  const handleSelectEnv = async (envId: string) => {
    try {
      // @ts-ignore
      await window.api.setActiveEnvironment(envId)
      setActiveEnv(envId)
      setEnvironmentsData((prev) => (prev ? { ...prev, active: envId } : prev))
    } catch (e) {
      console.error(e)
    }
  }

  // Load project hierarchy tree
  const loadTree = async () => {
    try {
      // @ts-ignore
      const projectTree = await window.api.getProjectTree()
      setTree(projectTree)
      return projectTree
    } catch (e) {
      console.error('Failed to load project tree:', e)
      return []
    }
  }

  useEffect(() => {
    loadEnvironments()
    loadTree().then((initialTree) => {
      // Auto-select first test file if available
      const findFirstFile = (nodes: FileNode[]): FileNode | null => {
        for (const n of nodes) {
          if (!n.isDir) return n
          if (n.children) {
            const found = findFirstFile(n.children)
            if (found) return found
          }
        }
        return null
      }
      const first = findFirstFile(initialTree)
      if (first) {
        handleSelectNode(first)
      }
    })

    // Listen to test execution logs
    // @ts-ignore
    const cleanup = window.api.onTestOutput((data: { type: any; text: string; data?: any }) => {
      const newEntry: LogEntry = {
        id: Math.random().toString(36).substring(7),
        type: data.type,
        text: data.text,
        timestamp: new Date().toLocaleTimeString()
      }
      setLogs((prev) => [...prev, newEntry])

      if (data.type === 'result' && data.data) {
        setIsRunning(false)
        setLastResult({
          status: data.data.status,
          duration: data.data.duration,
          code: data.data.code
        })
      }
    })

    // System metrics poller
    const timer = setInterval(async () => {
      try {
        // @ts-ignore
        const metrics = await window.api.getSystemMetrics()
        if (metrics?.memoryMB) setMemoryMB(metrics.memoryMB)
      } catch {}
    }, 3000)

    return () => {
      cleanup()
      clearInterval(timer)
    }
  }, [])

  const handleImportProject = async () => {
    try {
      // @ts-ignore
      const res = await window.api.importProject()
      if (res?.success) {
        await loadTree()
      } else if (res && !res.canceled && res.error) {
        alert(`Import error: ${res.error}`)
      }
    } catch (err: any) {
      console.error('Import error:', err)
    }
  }

  const handleExportProject = async (node?: FileNode) => {
    const targetNode = node || (selectedNode?.isDir ? selectedNode : null)
    if (!targetNode) {
      alert('Please select a project folder or suite to export.')
      return
    }
    try {
      // @ts-ignore
      const res = await window.api.exportProject(targetNode.relativePath)
      if (res?.success) {
        alert(`Project "${targetNode.name}" exported successfully!`)
      } else if (res && !res.canceled && res.error) {
        alert(`Export error: ${res.error}`)
      }
    } catch (err: any) {
      console.error('Export error:', err)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSaveFile()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        handleImportProject()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        handleExportProject()
      } else if (e.key === 'F5') {
        e.preventDefault()
        handleRunTest()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.key === '~')) {
        e.preventDefault()
        setShowTerminal((prev) => !prev)
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setShowSidebar((prev) => !prev)
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        if (activeFile) handleCloseTab(activeFile)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeFile, fileContent, headless, selectedNode, tabs])

  const handleSelectNode = async (node: FileNode) => {
    setSelectedNode(node)
    if (!node.isDir) {
      const existing = tabs.find((t) => t.path === node.path)
      if (existing) {
        setActiveTabPath(node.path)
        setActiveFile(node.path)
        setFileContent(existing.content)
        setIsDirty(existing.isDirty)
      } else {
        try {
          // @ts-ignore
          const content = await window.api.readFile(node.path)
          const newTab: EditorTab = {
            path: node.path,
            name: node.name,
            content,
            isDirty: false
          }
          setTabs((prev) => [...prev, newTab])
          setActiveTabPath(node.path)
          setActiveFile(node.path)
          setFileContent(content)
          setIsDirty(false)
        } catch (e: any) {
          console.error('Failed to read file:', e)
        }
      }
    }
  }

  const handleSelectTab = (path: string) => {
    const tab = tabs.find((t) => t.path === path)
    if (!tab) return
    setActiveTabPath(path)
    setActiveFile(path)
    setFileContent(tab.content)
    setIsDirty(tab.isDirty)
  }

  const handleCloseTab = (path: string) => {
    const idx = tabs.findIndex((t) => t.path === path)
    if (idx === -1) return
    const newTabs = tabs.filter((t) => t.path !== path)
    setTabs(newTabs)
    if (activeFile === path) {
      if (newTabs.length > 0) {
        const nextIdx = Math.min(idx, newTabs.length - 1)
        const nextTab = newTabs[nextIdx]
        setActiveTabPath(nextTab.path)
        setActiveFile(nextTab.path)
        setFileContent(nextTab.content)
        setIsDirty(nextTab.isDirty)
      } else {
        setActiveTabPath(null)
        setActiveFile(null)
        setFileContent('')
        setIsDirty(false)
      }
    }
  }

  const handleContentChange = (val: string) => {
    setFileContent(val)
    setIsDirty(true)
    if (activeFile) {
      setTabs((prev) =>
        prev.map((t) => (t.path === activeFile ? { ...t, content: val, isDirty: true } : t))
      )
    }
  }

  const handleSaveFile = async (targetFilePath?: string) => {
    const target = targetFilePath || activeFile
    if (!target) return
    const targetTab = tabs.find((t) => t.path === target)
    const contentToSave = targetTab ? targetTab.content : fileContent
    try {
      // @ts-ignore
      await window.api.writeFile(target, contentToSave)
      setIsDirty(false)
      setTabs((prev) =>
        prev.map((t) => (t.path === target ? { ...t, isDirty: false } : t))
      )
    } catch (e: any) {
      console.error(`Save error: ${e.message}`)
    }
  }

  const handleConvertToCode = async (sourcePath: string, codeContent: string) => {
    try {
      const targetPath = sourcePath.endsWith('.tc')
        ? sourcePath.replace(/\.tc$/, '.spec.js')
        : `${sourcePath}.spec.js`

      // @ts-ignore
      await window.api.writeFile(targetPath, codeContent)
      await loadTree()

      const fileName = targetPath.split(/[/\\]/).pop() || 'test.spec.js'
      const existingTab = tabs.find((t) => t.path === targetPath)
      if (existingTab) {
        setTabs((prev) =>
          prev.map((t) =>
            t.path === targetPath ? { ...t, content: codeContent, isDirty: false } : t
          )
        )
      } else {
        const newTab: EditorTab = {
          path: targetPath,
          name: fileName,
          content: codeContent,
          isDirty: false
        }
        setTabs((prev) => [...prev, newTab])
      }
      setActiveTabPath(targetPath)
      setActiveFile(targetPath)
      setFileContent(codeContent)
      setIsDirty(false)

      setLogs((prev) => [
        ...prev,
        `⚡ [Converter] Successfully converted No-Code test to Playwright script: ${fileName}`
      ])
      setShowTerminal(true)
    } catch (e: any) {
      console.error('Failed to convert to code:', e)
      setDialog({
        isOpen: true,
        title: 'Conversion Error',
        description: e.message || 'Failed to convert test case to code.',
        isPrompt: false,
        confirmLabel: 'OK',
        onCancel: () => setDialog((prev) => ({ ...prev, isOpen: false })),
        onConfirm: () => setDialog((prev) => ({ ...prev, isOpen: false }))
      })
    }
  }

  const handleNewProject = (parentRelativePath = '') => {
    const defaultName = parentRelativePath ? 'sub-project-name' : 'Project_A'
    setDialog({
      isOpen: true,
      title: 'Create Project / Sub-Project Folder',
      description: parentRelativePath
        ? `Create a sub-project directory inside [${parentRelativePath}]`
        : 'Create a new project folder in your workspace.',
      initialValue: defaultName,
      isPrompt: true,
      confirmLabel: 'Create Folder',
      onCancel: () => setDialog((prev) => ({ ...prev, isOpen: false })),
      onConfirm: async (folderName) => {
        setDialog((prev) => ({ ...prev, isOpen: false }))
        const name = folderName.trim()
        if (!name) return
        const target = parentRelativePath ? `${parentRelativePath}/${name}` : name
        try {
          // @ts-ignore
          await window.api.createFolder(target)
          await loadTree()
        } catch (e: any) {
          console.error(e)
        }
      }
    })
  }

  const handleNewReferenceProject = () => {
    setDialog({
      isOpen: true,
      title: 'Create Automation Project Suite',
      description: 'Generates a project with test-case/ (.tc), test-suite/ (.tcs), keyword/, and index.json configuration.',
      initialValue: 'Automation_Suite_1',
      isPrompt: true,
      confirmLabel: 'Create Suite',
      onCancel: () => setDialog((prev) => ({ ...prev, isOpen: false })),
      onConfirm: async (projName) => {
        setDialog((prev) => ({ ...prev, isOpen: false }))
        const name = projName.trim()
        if (!name) return
        try {
          // @ts-ignore
          await window.api.createReferenceProject(name)
          await loadTree()
        } catch (e: any) {
          console.error(e)
        }
      }
    })
  }

  const handleNewTest = (parentRelativePath = '', isNoCode = false) => {
    setDialog({
      isOpen: true,
      title: isNoCode ? 'Create New No-Code Test Case (.tc)' : 'Create New Test File',
      description: isNoCode
        ? 'Creates a visual No-Code test case. Edit steps using dropdown actions without writing code.'
        : 'Enter a filename. Supports .spec.js, .spec.ts, or .tc / .tcs format.',
      initialValue: isNoCode ? 'my-test-flow.tc' : 'test.spec.js',
      isPrompt: true,
      confirmLabel: 'Create File',
      onCancel: () => setDialog((prev) => ({ ...prev, isOpen: false })),
      onConfirm: async (fileName) => {
        setDialog((prev) => ({ ...prev, isOpen: false }))
        const cleanName = fileName.trim()
        if (!cleanName) return

        let defaultCode = cleanName.endsWith('.tc')
          ? JSON.stringify(
              {
                id: 'tc-' + Date.now(),
                name: 'New Test Case',
                commands: [{ command: 'open', target: 'https://example.com', value: '' }]
              },
              null,
              2
            )
          : cleanName.endsWith('.tcs')
          ? JSON.stringify(
              {
                id: 'tcs-' + Date.now(),
                name: 'New Test Suite',
                parallel: false,
                persistSession: false,
                timeout: 30000,
                tests: []
              },
              null,
              2
            )
          : `// Velocity Playwright Test Suite\nconsole.log('⚡ Launching test...');\nawait page.setContent('<h1>Test Passed!</h1>');\nconst title = await page.textContent('h1');\nconsole.log('📌 Heading:', title);\n`

        const target = parentRelativePath ? `${parentRelativePath}/${cleanName}` : cleanName
        try {
          // @ts-ignore
          await window.api.writeFile(target, defaultCode)
          const updatedTree = await loadTree()

          const findNode = (nodes: FileNode[]): FileNode | null => {
            for (const n of nodes) {
              if (n.relativePath === target || n.name === cleanName) return n
              if (n.children) {
                const found = findNode(n.children)
                if (found) return found
              }
            }
            return null
          }
          const created = findNode(updatedTree)
          if (created) handleSelectNode(created)
        } catch (e: any) {
          console.error(e)
        }
      }
    })
  }

  const handleDeleteNode = (node: FileNode) => {
    setDialog({
      isOpen: true,
      title: `Delete ${node.isDir ? 'Project Folder' : 'Test File'}`,
      description: `Are you sure you want to permanently delete "${node.name}"? This action cannot be undone.`,
      isPrompt: false,
      isDestructive: true,
      confirmLabel: 'Delete',
      onCancel: () => setDialog((prev) => ({ ...prev, isOpen: false })),
      onConfirm: async () => {
        setDialog((prev) => ({ ...prev, isOpen: false }))
        try {
          // @ts-ignore
          await window.api.deleteItem(node.path)
          handleCloseTab(node.path)
          await loadTree()
        } catch (e: any) {
          console.error(e)
        }
      }
    })
  }

  const handleRenameNode = (node: FileNode) => {
    setDialog({
      isOpen: true,
      title: `Rename ${node.isDir ? 'Folder' : 'File'}`,
      description: `Enter the new name for "${node.name}":`,
      initialValue: node.name,
      isPrompt: true,
      confirmLabel: 'Rename',
      onCancel: () => setDialog((prev) => ({ ...prev, isOpen: false })),
      onConfirm: async (newName) => {
        setDialog((prev) => ({ ...prev, isOpen: false }))
        const cleanName = newName.trim()
        if (!cleanName || cleanName === node.name) return

        try {
          // @ts-ignore
          const res = await window.api.renameItem(node.path, cleanName)
          if (res?.success) {
            setTabs((prev) =>
              prev.map((t) => (t.path === node.path ? { ...t, path: res.newPath, name: cleanName } : t))
            )
            if (activeFile === node.path) {
              setActiveFile(res.newPath)
              setActiveTabPath(res.newPath)
            } else if (node.isDir && activeFile && activeFile.startsWith(node.path)) {
              const updatedPath = activeFile.replace(node.path, res.newPath)
              setActiveFile(updatedPath)
              setActiveTabPath(updatedPath)
            }
            if (selectedNode?.path === node.path) {
              setSelectedNode({ ...node, name: cleanName, path: res.newPath })
            }
            await loadTree()
          }
        } catch (e: any) {
          console.error('Rename error:', e)
          setDialog({
            isOpen: true,
            title: 'Rename Error',
            description: e.message || 'Failed to rename the item.',
            isPrompt: false,
            confirmLabel: 'OK',
            onCancel: () => setDialog((prev) => ({ ...prev, isOpen: false })),
            onConfirm: () => setDialog((prev) => ({ ...prev, isOpen: false }))
          })
        }
      }
    })
  }

  const handleRunSuite = async (node: FileNode) => {
    setIsRunning(true)
    setLastResult(null)
    setShowTerminal(true)
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        type: 'status',
        text: `Starting suite in [${node.name}] (${headless ? 'Headless' : 'Headed'})...`,
        timestamp: new Date().toLocaleTimeString()
      }
    ])

    try {
      // @ts-ignore
      const res = await window.api.runTest({
        filePath: node.path,
        headless
      })
      if (!res.success) {
        setIsRunning(false)
      }
    } catch (err: any) {
      setIsRunning(false)
      alert(`Runner error: ${err.message}`)
    }
  }

  const handleRunTest = async (targetPath?: string) => {
    const target = targetPath || activeFile || selectedNode?.path
    if (!target) {
      alert('Please select a test script or project folder first!')
      return
    }

    if (isDirty && activeFile && (!targetPath || targetPath === activeFile)) {
      await handleSaveFile()
    }

    setIsRunning(true)
    setLastResult(null)
    setShowTerminal(true)
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        type: 'status',
        text: `Starting test execution for [${selectedNode?.name || 'current'}]...`,
        timestamp: new Date().toLocaleTimeString()
      }
    ])

    try {
      // @ts-ignore
      const res = await window.api.runTest({
        filePath: target,
        headless
      })
      if (!res.success) {
        setIsRunning(false)
      }
    } catch (err: any) {
      setIsRunning(false)
      alert(`Runner error: ${err.message}`)
    }
  }

  const handleStopTest = async () => {
    try {
      // @ts-ignore
      await window.api.stopTest()
      setIsRunning(false)
    } catch (err) {}
  }

  const handleRecord = async () => {
    try {
      // @ts-ignore
      await window.api.recordTest(recordUrl)
    } catch (err: any) {
      alert(`Record error: ${err.message}`)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: '#18181b',
      color: '#cccccc'
    }}>
      {/* 1. VS Code Menu & Title Bar */}
      <Toolbar
        isRunning={isRunning}
        headless={headless}
        onToggleHeadless={() => setHeadless(!headless)}
        onRunTest={handleRunTest}
        onStopTest={handleStopTest}
        onRecord={handleRecord}
        recordUrl={recordUrl}
        setRecordUrl={setRecordUrl}
        memoryMB={memoryMB}
        onNewTest={() => handleNewTest()}
        onNewSuite={handleNewReferenceProject}
        onSave={handleSaveFile}
        onClearLogs={() => setLogs([])}
        onToggleTerminal={() => setShowTerminal((prev) => !prev)}
        onImportProject={handleImportProject}
        onExportProject={() => handleExportProject()}
        activeEnv={activeEnv}
        environments={environmentsData?.environments.map((e) => ({ id: e.id, name: e.name }))}
        onSelectEnv={handleSelectEnv}
      />

      {/* 2. Middle Work Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Activity Bar (VS Code Left Rail) */}
        <ActivityBar
          activeView={activeView}
          onSelectView={(v) => {
            setActiveView(v)
            setShowSidebar(true)
          }}
          isRunning={isRunning}
          lastStatus={lastResult?.status}
          showSidebar={showSidebar}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
        />

        {/* Primary Sidebar (Explorer / Suites) */}
        {showSidebar && (activeView === 'explorer' || activeView === 'suites') && (
          <Sidebar
            tree={tree}
            activePath={selectedNode?.path || null}
            onSelectNode={handleSelectNode}
            onRefresh={loadTree}
            onNewProject={handleNewProject}
            onNewReferenceProject={handleNewReferenceProject}
            onNewTest={handleNewTest}
            onRenameNode={handleRenameNode}
            onDeleteNode={handleDeleteNode}
            onRunSuite={handleRunSuite}
            onImportProject={handleImportProject}
            onExportProject={handleExportProject}
            onCollapse={() => setShowSidebar(false)}
            activeView={activeView}
          />
        )}

        {/* Main Editor & Tools Area */}
        <main style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
          backgroundColor: '#1e1e1e'
        }}>
          {activeView === 'recorder' ? (
            <WebInspector
              recordUrl={recordUrl}
              setRecordUrl={setRecordUrl}
              onRecord={handleRecord}
              activeEnv={activeEnv}
              environmentsData={environmentsData}
              onNewTestFile={async (newFilePath, content) => {
                await loadTree()
                setActiveFile(newFilePath)
                setFileContent(content)
                setActiveView('explorer')
              }}
            />
          ) : activeView === 'api' ? (
            <ApiTester />
          ) : activeView === 'database' ? (
            <DatabaseStudio />
          ) : activeView === 'environments' ? (
            <EnvironmentManager
              onActiveEnvChanged={(id) => {
                setActiveEnv(id)
                loadEnvironments()
              }}
            />
          ) : activeView === 'settings' ? (
            /* VS Code Style Settings Page */
            <div style={{
              flex: 1,
              backgroundColor: '#1e1e1e',
              padding: '32px 40px',
              overflowY: 'auto'
            }}>
              <div style={{ maxWidth: '700px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
                  Velocity Automation Studio Settings
                </h2>
                <p style={{ fontSize: '13px', color: '#858585', marginBottom: '24px' }}>
                  Manage Playwright Turbo engine preferences and test automation defaults.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: '#252526', padding: '16px', borderRadius: '6px', border: '1px solid #333333' }}>
                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '14px', marginBottom: '4px' }}>
                      Browser Execution Mode
                    </div>
                    <div style={{ fontSize: '12px', color: '#858585', marginBottom: '12px' }}>
                      Headless mode runs in the background for sub-second speeds. Headed mode launches a visible browser window.
                    </div>
                    <button
                      onClick={() => setHeadless(!headless)}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: headless ? '#007acc' : '#3c3c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500
                      }}
                    >
                      {headless ? 'Headless Mode: Enabled (Fastest)' : 'Headed Mode: Enabled (Visual Browser)'}
                    </button>
                  </div>

                  <div style={{ backgroundColor: '#252526', padding: '16px', borderRadius: '6px', border: '1px solid #333333' }}>
                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '14px', marginBottom: '4px' }}>
                      Playwright Codegen Default URL
                    </div>
                    <div style={{ fontSize: '12px', color: '#858585', marginBottom: '10px' }}>
                      Default website opened when you click the Record button.
                    </div>
                    <input
                      type="text"
                      value={recordUrl}
                      onChange={(e) => setRecordUrl(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#1e1e1e',
                        border: '1px solid #3c3c3c',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '13px',
                        width: '320px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ backgroundColor: '#252526', padding: '16px', borderRadius: '6px', border: '1px solid #333333' }}>
                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '14px', marginBottom: '4px' }}>
                      Engine Telemetry & Diagnostics
                    </div>
                    <div style={{ fontSize: '12px', color: '#858585', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                      <div>Core Engine: <strong>Playwright Chromium Turbo</strong></div>
                      <div>RAM Usage: <strong>{memoryMB || 42} MB</strong></div>
                      <div>Cold Start: <strong>&lt;0.4s</strong></div>
                      <div>Application: <strong>Velocity Automation Studio v1.0.8</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedNode && selectedNode.isDir ? (
            /* Project / Sub-Project Suite Dashboard in VS Code Card Style */
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1e1e1e',
              padding: '24px'
            }}>
              <div style={{
                backgroundColor: '#252526',
                border: '1px solid #333333',
                borderRadius: '8px',
                padding: '32px',
                maxWidth: '560px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  backgroundColor: '#18181b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: '#eab308'
                }}>
                  <Folder size={28} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                  Automation Suite: {selectedNode.name}
                </h3>
                <p style={{ fontSize: '12px', color: '#858585', marginBottom: '24px' }}>
                  Location: <code style={{ color: '#007acc' }}>tests/{selectedNode.relativePath}</code>
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleRunSuite(selectedNode)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#15803d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <Play size={14} fill="currentColor" />
                    Run Suite
                  </button>
                  <button
                    onClick={() => handleNewTest(selectedNode.relativePath)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#007acc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} />
                    Add Test
                  </button>
                  <button
                    onClick={() => handleNewProject(selectedNode.relativePath)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#2d2d2d',
                      color: '#cccccc',
                      border: '1px solid #3c3c3c',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <FolderPlus size={14} />
                    Add Folder
                  </button>
                  <button
                    onClick={() => handleRenameNode(selectedNode)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#2d2d2d',
                      color: '#cccccc',
                      border: '1px solid #3c3c3c',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <Pencil size={14} />
                    Rename
                  </button>
                  <button
                    onClick={() => handleExportProject(selectedNode)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#2d2d2d',
                      color: '#38bdf8',
                      border: '1px solid #3c3c3c',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    title="Export this suite to an external directory"
                  >
                    <FolderOutput size={14} />
                    Export Suite
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Editor
              filePath={activeFile}
              content={fileContent}
              onChange={handleContentChange}
              onSave={handleSaveFile}
              onRunTest={handleRunTest}
              onClose={() => {
                if (activeFile) {
                  handleCloseTab(activeFile)
                } else {
                  setActiveFile(null)
                  setSelectedNode(null)
                }
              }}
              onToggleTerminal={() => setShowTerminal((prev) => !prev)}
              showTerminal={showTerminal}
              isDirty={isDirty}
              tabs={tabs}
              activeTabPath={activeTabPath}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
              onConvertToCode={handleConvertToCode}
              allFiles={(() => {
                const list: { path: string; name: string }[] = []
                const collect = (nodes: FileNode[]) => {
                  for (const n of nodes) {
                    if (!n.isDir) list.push({ path: n.path, name: n.name })
                    else if (n.children) collect(n.children)
                  }
                }
                collect(tree)
                return list
              })()}
            />
          )}

          {/* Bottom VS Code Terminal / Output Panel */}
          {showTerminal && (activeView === 'explorer' || activeView === 'suites') && (
            <BottomPanel
              logs={logs}
              onClearLogs={() => setLogs([])}
              onClose={() => setShowTerminal(false)}
              lastResult={lastResult}
            />
          )}
        </main>
      </div>

      {/* 3. VS Code Bottom Status Bar */}
      <StatusBar
        isRunning={isRunning}
        activeFile={activeFile}
        lastResult={lastResult}
        memoryMB={memoryMB}
        headless={headless}
        showTerminal={showTerminal}
        onToggleTerminal={() => setShowTerminal((prev) => !prev)}
      />

      <DialogModal dialog={dialog} />
    </div>
  )
}
