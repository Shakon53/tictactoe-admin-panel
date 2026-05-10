import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts'

const CHART_COLORS = ['#8b5cf6', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#ec4899']

const tooltipStyle = {
  contentStyle: { background: '#131325', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, color: '#f1f0ff', fontSize: 12 },
  itemStyle: { color: '#a78bfa' },
  cursor: { fill: 'rgba(139,92,246,0.07)' }
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#131325', border: '1px solid rgba(139,92,246,0.35)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function Statistics() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) return <div className="loading-wrap"><div className="spinner" /><span>Computing statistics…</span></div>

  // Aggregate totals
  const totalWins   = users.reduce((s, u) => s + (u.wins ?? 0), 0)
  const totalLosses = users.reduce((s, u) => s + (u.losses ?? 0), 0)
  const totalDraws  = users.reduce((s, u) => s + (u.draws ?? 0), 0)
  const totalGames  = users.reduce((s, u) => s + (u.totalGames ?? 0), 0)
  const totalPlayers = users.length
  const avgWinRate  = totalPlayers ? Math.round((totalWins / Math.max(totalGames, 1)) * 100) : 0
  const maxStreak   = users.reduce((m, u) => Math.max(m, u.bestStreak ?? 0), 0)

  // Top 10 players by wins for bar chart
  const top10 = [...users]
    .sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0))
    .slice(0, 10)
    .map(u => ({ name: u.username?.slice(0, 10) || 'Unknown', wins: u.wins ?? 0, losses: u.losses ?? 0, draws: u.draws ?? 0 }))

  // Pie data
  const pieData = [
    { name: 'Wins',   value: totalWins },
    { name: 'Losses', value: totalLosses },
    { name: 'Draws',  value: totalDraws },
  ].filter(d => d.value > 0)

  // Games per player distribution
  const buckets = { '0': 0, '1-5': 0, '6-20': 0, '21-50': 0, '50+': 0 }
  users.forEach(u => {
    const g = u.totalGames ?? 0
    if (g === 0) buckets['0']++
    else if (g <= 5) buckets['1-5']++
    else if (g <= 20) buckets['6-20']++
    else if (g <= 50) buckets['21-50']++
    else buckets['50+']++
  })
  const distributionData = Object.entries(buckets).map(([range, count]) => ({ range, count }))

  // Streak distribution
  const streakData = [...users]
    .filter(u => (u.bestStreak ?? 0) > 0)
    .sort((a, b) => (b.bestStreak ?? 0) - (a.bestStreak ?? 0))
    .slice(0, 8)
    .map(u => ({ name: u.username?.slice(0, 10) || 'Unknown', streak: u.bestStreak ?? 0 }))

  const summaryStats = [
    { label: 'Total Matches',   value: totalGames,   icon: '🎮', color: 'purple' },
    { label: 'Win/Loss Ratio',  value: totalLosses ? `${(totalWins/totalLosses).toFixed(2)}` : '∞', icon: '⚖️', color: 'green' },
    { label: 'Avg Win Rate',    value: `${avgWinRate}%`, icon: '📈', color: 'orange' },
    { label: 'Top Streak',      value: maxStreak,   icon: '🔥', color: 'blue' },
  ]

  return (
    <div>
      <div className="page-header">
        <h2>Statistics</h2>
        <p>Aggregated from {totalPlayers} players · real-time Firebase data</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {summaryStats.map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        {/* Top Players Bar Chart */}
        <div className="glass-card">
          <div className="card-header">
            <div>
              <div className="card-title">Top 10 Players — Wins vs Losses</div>
              <div className="card-subtitle">Sorted by total wins</div>
            </div>
          </div>
          <div className="card-body">
            {top10.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}><div className="icon">📊</div><span>No data yet</span></div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={top10} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9d94c4' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9d94c4' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#9d94c4' }} />
                  <Bar dataKey="wins"   fill="#8b5cf6" radius={[3,3,0,0]} name="Wins" />
                  <Bar dataKey="losses" fill="#ef4444" radius={[3,3,0,0]} name="Losses" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-card">
          <div className="card-header">
            <div>
              <div className="card-title">Overall Outcome Distribution</div>
              <div className="card-subtitle">All games across all players</div>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {pieData.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}><div className="icon">🥧</div><span>No games played yet</span></div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={['#8b5cf6','#ef4444','#f59e0b'][i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#131325', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, color: '#f1f0ff', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#9d94c4' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Games distribution */}
        <div className="glass-card">
          <div className="card-header">
            <div>
              <div className="card-title">Games Played Distribution</div>
              <div className="card-subtitle">How many games each player has played</div>
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#9d94c4' }} />
                <YAxis tick={{ fontSize: 12, fill: '#9d94c4' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} name="Players" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Streak chart */}
        <div className="glass-card">
          <div className="card-header">
            <div>
              <div className="card-title">Best Win Streaks</div>
              <div className="card-subtitle">Top 8 players by consecutive wins</div>
            </div>
          </div>
          <div className="card-body">
            {streakData.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}><div className="icon">🔥</div><span>No streak data yet</span></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={streakData} layout="vertical" barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9d94c4' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#9d94c4' }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="streak" fill="#f59e0b" radius={[0,4,4,0]} name="Streak" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Raw leaderboard */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Full Leaderboard</div>
          <div className="card-subtitle">All {totalPlayers} players ranked by wins</div>
        </div>
        <div className="table-wrapper">
          {users.length === 0 ? (
            <div className="empty-state"><div className="icon">🏆</div><span>No players yet</span></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Wins</th>
                  <th>Losses</th>
                  <th>Draws</th>
                  <th>Total Games</th>
                  <th>Win Rate</th>
                  <th>Best Streak</th>
                </tr>
              </thead>
              <tbody>
                {[...users].sort((a,b) => (b.wins??0)-(a.wins??0)).map((u, i) => {
                  const total = (u.wins??0)+(u.losses??0)+(u.draws??0)
                  const wr = total ? Math.round(((u.wins??0)/total)*100) : 0
                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 800, color: i<3 ? ['#fbbf24','#9ca3af','#b45309'][i] : 'var(--text-muted)', fontSize: 14 }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">{u.avatar || u.username?.[0] || '?'}</div>
                          <div className="info">
                            <span className="name">{u.username || 'Unknown'}</span>
                            <span className="email">{u.email || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--neon-green)', fontWeight: 700 }}>{u.wins ?? 0}</td>
                      <td style={{ color: 'var(--neon-red)', fontWeight: 700 }}>{u.losses ?? 0}</td>
                      <td style={{ color: 'var(--neon-orange)' }}>{u.draws ?? 0}</td>
                      <td className="td-main">{u.totalGames ?? 0}</td>
                      <td>
                        <div className="mini-bar-wrap">
                          <div className="mini-bar">
                            <div className="mini-bar-fill wins" style={{ width: `${wr}%` }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 30, textAlign: 'right' }}>{wr}%</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--purple-bright)', fontWeight: 700 }}>🔥 {u.bestStreak ?? 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
