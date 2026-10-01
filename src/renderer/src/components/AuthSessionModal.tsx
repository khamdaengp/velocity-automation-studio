import React, { useState, useEffect } from 'react'
import { ShieldCheck, Plus, Trash2, Globe, CheckCircle2, AlertCircle, X, KeyRound, ExternalLink } from 'lucide-react'
import { AuthProfile } from '../types'

interface AuthSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectProfile?: (profileName: string) => void
}

export const AuthSessionModal: React.FC<AuthSessionModalProps> = ({
  isOpen,
  onClose,
  onSelectProfile
}) => {
  const [profiles, setProfiles] = useState<AuthProfile[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [loginUrl, setLoginUrl] = useState('https://accounts.google.com')
  const [profileName, setProfileName] = useState('google-account')
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const loadProfiles = async () => {
    try {
      // @ts-ignore
      const list: AuthProfile[] = await window.api.getAuthProfiles()
      if (list) setProfiles(list)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadProfiles()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleStartRecording = async () => {
    if (!profileName.trim()) {
      alert('Please enter a session profile name')
      return
    }

    setIsRecording(true)
    setStatusMsg('Browser opened! Please log in, complete any verification, and then CLOSE the browser window.')

    try {
      // @ts-ignore
      const res = await window.api.recordAuthSession({
        url: loginUrl.trim(),
        profileName: profileName.trim()
      })

      if (res.success) {
        setStatusMsg(`✅ Successfully recorded and saved session profile: "${res.profileName}"!`)
        await loadProfiles()
        if (onSelectProfile) onSelectProfile(res.profileName)
      } else {
        setStatusMsg(`Recording error: ${res.error}`)
      }
    } catch (err: any) {
      setStatusMsg(`Recording failed: ${err.message}`)
    } finally {
      setIsRecording(false)
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete saved session profile "${name}"?`)) return
    try {
      // @ts-ignore
      await window.api.deleteAuthProfile(name)
      await loadProfiles()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#1e1e1e',
        border: '1px solid #333333',
        borderRadius: '8px',
        width: '540px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #2d2d2d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#18181b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
              Persistent Auth & Login Sessions
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#a1a1aa',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Explanation Banner */}
          <div style={{
            backgroundColor: '#172554',
            border: '1px solid #1e40af',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '12px',
            color: '#93c5fd',
            lineHeight: 1.5
          }}>
            <div style={{ fontWeight: 600, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={14} />
              Zero-CAPTCHA Persistent Authentication
            </div>
            Sign in manually once to your Google account or web application. Velocity saves the session tokens & cookies so automated tests start <strong>already logged in</strong> without encountering bot detection or 2FA prompts!
          </div>

          {/* Record New Session Card */}
          <div style={{
            backgroundColor: '#18181b',
            border: '1px solid #2d2d2d',
            borderRadius: '6px',
            padding: '16px'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '10px' }}>
              Record / Capture New Login Session
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>
                  Session Profile Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. google-account or staging-admin"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  disabled={isRecording}
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
                <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>
                  Login URL
                </label>
                <input
                  type="text"
                  placeholder="https://accounts.google.com or https://myapp.com/login"
                  value={loginUrl}
                  onChange={(e) => setLoginUrl(e.target.value)}
                  disabled={isRecording}
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

              <button
                onClick={handleStartRecording}
                disabled={isRecording}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: '#0284c7',
                  border: 'none',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isRecording ? 'not-allowed' : 'pointer',
                  opacity: isRecording ? 0.7 : 1,
                  marginTop: '4px'
                }}
              >
                <ExternalLink size={14} />
                {isRecording ? 'Waiting for Browser Window to Close...' : 'Open Browser & Capture Session'}
              </button>

              {statusMsg && (
                <div style={{ fontSize: '11px', color: statusMsg.includes('✅') ? '#4ade80' : '#38bdf8', marginTop: '4px' }}>
                  {statusMsg}
                </div>
              )}
            </div>
          </div>

          {/* Existing Saved Sessions List */}
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
              Saved Session Profiles ({profiles.length})
            </span>

            {profiles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: '#71717a', fontSize: '12px', backgroundColor: '#18181b', borderRadius: '6px' }}>
                No session profiles recorded yet. Use the form above to record your first login session.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#18181b',
                      border: '1px solid #2d2d2d',
                      borderRadius: '6px',
                      padding: '10px 14px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '13px' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
                        Storage state file: <code>tests/.auth/{p.file}</code>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {onSelectProfile && (
                        <button
                          onClick={() => {
                            onSelectProfile(p.name)
                            onClose()
                          }}
                          style={{
                            backgroundColor: '#15803d',
                            border: 'none',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Use in Test
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(p.name)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#71717a',
                          padding: '4px',
                          cursor: 'pointer'
                        }}
                        title="Delete session"
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
