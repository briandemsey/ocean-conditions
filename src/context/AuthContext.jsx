import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(u => { setUser(u); setLoading(false) })
      .catch(() => { localStorage.removeItem('token'); setToken(null); setUser(null); setLoading(false) })
  }, [])

  function login(email, password) {
    return fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error)
        localStorage.setItem('token', data.token)
        setToken(data.token)
        setUser(data.user)
        return data.user
      })
  }

  function register(username, email, password) {
    return fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error)
        localStorage.setItem('token', data.token)
        setToken(data.token)
        setUser(data.user)
        return data.user
      })
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  function authHeaders(extra = {}) {
    return token ? { ...extra, Authorization: `Bearer ${token}` } : extra
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authHeaders }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
