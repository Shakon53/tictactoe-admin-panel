import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import AccessDenied from './pages/AccessDenied'
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
  // undefined = ещё загружается, null = не вошёл, object = вошёл
  const [user, setUser]       = useState(undefined)
  // undefined = проверяем, true/false = результат
  const [isAdmin, setIsAdmin] = useState(undefined)

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null)
        setIsAdmin(false)
        return
      }

      setUser(u)
      setIsAdmin(undefined) // показываем спиннер пока проверяем

      try {
        const snap = await getDoc(doc(db, 'admins', u.uid))
        setIsAdmin(snap.exists())
      } catch {
        setIsAdmin(false)
      }
    })
  }, [])

  // Пока Firebase инициализируется
  if (user === undefined || (user && isAdmin === undefined)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, color: 'var(--text-muted)' }}>
        <div className="spinner" />
        <span>{user ? 'Проверка прав доступа…' : 'Инициализация…'}</span>
      </div>
    )
  }

  // Не вошёл
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*"      element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Вошёл, но не администратор
  if (!isAdmin) {
    return <AccessDenied user={user} />
  }

  // Вошёл и является администратором
  return <ProtectedLayout user={user} />
}
