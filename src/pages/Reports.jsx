import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query
} from 'firebase/firestore'
import { db } from '../firebase'
import { useToast, ToastContainer } from '../hooks/useToast'

const CATEGORIES = ['Bug Report', 'Cheating', 'Harassment', 'Support Request', 'Other']

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ reporter: '', subject: '', category: 'Bug Report', message: '' })
  const [confirm, setConfirm] = useState(null)
  const { toasts, addToast } = useToast()

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [])

  const filtered = reports.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.reporter?.toLowerCase().includes(q) || r.subject?.toLowerCase().includes(q) || r.message?.toLowerCase().includes(q)
    const matchFilter = filter === 'all' || r.status === filter
    return matchSearch && matchFilter
  })

  async function submitReport(e) {
    e.preventDefault()
    if (!form.reporter.trim() || !form.subject.trim()) return
    await addDoc(collection(db, 'reports'), {
      ...form,
      status: 'open',
      createdAt: serverTimestamp(),
    })
    setForm({ reporter: '', subject: '', category: 'Bug Report', message: '' })
    setShowForm(false)
    addToast('Report submitted', 'success')
  }

  async function resolve(r) {
    await updateDoc(doc(db, 'reports', r.id), { status: 'resolved', resolvedAt: serverTimestamp() })
    addToast('Report marked resolved', 'success')
  }

  async function deleteReport(r) {
    await deleteDoc(doc(db, 'reports', r.id))
    addToast('Report deleted', 'success')
    setConfirm(null)
  }

  function formatTime(ts) {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleString()
  }

  if (loading) return <div className="loading-wrap"><div className="spinner" /><span>Loading reports…</span></div>

  const openCount     = reports.filter(r => r.status === 'open').length
  const resolvedCount = reports.filter(r => r.status === 'resolved').length

  return (
    <div>
      <div className="page-header">
        <h2>Reports & Support</h2>
        <p>{openCount} open · {resolvedCount} resolved</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Open',     value: openCount,     color: '#f87171', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.25)' },
          { label: 'Resolved', value: resolvedCount, color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
          { label: 'Total',    value: reports.length,color: 'var(--purple-bright)', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="glass-card">
        <div className="card-header">
          <div>
            <div className="card-title">Reports</div>
            <div className="card-subtitle">Player complaints and support requests</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? '✕ Close' : '+ New Report'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={submitReport} style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Reporter (username)</label>
                <input
                  className="search-input" style={{ width: '100%', paddingLeft: 12 }}
                  placeholder="Player username"
                  value={form.reporter}
                  onChange={e => setForm(p => ({ ...p, reporter: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Category</label>
                <select
                  className="filter-select" style={{ width: '100%' }}
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Subject</label>
              <input
                className="search-input" style={{ width: '100%', paddingLeft: 12 }}
                placeholder="Report subject"
                value={form.subject}
                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Message</label>
              <textarea
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 13,
                  resize: 'vertical', minHeight: 80, outline: 'none'
                }}
                placeholder="Describe the issue…"
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Submit Report</button>
            </div>
          </form>
        )}

        <div className="filter-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search reports…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All ({reports.length})</option>
            <option value="open">Open ({openCount})</option>
            <option value="resolved">Resolved ({resolvedCount})</option>
          </select>
        </div>

        <div className="table-wrapper">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🚩</div>
              <span>{reports.length === 0 ? 'No reports yet' : 'No reports match your filter'}</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reporter</th>
                  <th>Category</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td className="td-main">
                      <div style={{ fontWeight: 600 }}>{r.reporter || '—'}</div>
                      {r.email && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          <a href={`mailto:${r.email}?subject=Re: ${encodeURIComponent(r.subject || 'Your support request')}`}
                             style={{ color: '#818cf8', textDecoration: 'none' }}
                             title="Click to reply via email">
                            ✉ {r.email}
                          </a>
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: 12, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 5, padding: '2px 8px', color: 'var(--purple-bright)' }}>
                        {r.category || 'Other'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{r.subject || '—'}</div>
                      {r.message && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.message}</div>}
                    </td>
                    <td>
                      {r.status === 'resolved'
                        ? <span className="badge badge-resolved">✓ Resolved</span>
                        : <span className="badge badge-open">● Open</span>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatTime(r.createdAt)}</td>
                    <td>
                      <div className="actions">
                        {r.email && (
                          <a href={`mailto:${r.email}?subject=Re: ${encodeURIComponent(r.subject || 'Your support request')}&body=${encodeURIComponent('Hi ' + (r.reporter || '') + ',\n\n')}`}
                             className="btn btn-sm"
                             style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', textDecoration: 'none' }}
                             title={r.email}>
                            ✉ Reply
                          </a>
                        )}
                        {r.status !== 'resolved' && (
                          <button className="btn btn-sm btn-success" onClick={() => resolve(r)}>✓ Resolve</button>
                        )}
                        <button className="btn btn-sm btn-danger" onClick={() => setConfirm(r)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Delete Report</h3>
            <p>Permanently delete this report from <strong>{confirm.reporter}</strong>? This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deleteReport(confirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}
