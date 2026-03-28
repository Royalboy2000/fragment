import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext<any>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get('/api/me')
      setUser(res.data)
    } catch (err) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    const res = await axios.post('/api/login', { username, password })
    setUser(res.data.user)
    return res.data
  }

  const logout = async () => {
    await axios.post('/api/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
