import { useState, useCallback } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return { toasts, addToast }
}

export function ToastContainer({ toasts }) {
  if (!toasts.length) return null
  const icons = { success: '✓', error: '✕', info: 'ℹ' }
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span style={{ fontSize: 15 }}>{icons[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  )
}
