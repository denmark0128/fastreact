import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { Card, CardContent } from '../components/ui/card'

interface NotificationState {
  id: number
  message: string
}

interface NotificationContextValue {
  showNotification: (message: string) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notification, setNotification] = useState<NotificationState | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const showNotification = useCallback((message: string) => {
    setNotification({
      id: Date.now(),
      message,
    })

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      setNotification(null)
      timeoutRef.current = null
    }, 2400)
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
      {notification ? (
        <div className="pointer-events-none fixed right-4 top-4 z-[60] w-full max-w-xs">
          <Card className="border-emerald-200 bg-emerald-50 text-emerald-700">
            <CardContent className="p-3 text-sm font-medium">{notification.message}</CardContent>
          </Card>
        </div>
      ) : null}
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
