import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useState } from 'react'

export default function AccessDenied({ user }) {
  const [copied, setCopied] = useState(false)

  function copyUid() {
    navigator.clipboard.writeText(user.uid)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleLogout() {
    await signOut(auth)
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ width: 480 }}>
        <div className="login-logo" style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', boxShadow: '0 0 40px rgba(239,68,68,0.4)' }}>
          ⛔
        </div>
        <h2 className="login-title">Нет доступа</h2>
        <p className="login-sub">
          Ваш аккаунт <strong style={{ color: 'var(--text-primary)' }}>{user.email}</strong> не имеет прав администратора.
        </p>

        {/* Инструкция */}
        <div style={{
          background: 'rgba(139,92,246,0.08)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 12,
          padding: '18px 20px',
          marginTop: 20,
          textAlign: 'left',
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
            Чтобы получить доступ, добавьте ваш UID в коллекцию <code style={{ color: 'var(--purple-bright)' }}>admins</code> в Firebase Console:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            {[
              '1. Откройте Firebase Console → Firestore',
              '2. Создайте коллекцию admins',
              '3. Добавьте документ с ID = ваш UID (ниже)',
              '4. Поле: role = "admin"',
              '5. Перезайдите в аккаунт',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--purple-bright)', flexShrink: 0 }}>→</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* UID блок */}
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textAlign: 'left' }}>
            Ваш Firebase UID:
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '10px 14px',
          }}>
            <code style={{
              flex: 1,
              fontSize: 12,
              color: 'var(--purple-bright)',
              wordBreak: 'break-all',
              textAlign: 'left',
              lineHeight: 1.5,
            }}>
              {user.uid}
            </code>
            <button
              onClick={copyUid}
              style={{
                background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)',
                border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(139,92,246,0.3)'}`,
                color: copied ? '#34d399' : 'var(--purple-bright)',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.18s',
              }}
            >
              {copied ? '✓ Скопировано' : 'Копировать'}
            </button>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            marginTop: 20,
            width: '100%',
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            borderRadius: 8,
            padding: '11px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => e.target.style.borderColor = 'var(--purple-primary)'}
          onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}
        >
          Выйти из аккаунта
        </button>

        <p style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)' }}>
          Firebase: <strong style={{ color: 'var(--purple-bright)' }}>tictactoeonline-9f22d</strong>
        </p>
      </div>
    </div>
  )
}
