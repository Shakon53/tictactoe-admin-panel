import { useEffect, useState, useCallback } from 'react'
import { useToast, ToastContainer } from '../hooks/useToast'

const SERVER_URL = 'https://trolley.proxy.rlwy.net:17667'

function BoardPreview({ board }) {
  const symbols = { X: '✕', O: '○', null: '' }
  const colors  = { X: '#a78bfa', O: '#34d399', null: 'var(--text-muted)' }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, width: 60, height: 60 }}>
      {board.map((cell, i) => (
        <div key={i} style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: colors[cell]
        }}>{symbols[cell]}</div>
      ))}
    </div>
  )
}

export default function Rooms() {
  const [rooms, setRooms]         = useState([])
  const [stats, setStats]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [confirm, setConfirm]     = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const { toasts, addToast }      = useToast()

  const fetchRooms = useCallback(async () => {
    try {
      const [roomsRes, statsRes] = await Promise.all([
        fetch(`${SERVER_URL}/admin/rooms`),
        fetch(`${SERVER_URL}/admin/stats`),
      ])
      const roomsData = await roomsRes.json()
      const statsData = await statsRes.json()
      setRooms(roomsData.rooms || [])
      setStats(statsData)
      setError(null)
      setLastRefresh(new Date())
    } catch (e) {
      setError('Не удалось подключиться к серверу: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Авто-обновление каждые 5 сек
  useEffect(() => {
    fetchRooms()
    const interval = setInterval(fetchRooms, 5000)
    return () => clearInterval(interval)
  }, [fetchRooms])

  async function deleteRoom(code) {
    try {
      const res = await fetch(`${SERVER_URL}/admin/rooms/${code}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.ok) {
        addToast(`Комната ${code} удалена`, 'success')
        fetchRooms()
      }
    } catch (e) {
      addToast('Ошибка удаления', 'error')
    }
    setConfirm(null)
  }

  async function clearInactive() {
    try {
      const res = await fetch(`${SERVER_URL}/admin/rooms`, { method: 'DELETE' })
      const data = await res.json()
      addToast(`Очищено ${data.cleared} неактивных комнат`, 'success')
      fetchRooms()
    } catch (e) {
      addToast('Ошибка очистки', 'error')
    }
  }

  function timeAgo(ts) {
    if (!ts) return '—'
    const secs = Math.floor((Date.now() - ts) / 1000)
    if (secs < 60)  return `${secs}с назад`
    if (secs < 3600) return `${Math.floor(secs/60)}м назад`
    return `${Math.floor(secs/3600)}ч назад`
  }

  function formatUptime(secs) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    return h > 0 ? `${h}ч ${m}м` : `${m}м`
  }

  return (
    <div>
      <div className="page-header">
        <h2>Rooms Management</h2>
        <p>Live данные с TCP сервера — обновляется каждые 5 секунд</p>
      </div>

      {/* Статы сервера */}
      {stats && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Активных комнат',   value: stats.activeRooms,      color: 'purple', icon: '🎮' },
            { label: 'В ожидании',        value: stats.waitingRooms,     color: 'orange', icon: '⏳' },
            { label: 'Идёт игра',         value: stats.playingRooms,     color: 'green',  icon: '⚔️' },
            { label: 'Сыграно всего',     value: stats.totalGamesPlayed, color: 'blue',   icon: '🏆' },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-card-icon">{s.icon}</div>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Сервер статус */}
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <div className="card-title">🖥️ Статус сервера</div>
            <div className="card-subtitle">
              {lastRefresh ? `Обновлено: ${lastRefresh.toLocaleTimeString()}` : 'Подключение…'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={fetchRooms}>↻ Обновить</button>
            {rooms.some(r => r.status === 'waiting') && (
              <button className="btn btn-warning btn-sm" onClick={clearInactive}>🧹 Очистить неактивные</button>
            )}
          </div>
        </div>
        <div style={{ padding: '14px 24px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Адрес',    value: 'trolley.proxy.rlwy.net:17667' },
            { label: 'Протокол', value: 'TCP + HTTP (multiplexed)' },
            { label: 'Uptime',   value: stats ? formatUptime(stats.uptime) : '—' },
            { label: 'Статус',   value: error ? '🔴 Недоступен' : '🟢 Online' },
          ].map(r => (
            <div key={r.label}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{r.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: error && r.label==='Статус' ? '#f87171' : 'var(--purple-bright)' }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ошибка подключения */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, color: '#f87171', fontSize: 13 }}>
          ⚠️ {error}
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            Возможно сервер перезапускается или Railway приостановил его. Подожди 30 секунд и обнови.
          </div>
        </div>
      )}

      {/* Таблица комнат */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title">Активные комнаты</div>
          <div className="card-subtitle">{rooms.length} комнат на сервере</div>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-wrap"><div className="spinner" /><span>Подключение к серверу…</span></div>
          ) : rooms.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🎮</div>
              <strong style={{ color: 'var(--text-secondary)' }}>
                {error ? 'Сервер недоступен' : 'Нет активных комнат'}
              </strong>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {error ? 'Проверь Railway dashboard' : 'Комнаты появятся когда игроки начнут создавать их'}
              </span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Код</th>
                  <th>Игрок X</th>
                  <th>Игрок O</th>
                  <th>Статус</th>
                  <th>Поле</th>
                  <th>Ход</th>
                  <th>Создана</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.code}>
                    <td>
                      <code style={{ fontSize: 16, fontWeight: 800, color: 'var(--purple-bright)', letterSpacing: '0.15em' }}>
                        {r.code}
                      </code>
                    </td>
                    <td style={{ color: '#a78bfa', fontWeight: 600 }}>{r.creator || '—'}</td>
                    <td style={{ color: '#34d399', fontWeight: 600 }}>{r.joiner  || <span style={{ color: 'var(--text-muted)' }}>Ожидает...</span>}</td>
                    <td>
                      {r.status === 'playing'
                        ? <span className="badge badge-active"><span className="badge-dot" />Играют</span>
                        : <span className="badge badge-waiting">⏳ Ожидание</span>}
                    </td>
                    <td>{r.board && <BoardPreview board={r.board} />}</td>
                    <td style={{ fontSize: 18, fontWeight: 800, color: r.currentTurn === 'X' ? '#a78bfa' : '#34d399' }}>
                      {r.currentTurn === 'X' ? '✕' : '○'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(r.createdAt)}</td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => setConfirm(r)}>✕ Закрыть</button>
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
            <h3>Закрыть комнату</h3>
            <p>
              Закрыть комнату <strong style={{ color: 'var(--purple-bright)' }}>{confirm.code}</strong>?<br/>
              {confirm.joiner
                ? `Игроки ${confirm.creator} и ${confirm.joiner} получат уведомление об отключении.`
                : `Игрок ${confirm.creator} ожидает соперника — комната будет удалена.`}
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Отмена</button>
              <button className="btn btn-danger" onClick={() => deleteRoom(confirm.code)}>Закрыть комнату</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}
