import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { tokenStorageKey } from '../api/axios'
import type { AuthUser } from '../types'

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  signIn: (token: string, user: AuthUser) => void
  signOut: () => void
  setUser: (user: AuthUser | null) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(tokenStorageKey))
  const [user, setUser] = useState<AuthUser | null>(null)

  const signIn = (nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem(tokenStorageKey, nextToken)
    setToken(nextToken)
    setUser(nextUser)
  }

  const signOut = () => {
    localStorage.removeItem(tokenStorageKey)
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      signIn,
      signOut,
      setUser,
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
