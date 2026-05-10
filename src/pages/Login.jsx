import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../auth'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    await new Promise(r => setTimeout(r, 400))

    if (login(username.trim(), password)) {
      onLogin?.()
      navigate('/')
    } else {
      setError('Неверный логин или пароль')
    }

    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ width: 420 }}>
        <div className="login-logo">✕</div>
        <h2 className="login-title">Tic Tac Toe</h2>
        <p className="login-sub">Вход в панель администратора</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
          {/* Логин */}
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Логин
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 15, opacity: 0.5 }}>👤</span>
              <input
                type="text"
                className="search-input"
                style={{ width: '100%', paddingLeft: 38 }}
                placeholder="Введите логин"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Пароль */}
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Пароль
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 15, opacity: 0.5 }}>🔒</span>
              <input
                type={showPass ? 'text' : 'password'}
                className="search-input"
                style={{ width: '100%', paddingLeft: 38, paddingRight: 42 }}
                placeholder="Введите пароль"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, opacity: 0.5,
                  padding: 0, color: 'var(--text-primary)'
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error" style={{ marginTop: 0 }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              width: '100%',
              background: loading
                ? 'rgba(139,92,246,0.4)'
                : 'linear-gradient(135deg, var(--purple-primary), #6d28d9)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '13px 20px',
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.18s',
              boxShadow: loading ? 'none' : 'var(--shadow-btn)',
              letterSpacing: '0.02em',
            }}
          >
            {loading ? '⏳ Проверка…' : '→ Войти'}
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Доступ только для авторизованных администраторов<br/>
          Firebase: <strong style={{ color: 'var(--purple-bright)' }}>tictactoeonline-9f22d</strong>
        </p>
      </div>
    </div>
  )
}
