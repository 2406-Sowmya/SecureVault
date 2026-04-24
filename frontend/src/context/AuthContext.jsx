import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AUTH_EVENT, clearClientAuth } from '../api/api'

const AuthContext = createContext(null)
const AUTH_STORAGE_KEY = 'auth'
const TOKEN_STORAGE_KEY = 'sv_token'
const USER_STORAGE_KEY = 'sv_user'

function readStoredAuth() {
  try {
    const auth = localStorage.getItem(AUTH_STORAGE_KEY) === 'true'
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!auth && !token) return { token: null, user: null }

    const rawUser = localStorage.getItem(USER_STORAGE_KEY)
    const user = rawUser ? JSON.parse(rawUser) : null

    return { token: token || 'authenticated', user }
  } catch {
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [authState, setAuthState] = useState(() => readStoredAuth())
  const [sessionId, setSessionId] = useState(null)
  const [location, setLocation] = useState(null)
  const { token, user } = authState

  const syncAuthFromStorage = useCallback(() => {
    const nextAuth = readStoredAuth()
    setAuthState(nextAuth)

    if (!nextAuth.token) {
      setSessionId(null)
      setLocation(null)
    }
  }, [])

  const setUser = useCallback((nextUser) => {
    setAuthState((current) => {
      const resolvedUser = typeof nextUser === 'function' ? nextUser(current.user) : nextUser

      if (resolvedUser) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(resolvedUser))
      } else {
        localStorage.removeItem(USER_STORAGE_KEY)
      }

      return { ...current, user: resolvedUser }
    })
  }, [])

  useEffect(() => {
    window.addEventListener('storage', syncAuthFromStorage)
    window.addEventListener(AUTH_EVENT, syncAuthFromStorage)
    return () => {
      window.removeEventListener('storage', syncAuthFromStorage)
      window.removeEventListener(AUTH_EVENT, syncAuthFromStorage)
    }
  }, [syncAuthFromStorage])

  useEffect(() => {
    console.log('Auth state:', user)

    if (token && !user) {
      clearClientAuth()
      setAuthState({ token: null, user: null })
      setSessionId(null)
      setLocation(null)
      navigate('/login', { replace: true })
    }
  }, [navigate, token, user])

  const saveLogin = useCallback((tokenData) => {
    const u = { username: tokenData.username, email: tokenData.email }
    const nextToken = tokenData.access_token || 'authenticated'

    localStorage.setItem(AUTH_STORAGE_KEY, 'true')
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u))
    setAuthState({ token: nextToken, user: u })
    setSessionId(null)
    setLocation(tokenData.location || null)
    window.dispatchEvent(new Event(AUTH_EVENT))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    clearClientAuth()
    setUser(null)
    setAuthState({ token: null, user: null })
    setSessionId(null)
    setLocation(null)
    navigate('/login', { replace: true })
  }, [navigate, setUser])

  return (
    <AuthContext.Provider value={{
      user, token, sessionId, setSessionId,
      location, setLocation,
      setUser,
      saveLogin, logout,
      isAuthenticated: Boolean(token && user?.username),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
