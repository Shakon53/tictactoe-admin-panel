import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Players from './pages/Players'
import Rooms from './pages/Rooms'
import Reports from './pages/Reports'
import Statistics from './pages/Statistics'

const PAGE_TITLES = {
  '/':           'Dashboard',
  '/players':    'Players',
  '/rooms':      'Rooms',
  '/reports':    'Reports',
  '/statistics': 'Statistics',
}

function ProtectedLayout({ user }) {
  const location = useLocation()
  const [reportCount, setReportCount] = useState(0)
  const title = PAGE_TITLES[location.pathname] ?? 'Admin'

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'reports'), snap => {
      setReportCount(snap.docs.filter(d => d.data().status === 'open').length)
    }, () => {})
    return () => unsub()
  }, [])

  return (
    <div className="app-layout">
      <Sidebar user={user} reportCount={reportCount} />
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            Tic Tac Toe — <span>{title}</span>
          </div>
          <div className="live-badge">
            <span className="live-dot" />
            Live
          </div>
        </header>
        <div className="page-scroll">
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/players"    element={<Players />} />
            <Route path="/rooms"      element={<Rooms />} />
            <Route path="/reports"    element={<Reports />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser]   = useState(undefined)

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u ?? null))
  }, [])

  if (user === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, color: 'var(--text-muted)' }}>
        <div className="spinner" />
        <span>Initializing…</span>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*"      element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return <ProtectedLayout user={user} />
}
