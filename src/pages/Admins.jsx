import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useToast, ToastContainer } from '../hooks/useToast'

export default function Admins() {
  const [admins, setAdmins]     = useState([])
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState({ uid: '', email: '', name: '', role: 'admin' })
  const [search, setSearch]     = useState('')
  const [confirm, setConfirm]   = useState(null)
  const [showForm, setShowForm] = useState(false)
  const { toasts, addToast }    = useToast()

  // Загружаем коллекцию admins
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'admins'), snap => {
      setAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [])

  // Загружаем пользователей для подсказки
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, () => {})
    return () => unsub()
  }, [])

  // Поиск пользователя по email для автозаполнения UID
  function handleEmailChange(email) {
    setForm(p => ({ ...p, email }))
    const found = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (found) {
      setForm(p => ({ ...p, email, uid: found.id, name: found.username || found.email || '' }))
    }
  }

  async function addAdmin(e) {
    e.preventDefault()
    const uid = form.uid.trim()
    if (!uid) { addToast('UID обязателен', 'error'); return }

    // Проверяем что такой admin ещё не добавлен
    const existing = await getDoc(doc(db, 'admins', uid))
    if (existing.exists()) { addToast('Этот UID уже является администратором', 'error'); return }

    await setDoc(doc(db, 'admins', uid), {
      uid,
      email:     form.email.trim() || null,
      name:      form.name.trim()  || null,
      role:      form.role,
      addedAt:   serverTimestamp(),
    })

    addToast(`Администратор добавлен`, 'success')
    setForm({ uid: '', email: '', name: '', role: 'admin' })
    setShowForm(false)
  }

  async function removeAdmin(admin) {
    await deleteDoc(doc(db, 'admins', admin.id))
    addToast(`Администратор удалён`, 'success')
    setConfirm(null)
  }

  function formatDate(ts) {
    if (!ts) return '—'
    try { return ts.toDate().toLocaleString() } catch { return '—' }
  }

  const ROLE_COLORS = {
    admin:       { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.35)', color: '#a78bfa' },
    superadmin:  { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  color: '#f87171' },
    moderator:   { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', color: '#34d399' },
  }

  const filtered = admins.filter(a => {
    const q = search.toLowerCase()
    return !q || a.email?.toLowerCase().includes(q) || a.name?.toLowerCase().includes(q) || a.id.includes(q)
  })

  // Пользователи из users, которых ещё нет в admins (для подсказки)
  const adminIds = new Set(admins.map(a => a.id))
  const nonAdminUsers = users.filter(u => !adminIds.has(u.id))

  if (loading) return <div className="loading-wrap"><div className="spinner" /><span>Загрузка администраторов…</span></div>

  return (
    <div>
      <div className="page-header">
        <h2>Управление администраторами</h2>
        <p>Только эти аккаунты имеют доступ к панели — {admins.length} администратор(ов)</p>
      </div>

      {/* Карточки */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
        {filtered.map((a, i) => {
          const rc = ROLE_COLORS[a.role] || ROLE_COLORS.admin
          const initials = a.name ? a.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : a.email?.[0]?.toUpperCase() || '?'
          return (
            <div key={a.id} className="glass-card" style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
              {/* Цветная полоска сверху */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${rc.color}, transparent)` }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${rc.color}44, ${rc.color}22)`,
                  border: `2px solid ${rc.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, color: rc.color
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.name || a.email || 'Без имени'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.email || '—'}
                  </div>
                </div>
                <span style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                  {a.role}
                </span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Firebase UID</div>
                <code style={{ fontSize: 11, color: 'var(--purple-bright)', wordBreak: 'break-all', lineHeight: 1.5 }}>{a.id}</code>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Добавлен: {formatDate(a.addedAt)}</span>
                <button className="btn btn-sm btn-danger" onClick={() => setConfirm(a)}>✕ Удалить</button>
              </div>
            </div>
          )
        })}

        {/* Кнопка добавить */}
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: 'rgba(139,92,246,0.06)', border: '2px dashed rgba(139,92,246,0.3)',
            borderRadius: 20, padding: 22, cursor: 'pointer', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 10, color: 'var(--text-muted)', transition: 'all 0.2s', minHeight: 160
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple-primary)'; e.currentTarget.style.color = 'var(--purple-bright)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <span style={{ fontSize: 32 }}>+</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Добавить администратора</span>
        </button>
      </div>

      {/* Форма добавления */}
      {showForm && (
        <div className="glass-card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title">Добавить администратора</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕ Закрыть</button>
          </div>

          <form onSubmit={addAdmin} style={{ padding: '20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Firebase UID <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  className="search-input" style={{ width: '100%', paddingLeft: 12 }}
                  placeholder="Напр. abc123xyz..."
                  value={form.uid}
                  onChange={e => setForm(p => ({ ...p, uid: e.target.value }))}
                  required
                />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.5 }}>
                  UID виден на странице «Нет доступа» когда пользователь пытается войти
                </p>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Email (необязательно)
                </label>
                <input
                  className="search-input" style={{ width: '100%', paddingLeft: 12 }}
                  placeholder="admin@example.com"
                  type="email"
                  value={form.email}
                  onChange={e => handleEmailChange(e.target.value)}
                />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.5 }}>
                  Если пользователь есть в Firestore — UID подставится автоматически
                </p>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Имя / описание</label>
                <input
                  className="search-input" style={{ width: '100%', paddingLeft: 12 }}
                  placeholder="Имя администратора"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Роль</label>
                <select className="filter-select" style={{ width: '100%' }} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
            </div>

            {/* Быстрый выбор из игроков */}
            {nonAdminUsers.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Или выбери из зарегистрированных игроков:</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {nonAdminUsers.slice(0, 8).map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setForm({ uid: u.id, email: u.email || '', name: u.username || '', role: 'admin' })}
                      style={{
                        background: form.uid === u.id ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.08)',
                        border: `1px solid ${form.uid === u.id ? 'var(--purple-primary)' : 'var(--border)'}`,
                        borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                        color: form.uid === u.id ? 'var(--purple-bright)' : 'var(--text-secondary)',
                        fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <span>{u.avatar || '👤'}</span>
                      {u.username || u.email || u.id.slice(0, 8)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Отмена</button>
              <button type="submit" className="btn btn-primary">+ Добавить администратора</button>
            </div>
          </form>
        </div>
      )}

      {/* Таблица всех admins */}
      <div className="glass-card">
        <div className="card-header">
          <div>
            <div className="card-title">Все администраторы</div>
            <div className="card-subtitle">{admins.length} аккаунт(ов) с доступом к панели</div>
          </div>
          <div className="search-input-wrap" style={{ width: 260 }}>
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Поиск…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrapper">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="icon">👑</div>
              <span>Нет администраторов — добавь первого</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Имя / Email</th>
                  <th>Firebase UID</th>
                  <th>Роль</th>
                  <th>Добавлен</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => {
                  const rc = ROLE_COLORS[a.role] || ROLE_COLORS.admin
                  return (
                    <tr key={a.id}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</td>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar" style={{ background: `linear-gradient(135deg, ${rc.color}66, ${rc.color}33)`, border: `2px solid ${rc.border}`, color: rc.color }}>
                            {a.name?.[0]?.toUpperCase() || a.email?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="info">
                            <span className="name">{a.name || '—'}</span>
                            <span className="email">{a.email || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code style={{ fontSize: 11, color: 'var(--purple-bright)', background: 'rgba(139,92,246,0.08)', padding: '3px 8px', borderRadius: 5 }}>
                          {a.id.slice(0, 20)}…
                        </code>
                      </td>
                      <td>
                        <span style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' }}>
                          {a.role}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(a.addedAt)}</td>
                      <td>
                        <button className="btn btn-sm btn-danger" onClick={() => setConfirm(a)}>✕ Удалить</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Удалить администратора</h3>
            <p>
              Убрать доступ для <strong>{confirm.name || confirm.email || confirm.id}</strong>?<br/>
              Этот аккаунт больше не сможет войти в панель.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Отмена</button>
              <button className="btn btn-danger" onClick={() => removeAdmin(confirm)}>Удалить</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}
