import { useEffect, useState } from 'react'
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useToast, ToastContainer } from '../hooks/useToast'

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)
  const { toasts, addToast } = useToast()

  useEffect(() => {
    // Try to read from optional 'rooms' Firestore collection
    const unsub = onSnapshot(collection(db, 'rooms'), snap => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => {
      // Collection may not exist yet
      setLoading(false)
    })
    return () => unsub()
  }, [])

  async function deleteRoom(room) {
    await deleteDoc(doc(db, 'rooms', room.id))
    addToast(`Room ${room.code || room.id} deleted`, 'success')
    setConfirm(null)
  }

  async function clearInactive() {
    const inactive = rooms.filter(r => r.status === 'waiting' || r.status === 'inactive')
    for (const r of inactive) {
      await deleteDoc(doc(db, 'rooms', r.id))
    }
    addToast(`Cleared ${inactive.length} inactive room(s)`, 'success')
  }

  function statusBadge(status) {
    if (status === 'active' || status === 'playing')
      return <span className="badge badge-active"><span className="badge-dot" />In Game</span>
    if (status === 'waiting')
      return <span className="badge badge-waiting">⏳ Waiting</span>
    return <span className="badge badge-offline">{status || 'Unknown'}</span>
  }

  if (loading) return <div className="loading-wrap"><div className="spinner" /><span>Loading rooms…</span></div>

  return (
    <div>
      <div className="page-header">
        <h2>Rooms Management</h2>
        <p>Active and waiting game rooms</p>
      </div>

      <div className="info-box">
        <span className="info-icon">ℹ️</span>
        <div>
          <strong>Architecture note:</strong> Multiplayer rooms in Tic Tac Toe Online are managed via Socket.IO
          on <code style={{ color: 'var(--purple-bright)' }}>trolley.proxy.rlwy.net:17667</code>.
          Real-time room state lives on the socket server. If your app also writes room data to a Firestore
          <code style={{ color: 'var(--purple-bright)' }}> rooms</code> collection, it will appear here automatically.
          You can add that sync in your Android app to unlock full room management from this panel.
        </div>
      </div>

      <div className="glass-card">
        <div className="card-header">
          <div>
            <div className="card-title">Game Rooms</div>
            <div className="card-subtitle">{rooms.length} room(s) in Firestore</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {rooms.some(r => r.status === 'waiting' || r.status === 'inactive') && (
              <button className="btn btn-warning" onClick={clearInactive}>
                🧹 Clear Inactive
              </button>
            )}
          </div>
        </div>

        <div className="table-wrapper">
          {rooms.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🎮</div>
              <strong style={{ color: 'var(--text-secondary)' }}>No rooms in Firestore</strong>
              <span style={{ textAlign: 'center', maxWidth: 400, fontSize: 12, lineHeight: 1.7 }}>
                Rooms are currently managed by the Socket.IO server.<br />
                Write room data to a <strong>rooms</strong> Firestore collection from your Android app
                to manage them here.
              </span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Room Code</th>
                  <th>Players</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id}>
                    <td className="td-main" style={{ fontFamily: 'monospace', letterSpacing: '0.15em', color: 'var(--purple-bright)' }}>
                      {r.code || r.id.slice(0, 6).toUpperCase()}
                    </td>
                    <td>
                      {r.players
                        ? (Array.isArray(r.players) ? r.players : Object.values(r.players))
                            .map((name, i) => (
                              <span key={i} style={{ fontSize: 12, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 4, padding: '2px 7px', marginRight: 5, color: 'var(--purple-bright)' }}>
                                {name}
                              </span>
                            ))
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>
                      }
                    </td>
                    <td>{statusBadge(r.status)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {r.createdAt?.toDate?.().toLocaleString() ?? r.createdAt ?? '—'}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => setConfirm(r)}>
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* How to add room sync */}
      <div className="glass-card" style={{ marginTop: 20, padding: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>⚙️ Enable Room Sync (Android → Firebase)</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
          Add this to your <code style={{ color: 'var(--purple-bright)' }}>MultiplayerActivity.java</code> when a room is created:
        </p>
        <pre style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)',
          borderRadius: 8, padding: 16, fontSize: 12.5, color: '#c4b5fd',
          overflowX: 'auto', lineHeight: 1.7
        }}>
{`Map<String, Object> room = new HashMap<>();
room.put("code", roomCode);
room.put("status", "waiting");
room.put("createdAt", FieldValue.serverTimestamp());
room.put("players", Arrays.asList(currentUsername));

db.collection("rooms").document(roomCode).set(room);`}
        </pre>
      </div>

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Delete Room</h3>
            <p>Delete room <strong>{confirm.code || confirm.id}</strong>? This removes it from Firestore.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deleteRoom(confirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}
