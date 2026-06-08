import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, AuthState } from '@/types/auth'

interface AuthContextType extends AuthState {
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/auth/check', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser({ username: data.username })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const logout = useCallback(() => {
    window.location.href = '/api/v1/logout'
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
