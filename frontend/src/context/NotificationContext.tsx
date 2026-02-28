import { createContext, useCallback, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'

import { Toaster } from '../components/ui/sonner'
import { toast } from 'sonner'

interface NotificationContextValue {
  showNotification: (message: string) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const showNotification = useCallback((message: string) => {
    toast.success(message)
  }, [])

  const value = useMemo(
    () => ({
      showNotification,
    }),
    [showNotification],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}
