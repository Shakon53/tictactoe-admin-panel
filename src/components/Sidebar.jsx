import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

const navItems = [
  { to: '/',           icon: '⊞', label: 'Dashboard' },
  { to: '/players',    icon: '👥', label: 'Players' },
  { to: '/rooms',      icon: '🎮', label: 'Rooms' },
  { to: '/reports',    icon: '🚩', label: 'Reports' },
  { to: '/statistics', icon: '📊', label: 'Statistics' },
  { to: '/admins',     icon: '👑', label: 'Admins' },
]

export default function Sidebar({ user, reportCount }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'A'

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">✕</div>
        <div>
          <h1>TicTacToe</h1>
          <span>Admin Panel</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.to === '/reports' && reportCount > 0 && (
              <span className="nav-badge">{reportCount}</span>
            )}
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: 12 }}>Account</div>
        <button
          className="nav-item"
          style={{ width: '100%', background: 'none', border: '1px solid transparent', textAlign: 'left' }}
          onClick={handleLogout}
        >
          <span className="nav-icon">⏻</span>
          Sign Out
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.displayName ?? user?.email ?? 'Admin'}</div>
            <div className="user-role">Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
