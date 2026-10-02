import React, { useState } from 'react'
import {
  Video,
  Play,
  Globe,
  Copy,
  Check,
  MousePointer,
  ShieldCheck,
  Smartphone,
  Monitor,
  Tablet,
  Code2,
  ExternalLink,
  PlusCircle,
  HelpCircle
} from 'lucide-react'
import { EnvironmentsData } from '../types'
import { AuthSessionModal } from './AuthSessionModal'

interface WebInspectorProps {
  recordUrl: string
  setRecordUrl: (url: string) => void
  onRecord: (url: string) => void
  activeEnv?: string
  environmentsData?: EnvironmentsData | null
  onNewTestFile?: (filePath: string, content: string) => void
}

export const WebInspector: React.FC<WebInspectorProps> = ({
  recordUrl,
  setRecordUrl,
  onRecord,
  activeEnv = 'dev',
  environmentsData,
  onNewTestFile
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile' | 'tablet'>('desktop')
  const [browserType, setBrowserType] = useState<'chromium' | 'firefox' | 'webkit'>('chromium')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [quickNewFileName, setQuickNewFileName] = useState('recorded-flow.spec.js')

  // Get active baseUrl if defined
  const currentEnv = environmentsData?.environments.find((e) => e.id === activeEnv)
  const envBaseUrl = currentEnv?.variables.find((v) => v.key.toLowerCase().includes('url') && v.enabled)?.value

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 1800)
  }

  const presets = [
    { label: 'Active Env URL', url: envBaseUrl || 'https://jsonplaceholder.typicode.com' },
    { label: 'Google Search', url: 'https://google.com' },
    { label: 'Playwright Demo', url: 'https://demo.playwright.dev/todomvc' },
    { label: 'Wikipedia', url: 'https://en.wikipedia.org' }
  ]

  const locatorExamples = [
    {
      type: 'Role (Best Practice)',
      code: "page.getByRole('button', { name: 'Submit' })",
      desc: 'Matches accessible ARIA roles and visible button/link text.'
    },
    {
      type: 'Text Content',
      code: "page.getByText('Welcome back, Admin')",
      desc: 'Matches any element containing the specified text string.'
    },
    {
      type: 'Input Label',
      code: "page.getByLabel('Email Address')",
      desc: 'Matches the form input associated with a <label> tag.'
    },
    {
      type: 'Placeholder',
      code: "page.getByPlaceholder('Enter your password')",
      desc: 'Matches text fields by their placeholder hint.'
    },
    {
      type: 'Test ID Attribute',
      code: "page.getByTestId('checkout-button')",
      desc: 'Matches data-testid attributes resistant to styling changes.'
    },
    {
      type: 'CSS Selector',
      code: "page.locator('#login-form button.submit')",
      desc: 'Standard CSS locator for targeting complex DOM hierarchies.'
    }
  ]

  const handleCreateStarterTest = async () => {
    if (!quickNewFileName.trim()) return
    const starterContent = `// ⚡ Velocity Studio - Recorded Web Test
console.log('🚀 Starting test on ${recordUrl || 'https://google.com'}...');

await page.goto('${recordUrl || 'https://google.com'}');
console.log('🌐 Page loaded successfully: ' + (await page.title()));

// Add your interactions or recorded code below:
// await page.click('button');
// await page.fill('input', 'Hello');
`
    try {
      // @ts-ignore
      await window.api.writeFile('tests/' + quickNewFileName.trim(), starterContent)
      alert(`Created test: tests/${quickNewFileName.trim()}`)
      onNewTestFile?.('tests/' + quickNewFileName.trim(), starterContent)
    } catch (e: any) {
      alert(`Error creating test: ${e.message}`)
    }
  }

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        padding: '28px 36px'
      }}
    >
      <div style={{ maxWidth: '860px', width: '100%', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', borderBottom: '1px solid #27272a', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}
            >
              <Video size={18} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
              Web Inspector & Interactive Recorder
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#858585', margin: 0 }}>
            Launch Playwright Codegen to click, type, and record browser actions into runnable test scripts.
          </p>
        </div>

        {/* Target URL Launcher Box */}
        <div
          style={{
            backgroundColor: '#252526',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              color: '#38bdf8',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Target Website URL
          </label>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={recordUrl}
                onChange={(e) => setRecordUrl(e.target.value)}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: '"JetBrains Mono", Consolas, monospace',
                  outline: 'none'
                }}
              />
            </div>
            <button
              onClick={() => onRecord(recordUrl || 'https://google.com')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 20px',
                backgroundColor: '#be123c',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'background-color 0.15s'
              }}
              title="Launch Playwright headed recorder"
            >
              <Video size={16} />
              <span>Launch Recorder</span>
            </button>
          </div>

          {/* Quick Preset Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#858585' }}>Quick Presets:</span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setRecordUrl(p.url)}
                style={{
                  background: 'none',
                  border: '1px solid #3f3f46',
                  borderRadius: '12px',
                  padding: '3px 10px',
                  color: recordUrl === p.url ? '#38bdf8' : '#a1a1aa',
                  borderColor: recordUrl === p.url ? '#0284c7' : '#3f3f46',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Device & Browser Presets */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #2d2d2d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            {/* Browser choice */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#858585' }}>Browser:</span>
              <button
                onClick={() => setBrowserType('chromium')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: browserType === 'chromium' ? '#007acc' : '#3c3c3c',
                  backgroundColor: browserType === 'chromium' ? '#094771' : 'transparent',
                  color: '#ffffff',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Chromium (Default)
              </button>
              <button
                onClick={() => setBrowserType('firefox')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: browserType === 'firefox' ? '#007acc' : '#3c3c3c',
                  backgroundColor: browserType === 'firefox' ? '#094771' : 'transparent',
                  color: '#ffffff',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Firefox
              </button>
              <button
                onClick={() => setBrowserType('webkit')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: browserType === 'webkit' ? '#007acc' : '#3c3c3c',
                  backgroundColor: browserType === 'webkit' ? '#094771' : 'transparent',
                  color: '#ffffff',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                WebKit (Safari)
              </button>
            </div>

            {/* Persistent Login Session button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '4px',
                border: '1px solid #10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#4ade80',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Record persistent Google / SSO login session"
            >
              <ShieldCheck size={13} />
              <span>Record Auth Session (Google / SSO)</span>
            </button>
          </div>
        </div>

        {/* Element Locator Guide & Selector Tester */}
        <div
          style={{
            backgroundColor: '#252526',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <MousePointer size={16} color="#38bdf8" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
              Playwright Locator Cheat Sheet & Best Practices
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: '#858585', marginBottom: '16px' }}>
            Recommended selector patterns ordered by resilience to UI design refactors. Click any row to copy snippet.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {locatorExamples.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleCopy(item.code, idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#1e1e1e',
                  border: '1px solid #333333',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.1s'
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        backgroundColor: '#27272a',
                        color: '#38bdf8',
                        padding: '1px 6px',
                        borderRadius: '3px'
                      }}
                    >
                      {item.type}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontFamily: '"JetBrains Mono", Consolas, monospace',
                        color: '#facc15'
                      }}
                    >
                      {item.code}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#71717a' }}>{item.desc}</div>
                </div>

                <div style={{ color: copiedIndex === idx ? '#4ade80' : '#858585', marginLeft: '12px' }}>
                  {copiedIndex === idx ? <Check size={14} /> : <Copy size={14} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick New Recorded Test File */}
        <div
          style={{
            backgroundColor: '#252526',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Code2 size={16} color="#4ade80" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
              Create New Test File for this Target
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: '#858585', marginBottom: '14px' }}>
            Quickly scaffold a new test script pointing to this target URL.
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={quickNewFileName}
              onChange={(e) => setQuickNewFileName(e.target.value)}
              placeholder="e.g. recorded-flow.spec.js"
              style={{
                flex: 1,
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#ffffff',
                fontSize: '13px',
                fontFamily: '"JetBrains Mono", Consolas, monospace',
                outline: 'none'
              }}
            />
            <button
              onClick={handleCreateStarterTest}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 16px',
                backgroundColor: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <PlusCircle size={14} />
              <span>Create Test File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auth Session Recording Modal */}
      <AuthSessionModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}
