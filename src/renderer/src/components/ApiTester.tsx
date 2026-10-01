import React, { useState } from 'react'
import { Send, Clock, CheckCircle, AlertCircle, Copy, CheckCheck, Code2, FileDown, KeyRound, ListFilter, Braces, Terminal } from 'lucide-react'

export const ApiTester: React.FC = () => {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('{{apiUrl}}/todos/1')
  const [activeTab, setActiveTab] = useState<'params' | 'auth' | 'headers' | 'body' | 'curl' | 'code'>('headers')

  // Auth state
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'basic' | 'apikey'>('none')
  const [bearerToken, setBearerToken] = useState('')
  const [basicUser, setBasicUser] = useState('')
  const [basicPass, setBasicPass] = useState('')
  const [apiKeyName, setApiKeyName] = useState('X-API-Key')
  const [apiKeyValue, setApiKeyValue] = useState('')

  // Headers & Body
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json",\n  "Accept": "application/json"\n}')
  const [body, setBody] = useState('{\n  "title": "Velocity Automation Suite",\n  "completed": true\n}')

  // cURL import
  const [curlInput, setCurlInput] = useState('')
  const [curlError, setCurlError] = useState<string | null>(null)

  // Execution
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  // Parse cURL
  const handleImportCurl = () => {
    setCurlError(null)
    const raw = curlInput.trim()
    if (!raw) return

    try {
      // Basic cURL command parser
      let parsedMethod = 'GET'
      let parsedUrl = ''
      const parsedHeaders: Record<string, string> = {}
      let parsedBody = ''

      // Extract method -X METHOD
      const methodMatch = raw.match(/-X\s+([A-Z]+)/i) || raw.match(/--request\s+([A-Z]+)/i)
      if (methodMatch) {
        parsedMethod = methodMatch[1].toUpperCase()
      }

      // Extract headers -H "..."
      const headerMatches = [...raw.matchAll(/-H\s+['"]([^'"]+)['"]/g)]
      for (const m of headerMatches) {
        const parts = m[1].split(':')
        if (parts.length >= 2) {
          parsedHeaders[parts[0].trim()] = parts.slice(1).join(':').trim()
        }
      }

      // Extract body -d "..." or --data "..."
      const dataMatch = raw.match(/(?:-d|--data|--data-raw)\s+['"]([^'"]+)['"]/s)
      if (dataMatch) {
        parsedBody = dataMatch[1]
        if (parsedMethod === 'GET') parsedMethod = 'POST'
      }

      // Extract URL
      const urlTokens = raw.replace(/\\\n/g, ' ').split(/\s+/)
      for (const token of urlTokens) {
        const clean = token.replace(/['"]/g, '')
        if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('{{')) {
          parsedUrl = clean
          break
        }
      }

      if (!parsedUrl) {
        throw new Error('Could not find URL in cURL command.')
      }

      setMethod(parsedMethod)
      setUrl(parsedUrl)
      if (Object.keys(parsedHeaders).length > 0) {
        setHeaders(JSON.stringify(parsedHeaders, null, 2))
      }
      if (parsedBody) {
        setBody(parsedBody)
      }
      setActiveTab('headers')
    } catch (err: any) {
      setCurlError(err.message)
    }
  }

  const buildEffectiveHeaders = (): Record<string, string> => {
    let result: Record<string, string> = {}
    try {
      if (headers.trim()) result = JSON.parse(headers)
    } catch {
      // ignore
    }

    if (authType === 'bearer' && bearerToken.trim()) {
      result['Authorization'] = `Bearer ${bearerToken.trim()}`
    } else if (authType === 'basic' && (basicUser || basicPass)) {
      const token = btoa(`${basicUser}:${basicPass}`)
      result['Authorization'] = `Basic ${token}`
    } else if (authType === 'apikey' && apiKeyName && apiKeyValue) {
      result[apiKeyName.trim()] = apiKeyValue.trim()
    }

    return result
  }

  const handleSend = async () => {
    setIsLoading(true)
    setResponse(null)
    try {
      const effHeaders = buildEffectiveHeaders()

      // @ts-ignore
      const res = await window.api.runApiRequest({
        url,
        method,
        headers: effHeaders,
        body: method !== 'GET' && method !== 'HEAD' ? body : undefined
      })
      setResponse(res)
    } catch (err: any) {
      setResponse({
        status: 0,
        statusText: err.message,
        timeMs: 0,
        headers: {},
        data: { error: err.message }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateTestSnippet = (): string => {
    const effHeaders = buildEffectiveHeaders()
    const headerStr = Object.keys(effHeaders).length > 0 ? `, { headers: ${JSON.stringify(effHeaders)} }` : ''
    if (method === 'GET') {
      return `// ⚡ API Verification Step\nconst res = await api.get('${url}'${headerStr});\nif (res.status !== 200) throw new Error(\`Expected status 200 but got \${res.status}\`);\nconst data = await res.json();\nconsole.log('API Response:', data);`
    } else {
      return `// ⚡ API ${method} Request Step\nconst payload = ${body.trim() || '{}'};\nconst res = await api.${method.toLowerCase()}('${url}', payload${headerStr});\nif (res.status >= 400) throw new Error(\`API request failed with status \${res.status}\`);\nconst data = await res.json();\nconsole.log('Created record:', data);`
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateTestSnippet())
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1e1e1e',
      color: '#cccccc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Top Header */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: '#18181b',
        borderBottom: '1px solid #2d2d2d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
            API Studio
          </span>
          <span style={{ fontSize: '11px', color: '#71717a' }}>
            (REST, cURL, Variables & Script Generation)
          </span>
        </div>

        <button
          onClick={handleCopyCode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#27272a',
            border: '1px solid #3f3f46',
            color: '#38bdf8',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
          title="Copy Playwright / Unified test script step"
        >
          {copiedCode ? <CheckCheck size={13} color="#4ade80" /> : <Code2 size={13} />}
          Copy as Test Code
        </button>
      </div>

      {/* URL & Method Input Bar */}
      <div style={{ padding: '16px 20px 12px 20px', display: 'flex', gap: '8px' }}>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          style={{
            backgroundColor: '#27272a',
            border: '1px solid #3f3f46',
            color: '#38bdf8',
            borderRadius: '4px',
            padding: '8px 12px',
            fontWeight: 700,
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
          <option value="HEAD">HEAD</option>
        </select>

        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter request URL (e.g. {{apiUrl}}/users)..."
            style={{
              width: '100%',
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '4px',
              padding: '8px 14px',
              color: '#f8fafc',
              fontSize: '13px',
              fontFamily: '"JetBrains Mono", Consolas, monospace',
              outline: 'none'
            }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#0284c7',
            border: 'none',
            color: '#ffffff',
            borderRadius: '4px',
            padding: '8px 20px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          <Send size={14} />
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        padding: '0 20px',
        borderBottom: '1px solid #2d2d2d',
        gap: '4px'
      }}>
        {[
          { id: 'headers', label: 'Headers', icon: <ListFilter size={13} /> },
          { id: 'auth', label: 'Authorization', icon: <KeyRound size={13} /> },
          { id: 'body', label: 'Body (JSON)', icon: <Braces size={13} /> },
          { id: 'curl', label: 'Import cURL', icon: <Terminal size={13} /> },
          { id: 'code', label: 'Generated Code', icon: <Code2 size={13} /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                color: isActive ? '#ffffff' : '#71717a',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Request Configuration Body */}
      <div style={{ height: '180px', backgroundColor: '#141416', padding: '14px 20px', borderBottom: '1px solid #2d2d2d' }}>
        {activeTab === 'headers' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: '#71717a', marginBottom: '6px' }}>
              Request Headers (JSON format):
            </span>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: '1px solid #2d2d2d',
                borderRadius: '4px',
                padding: '10px',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: '"JetBrains Mono", Consolas, monospace',
                resize: 'none',
                outline: 'none'
              }}
            />
          </div>
        )}

        {activeTab === 'auth' && (
          <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
            <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#71717a', marginBottom: '4px' }}>Auth Type</span>
              {(['none', 'bearer', 'basic', 'apikey'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAuthType(t)}
                  style={{
                    textAlign: 'left',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    backgroundColor: authType === t ? '#27272a' : 'transparent',
                    border: '1px solid ' + (authType === t ? '#3f3f46' : 'transparent'),
                    color: authType === t ? '#ffffff' : '#71717a',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {t === 'none' ? 'No Auth' : t === 'bearer' ? 'Bearer Token' : t === 'basic' ? 'Basic Auth' : 'API Key'}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {authType === 'bearer' && (
                <div>
                  <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Bearer Token</label>
                  <input
                    type="password"
                    placeholder="Enter auth token..."
                    value={bearerToken}
                    onChange={(e) => setBearerToken(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: '4px',
                      padding: '6px 10px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              {authType === 'basic' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Username</label>
                    <input
                      type="text"
                      placeholder="Username"
                      value={basicUser}
                      onChange={(e) => setBasicUser(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Password</label>
                    <input
                      type="password"
                      placeholder="Password"
                      value={basicPass}
                      onChange={(e) => setBasicPass(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              {authType === 'apikey' && (
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Header Name</label>
                    <input
                      type="text"
                      placeholder="X-API-Key"
                      value={apiKeyName}
                      onChange={(e) => setApiKeyName(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Key Value</label>
                    <input
                      type="password"
                      placeholder="API Key value"
                      value={apiKeyValue}
                      onChange={(e) => setApiKeyValue(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              {authType === 'none' && (
                <div style={{ color: '#71717a', fontSize: '12px', marginTop: '16px' }}>
                  This request does not use any authorization headers.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'body' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: '#71717a', marginBottom: '6px' }}>
              JSON Payload:
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: '1px solid #2d2d2d',
                borderRadius: '4px',
                padding: '10px',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: '"JetBrains Mono", Consolas, monospace',
                resize: 'none',
                outline: 'none'
              }}
            />
          </div>
        )}

        {activeTab === 'curl' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#71717a' }}>Paste cURL Command:</span>
              <button
                onClick={handleImportCurl}
                style={{
                  backgroundColor: '#0284c7',
                  border: 'none',
                  color: 'white',
                  borderRadius: '3px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Parse & Apply
              </button>
            </div>
            <textarea
              placeholder="curl -X POST https://api.example.com/v1/orders -H 'Content-Type: application/json' -d '{...}'"
              value={curlInput}
              onChange={(e) => setCurlInput(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: '1px solid #2d2d2d',
                borderRadius: '4px',
                padding: '8px',
                color: '#38bdf8',
                fontSize: '12px',
                fontFamily: 'monospace',
                outline: 'none',
                resize: 'none'
              }}
            />
            {curlError && <span style={{ color: '#f87171', fontSize: '11px' }}>{curlError}</span>}
          </div>
        )}

        {activeTab === 'code' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: '#71717a' }}>
                Playwright / Unified Automation Runner Code:
              </span>
              <button
                onClick={handleCopyCode}
                style={{
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  color: '#38bdf8',
                  borderRadius: '3px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                {copiedCode ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
            <pre style={{
              flex: 1,
              backgroundColor: '#18181b',
              border: '1px solid #2d2d2d',
              borderRadius: '4px',
              padding: '10px',
              color: '#4ade80',
              fontSize: '11px',
              fontFamily: 'monospace',
              overflow: 'auto',
              margin: 0
            }}>
              {generateTestSnippet()}
            </pre>
          </div>
        )}
      </div>

      {/* Response Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Response Status Bar */}
        <div style={{
          padding: '8px 20px',
          backgroundColor: '#18181b',
          borderBottom: '1px solid #2d2d2d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#a1a1aa' }}>Response:</span>
            {response ? (
              <span style={{
                color: response.status >= 200 && response.status < 300 ? '#4ade80' : '#f87171',
                fontWeight: 700
              }}>
                {response.status} {response.statusText}
              </span>
            ) : (
              <span style={{ color: '#71717a' }}>Ready to send</span>
            )}
          </div>

          {response && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#71717a', fontSize: '11px' }}>
              <Clock size={13} />
              <span>{response.timeMs} ms</span>
            </div>
          )}
        </div>

        {/* Response Data Viewer */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px', backgroundColor: '#1e1e1e' }}>
          {!response ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', fontSize: '13px' }}>
              Hit "Send" to inspect HTTP response payload and headers.
            </div>
          ) : (
            <pre style={{
              color: '#38bdf8',
              fontFamily: '"JetBrains Mono", Consolas, monospace',
              fontSize: '12px',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
