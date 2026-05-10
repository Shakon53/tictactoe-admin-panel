import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { isAuthenticated, logout } from './auth'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Players from './pages/Players'
import Rooms from './pages/Rooms'
import Reports from './pages/Reports'
import Statistics from './pages/Statistics'
import Admins from './pages/Admins'

const PAGE_TITLES = {
  '/':           'Dashboard',
  '/players':    'Players',
  '/rooms':      'Rooms',
  '/reports':    'Reports',
  '/statistics': 'Statistics',
  '/admins':     'Admins',
}

function ProtectedLayout() {
  const location  = useLocation()
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
      <Sidebar reportCount={reportCount} onLogout={logout} />
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
            <Route path="/admins"     element={<Admins />} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated())

  // Слушаем изменения сессии (например logout из Sidebar)
  useEffect(() => {
    const check = () => setAuthed(isAuthenticated())
    window.addEventListener('storage', check)
    window.addEventListener('admin-auth-change', check)
    return () => {
      window.removeEventListener('storage', check)
      window.removeEventListener('admin-auth-change', check)
    }
  }, [])

  if (!authed) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={() => { setAuthed(true) }} />} />
        <Route path="*"      element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return <ProtectedLayout />
}
