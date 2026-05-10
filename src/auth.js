const SESSION_KEY = 'ttt_admin_session'
const ADMIN_LOGIN = import.meta.env.VITE_ADMIN_LOGIN || 'admin'
const ADMIN_PASS  = import.meta.env.VITE_ADMIN_PASSWORD || ''

export function login(username, password) {
  if (username === ADMIN_LOGIN && password === ADMIN_PASS) {
    sessionStorage.setItem(SESSION_KEY, btoa(`${username}:${Date.now()}`))
    return true
  }
  return false
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY)
}

export function isAuthenticated() {
  return !!sessionStorage.getItem(SESSION_KEY)
}
