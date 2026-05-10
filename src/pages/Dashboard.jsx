import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'

const ONE_DAY = 24 * 60 * 60 * 1000

function isToday(dateStr) {
  if (!dateStr) return false
  try {
    const d = new Date(dateStr)
    return Date.now() - d.getTime() < ONE_DAY
  } catch { return false }
}

function isOnline(lastSynced) {
  if (!lastSynced) return false
  try {
    return Date.now() - new Date(lastSynced).getTime() < 10 * 60 * 1000 // 10 min
  } catch { return false }
}

export default function Dashboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [recentPlayers, setRecentPlayers] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setUsers(list)

      const sorted = [...list].sort((a, b) => {
        const ta = new Date(a.lastSynced || a.createdAt || 0).getTime()
        const tb = new Date(b.lastSynced || b.createdAt || 0).getTime()
        return tb - ta
      }).slice(0, 8)
      setRecentPlayers(sorted)

      setLoading(false)
    })
    return () => unsub()
  }, [])

  const totalPlayers  = users.length
  const onlinePlayers = users.filter(u => isOnline(u.lastSynced)).length
  const newToday      = users.filter(u => isToday(u.createdAt)).length
  const totalGames    = users.reduce((s, u) => s + (u.totalGames || 0), 0)

  const stats = [
    { label: 'Total Players',    value: totalPlayers,  icon: '👥', color: 'purple' },
    { label: 'Online Now',       value: onlinePlayers, icon: '🟢', color: 'green'  },
    { label: 'New Today',        value: newToday,      icon: '✨', color: 'orange' },
    { label: 'Total Games Played', value: totalGames,  icon: '🎮', color: 'blue'   },
  ]

  if (loading) return (
    <div className="loading-wrap">
      <div className="spinner" />
      <span>Connecting to Firebase…</span>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p>Real-time stats from Firebase — updates automatically</p>
      </div>

      <div className="stats-grid">
        {stats.map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value">{s.value.toLocaleString()}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card">
        <div className="card-header">
          <div>
            <div className="card-title">Recently Active Players</div>
            <div className="card-subtitle">Sorted by last Firebase sync</div>
          </div>
        </div>
        <div className="table-wrapper">
          {recentPlayers.length === 0 ? (
            <div className="empty-state">
              <div className="icon">👥</div>
              <span>No players registered yet</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>W / L / D</th>
                  <th>Total Games</th>
                  <th>Best Streak</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentPlayers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{u.avatar || u.username?.[0] || '?'}</div>
                        <div className="info">
                          <span className="name">{u.username || 'Unknown'}</span>
                          <span className="email">{u.email || '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--neon-green)' }}>{u.wins ?? 0}</span>
                      {' / '}
                      <span style={{ color: 'var(--neon-red)' }}>{u.losses ?? 0}</span>
                      {' / '}
                      <span style={{ color: 'var(--neon-orange)' }}>{u.draws ?? 0}</span>
                    </td>
                    <td className="td-main">{u.totalGames ?? 0}</td>
                    <td>
                      <span style={{ color: 'var(--purple-bright)', fontWeight: 700 }}>
                        🔥 {u.bestStreak ?? 0}
                      </span>
                    </td>
                    <td>
                      {isOnline(u.lastSynced)
                        ? <span className="badge badge-online"><span className="badge-dot" />Online</span>
                        : <span className="badge badge-offline">Offline</span>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {u.joinedDate || u.createdAt?.slice(0, 10) || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>📶 Firebase Connection</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Project ID', value: 'tictactoeonline-9f22d' },
              { label: 'Database',   value: 'Firestore (users collection)' },
              { label: 'Auth',       value: 'Google OAuth' },
              { label: 'Multiplayer', value: 'Socket.IO — trolley.proxy.rlwy.net:17667' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                <span style={{ color: 'var(--purple-bright)', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>🏆 Top Players</div>
          {users.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data</div>
          ) : (
            [...users].sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0)).slice(0, 5).map((u, i) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 16, width: 24 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}
                </span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{u.username || 'Unknown'}</span>
                <span style={{ color: 'var(--neon-green)', fontWeight: 700, fontSize: 13 }}>{u.wins ?? 0} wins</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
