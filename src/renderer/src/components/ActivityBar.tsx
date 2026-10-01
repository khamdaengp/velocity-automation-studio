import React from 'react'
import { Files, FlaskConical, Globe, Database, Layers, Settings } from 'lucide-react'

export type ActivityView = 'explorer' | 'suites' | 'api' | 'database' | 'environments' | 'settings'

interface ActivityBarProps {
  activeView: ActivityView
  onSelectView: (view: ActivityView) => void
  isRunning: boolean
  lastStatus?: 'passed' | 'failed' | null
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeView,
  onSelectView,
  isRunning,
  lastStatus
}) => {
  const topItems: { id: ActivityView; label: string; icon: React.ReactNode; badge?: React.ReactNode }[] = [
    {
      id: 'explorer',
      label: 'Explorer (Test Files & Suites)',
      icon: <Files size={22} strokeWidth={1.75} />
    },
    {
      id: 'suites',
      label: 'Automation Suites & Runners',
      icon: <FlaskConical size={22} strokeWidth={1.75} />,
      badge: isRunning ? (
        <span style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#38bdf8',
          boxShadow: '0 0 6px #38bdf8'
        }} />
      ) : lastStatus === 'passed' ? (
        <span style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#10b981'
        }} />
      ) : lastStatus === 'failed' ? (
        <span style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#ef4448'
        }} />
      ) : null
    },
    {
      id: 'api',
      label: 'API Studio (REST, GraphQL, cURL)',
      icon: <Globe size={22} strokeWidth={1.75} />
    },
    {
      id: 'database',
      label: 'Database Studio (SQLite, PostgreSQL, MySQL)',
      icon: <Database size={22} strokeWidth={1.75} />
    },
    {
      id: 'environments',
      label: 'Environments & Variables (Dev / Stage / Prod)',
      icon: <Layers size={22} strokeWidth={1.75} />
    }
  ]

  return (
    <div style={{
      width: '48px',
      backgroundColor: '#0d1117',
      borderRight: '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      userSelect: 'none',
      zIndex: 10
    }}>
      {/* Top Icons */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '4px' }}>
        {topItems.map((item) => {
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              title={item.label}
              style={{
                position: 'relative',
                width: '48px',
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                borderLeft: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                color: isActive ? '#f8fafc' : '#64748b',
                cursor: 'pointer',
                transition: 'color 0.15s, background-color 0.15s'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = '#cbd5e1'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = '#64748b'
              }}
            >
              {item.icon}
              {item.badge}
            </button>
          )
        })}
      </div>

      {/* Bottom Icons (Settings) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <button
          onClick={() => onSelectView('settings')}
          title="Settings (Preferences)"
          style={{
            width: '48px',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            borderLeft: activeView === 'settings' ? '2px solid #38bdf8' : '2px solid transparent',
            color: activeView === 'settings' ? '#f8fafc' : '#64748b',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            if (activeView !== 'settings') e.currentTarget.style.color = '#cbd5e1'
          }}
          onMouseLeave={(e) => {
            if (activeView !== 'settings') e.currentTarget.style.color = '#64748b'
          }}
        >
          <Settings size={22} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
