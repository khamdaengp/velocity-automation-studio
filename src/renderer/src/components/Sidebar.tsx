import React, { useState } from 'react'
import {
  Folder,
  FolderOpen,
  FileCode,
  FilePlus,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Trash2,
  Play,
  Pencil,
  RefreshCw,
  PlusSquare,
  ChevronsDownUp,
  FileJson,
  FlaskConical,
  CheckCircle2,
  FolderInput,
  FolderOutput
} from 'lucide-react'
import { FileNode } from '../types'

interface SidebarProps {
  tree: FileNode[]
  activePath: string | null
  onSelectNode: (node: FileNode) => void
  onRefresh: () => void
  onNewProject: (parentRelativePath?: string) => void
  onNewReferenceProject: () => void
  onNewTest: (parentRelativePath?: string) => void
  onRenameNode: (node: FileNode) => void
  onDeleteNode: (node: FileNode) => void
  onRunSuite: (node: FileNode) => void
  onImportProject?: () => void
  onExportProject?: (node: FileNode) => void
  activeView?: 'explorer' | 'suites' | 'api' | 'settings'
}

export const Sidebar: React.FC<SidebarProps> = ({
  tree,
  activePath,
  onSelectNode,
  onRefresh,
  onNewProject,
  onNewReferenceProject,
  onNewTest,
  onRenameNode,
  onDeleteNode,
  onRunSuite,
  onImportProject,
  onExportProject,
  activeView = 'explorer'
}) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [isSectionOpen, setIsSectionOpen] = useState(true)

  const toggleCollapse = (path: string) => {
    setCollapsed((prev) => ({ ...prev, [path]: !prev[path] }))
  }

  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {}
    const traverse = (nodes: FileNode[]) => {
      for (const n of nodes) {
        if (n.isDir) {
          allCollapsed[n.path] = true
          if (n.children) traverse(n.children)
        }
      }
    }
    traverse(tree)
    setCollapsed(allCollapsed)
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.spec.js') || fileName.endsWith('.test.js')) {
      return <FlaskConical size={14} color="#38bdf8" />
    }
    if (fileName.endsWith('.js')) {
      return <FileCode size={14} color="#facc15" />
    }
    if (fileName.endsWith('.ts')) {
      return <FileCode size={14} color="#3b82f6" />
    }
    if (fileName.endsWith('.tc')) {
      return <CheckCircle2 size={14} color="#10b981" />
    }
    if (fileName.endsWith('.tcs')) {
      return <PlusSquare size={14} color="#a855f7" />
    }
    if (fileName.endsWith('.json')) {
      return <FileJson size={14} color="#eab308" />
    }
    return <FileCode size={14} color="#94a3b8" />
  }

  const renderTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => {
      const isSelected = activePath === node.path
      const isFolderOpen = !collapsed[node.path]

      if (node.isDir) {
        return (
          <div key={node.path} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              className="sidebar-tree-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                paddingLeft: `${8 + level * 14}px`,
                cursor: 'pointer',
                fontSize: '13px',
                backgroundColor: isSelected ? '#094771' : 'transparent',
                color: isSelected ? '#ffffff' : '#cccccc',
                transition: 'background-color 0.1s'
              }}
              onClick={() => {
                toggleCollapse(node.path)
                onSelectNode(node)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
                {isFolderOpen ? <ChevronDown size={14} color="#a1a1aa" /> : <ChevronRight size={14} color="#a1a1aa" />}
                {isFolderOpen ? <FolderOpen size={15} color="#eab308" /> : <Folder size={15} color="#eab308" />}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {node.name}
                </span>
              </div>

              {/* Action buttons on folder hover */}
              <div
                className="row-actions"
                style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onRunSuite(node)}
                  title={`Run suite in [${node.name}]`}
                  style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '2px' }}
                >
                  <Play size={12} fill="currentColor" />
                </button>
                <button
                  onClick={() => onNewTest(node.relativePath)}
                  title="New Test File"
                  style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '2px' }}
                >
                  <FilePlus size={13} />
                </button>
                <button
                  onClick={() => onNewProject(node.relativePath)}
                  title="New Folder"
                  style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '2px' }}
                >
                  <FolderPlus size={13} />
                </button>
                <button
                  onClick={() => onRenameNode(node)}
                  title="Rename"
                  style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '2px' }}
                >
                  <Pencil size={12} />
                </button>
                {onExportProject && (
                  <button
                    onClick={() => onExportProject(node)}
                    title="Export / Sync Suite to Folder"
                    style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '2px' }}
                  >
                    <FolderOutput size={12} />
                  </button>
                )}
                <button
                  onClick={() => onDeleteNode(node)}
                  title="Delete"
                  style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '2px' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Render children if open */}
            {isFolderOpen && node.children && node.children.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {renderTree(node.children, level + 1)}
              </div>
            )}
          </div>
        )
      }

      // Leaf test file
      return (
        <div
          key={node.path}
          className="sidebar-tree-row"
          onClick={() => onSelectNode(node)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',
            paddingLeft: `${18 + level * 14}px`,
            cursor: 'pointer',
            fontSize: '13px',
            backgroundColor: isSelected ? '#094771' : 'transparent',
            color: isSelected ? '#ffffff' : '#cccccc',
            transition: 'background-color 0.1s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
            {getFileIcon(node.name)}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {node.name}
            </span>
          </div>

          <div
            className="row-actions"
            style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onRenameNode(node)}
              title="Rename"
              style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '2px' }}
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => onDeleteNode(node)}
              title="Delete"
              style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '2px' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )
    })
  }

  const title = activeView === 'suites' ? 'AUTOMATION SUITES' : activeView === 'api' ? 'API RUNNER' : 'EXPLORER'

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#18181b', // VS Code dark primary sidebar
      borderRight: '1px solid #27272a',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* VS Code Explorer Top Bar */}
      <div style={{
        height: '35px',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.05em',
        color: '#a1a1aa',
        borderBottom: '1px solid #27272a'
      }}>
        <span>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onNewTest()}
            title="New Test File"
            style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '2px' }}
          >
            <FilePlus size={14} />
          </button>
          <button
            onClick={() => onNewProject()}
            title="New Folder"
            style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '2px' }}
          >
            <FolderPlus size={14} />
          </button>
          <button
            onClick={onNewReferenceProject}
            title="New Automation Suite"
            style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '2px' }}
          >
            <PlusSquare size={14} />
          </button>
          {onImportProject && (
            <button
              onClick={onImportProject}
              title="Import / Sync Project from Computer"
              style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '2px' }}
            >
              <FolderInput size={14} />
            </button>
          )}
          <button
            onClick={onRefresh}
            title="Refresh Explorer"
            style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '2px' }}
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={collapseAll}
            title="Collapse Folders"
            style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '2px' }}
          >
            <ChevronsDownUp size={13} />
          </button>
        </div>
      </div>

      {/* VS Code Accordion Header */}
      <div
        onClick={() => setIsSectionOpen(!isSectionOpen)}
        style={{
          height: '24px',
          padding: '0 8px',
          backgroundColor: '#27272a',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#e4e4e7',
          cursor: 'pointer',
          letterSpacing: '0.03em'
        }}
      >
        {isSectionOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>WORKSPACE: TESTS</span>
      </div>

      {/* Tree View Area */}
      {isSectionOpen && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '4px 0'
        }}>
          {tree.length === 0 ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: '#71717a', fontSize: '12px' }}>
              <p style={{ marginBottom: '12px' }}>No tests found.</p>
              <button
                onClick={onNewReferenceProject}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#007acc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                + Create Suite
              </button>
            </div>
          ) : (
            renderTree(tree)
          )}
        </div>
      )}
    </aside>
  )
}
