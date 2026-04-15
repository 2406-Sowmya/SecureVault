import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(() => {
    try { return JSON.parse(localStorage.getItem('sv_user')) } catch { return null }
  })
  const [sessionId, setSessionId] = useState(null)
  const [location,  setLocation]  = useState(null)

  const saveLogin = useCallback((tokenData) => {
    const u = { username: tokenData.username, email: tokenData.email }
    localStorage.setItem('sv_token', tokenData.access_token)
    localStorage.setItem('sv_user',  JSON.stringify(u))
    setUser(u)
    if (tokenData.location) setLocation(tokenData.location)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sv_token')
    localStorage.removeItem('sv_user')
    setUser(null)
    setSessionId(null)
    setLocation(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user, sessionId, setSessionId,
      location, setLocation,
      saveLogin, logout,
      isAuthenticated: !!user,
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
