import React, { useState, useEffect, useRef } from 'react'

export interface DialogConfig {
  isOpen: boolean
  title: string
  description?: string
  initialValue?: string
  placeholder?: string
  isPrompt: boolean // true = input prompt, false = confirm dialog
  confirmLabel?: string
  isDestructive?: boolean
  onConfirm: (val: string) => void
  onCancel: () => void
}

export const DialogModal: React.FC<{ dialog: DialogConfig }> = ({ dialog }) => {
  const [value, setValue] = useState(dialog.initialValue || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(dialog.initialValue || '')
    if (dialog.isOpen && dialog.isPrompt) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [dialog.isOpen, dialog.initialValue, dialog.isPrompt])

  if (!dialog.isOpen) return null

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    dialog.onConfirm(value)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
      onClick={dialog.onCancel}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          width: '420px',
          maxWidth: '90vw',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
          {dialog.title}
        </h3>

        {dialog.description && (
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', lineHeight: '1.5' }}>
            {dialog.description}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {dialog.isPrompt && (
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={dialog.placeholder}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '13px',
                marginBottom: '20px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={dialog.onCancel}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                color: '#cbd5e1',
                border: '1px solid #334155',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                backgroundColor: dialog.isDestructive ? '#dc2626' : '#2563eb',
                color: 'white',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {dialog.confirmLabel || (dialog.isPrompt ? 'Create' : 'Confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
