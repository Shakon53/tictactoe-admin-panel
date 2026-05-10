import { useEffect, useState } from 'react'
import { collection, onSnapshot, updateDoc, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useToast, ToastContainer } from '../hooks/useToast'

function isOnline(lastSynced) {
  if (!lastSynced) return false
  try { return Date.now() - new Date(lastSynced).getTime() < 10 * 60 * 1000 } catch { return false }
}

export default function Players() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [confirm, setConfirm] = useState(null)
  const { toasts, addToast } = useToast()

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const filtered = players.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.username?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
    const online = isOnline(p.lastSynced)
    const matchFilter =
      filter === 'all'    ||
      (filter === 'online'  && online) ||
      (filter === 'offline' && !online && !p.banned) ||
      (filter === 'banned'  && p.banned)
    return matchSearch && matchFilter
  })

  async function toggleBan(player) {
    const ref = doc(db, 'users', player.id)
    await updateDoc(ref, { banned: !player.banned })
    addToast(player.banned ? `${player.username} unbanned` : `${player.username} banned`, player.banned ? 'success' : 'info')
  }

  async function deletePlayer(player) {
    await deleteDoc(doc(db, 'users', player.id))
    addToast(`${player.username || 'Player'} deleted`, 'success')
    setConfirm(null)
  }

  function confirmAction(type, player) {
    setConfirm({ type, player })
  }

  function winRate(p) {
    const t = (p.wins ?? 0) + (p.losses ?? 0) + (p.draws ?? 0)
    if (!t) return 0
    return Math.round(((p.wins ?? 0) / t) * 100)
  }

  if (loading) return <div className="loading-wrap"><div className="spinner" /><span>Loading players…</span></div>

  return (
    <div>
      <div className="page-header">
        <h2>Players Management</h2>
        <p>{players.length} registered players — real-time from Firebase</p>
      </div>

      <div className="glass-card">
        <div className="filter-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search by username or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Players ({players.length})</option>
            <option value="online">Online ({players.filter(p => isOnline(p.lastSynced)).length})</option>
            <option value="offline">Offline</option>
            <option value="banned">Banned ({players.filter(p => p.banned).length})</option>
          </select>
        </div>

        <div className="table-wrapper">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="icon">👥</div>
              <span>No players match your filter</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Wins</th>
                  <th>Losses</th>
                  <th>Draws</th>
                  <th>Win Rate</th>
                  <th>Streak</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const online = isOnline(p.lastSynced)
                  const wr = winRate(p)
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar" style={p.banned ? { opacity: 0.4 } : {}}>
                            {p.avatar || p.username?.[0] || '?'}
                          </div>
                          <div className="info">
                            <span className="name">{p.username || 'Unknown'}</span>
                            <span className="email">{p.email || p.id.slice(0, 12)}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--neon-green)', fontWeight: 700 }}>{p.wins ?? 0}</td>
                      <td style={{ color: 'var(--neon-red)', fontWeight: 700 }}>{p.losses ?? 0}</td>
                      <td style={{ color: 'var(--neon-orange)' }}>{p.draws ?? 0}</td>
                      <td>
                        <div className="mini-bar-wrap">
                          <div className="mini-bar">
                            <div className="mini-bar-fill wins" style={{ width: `${wr}%` }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 30, textAlign: 'right' }}>{wr}%</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--purple-bright)', fontWeight: 700 }}>🔥 {p.bestStreak ?? 0}</td>
                      <td>
                        {p.banned
                          ? <span className="badge badge-banned">⛔ Banned</span>
                          : online
                            ? <span className="badge badge-online"><span className="badge-dot" />Online</span>
                            : <span className="badge badge-offline">Offline</span>}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {p.joinedDate || p.createdAt?.slice(0, 10) || '—'}
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            className={`btn btn-sm ${p.banned ? 'btn-success' : 'btn-warning'}`}
                            onClick={() => toggleBan(p)}
                          >
                            {p.banned ? '✓ Unban' : '⛔ Ban'}
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => confirmAction('delete', p)}
                          >
                            🗑
                          </button>
                        </div>
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
            <h3>Delete Player</h3>
            <p>
              Are you sure you want to permanently delete <strong>{confirm.player.username || 'this player'}</strong>?
              This will remove all their stats from Firebase and cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deletePlayer(confirm.player)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}
