import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { AppSidebar } from '../components/app-sidebar'
import { ModeToggle } from '../components/mode-toggle'
import { Button } from '../components/ui/button'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '../components/ui/sidebar'
import { useAuth } from '../context/AuthContext'
import { useCurrentUser } from '../modules/auth/hooks'
import { useCompanyProfile } from '../modules/settings/hooks'

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, isAuthenticated, setUser, user } = useAuth()
  const currentUserQuery = useCurrentUser(isAuthenticated)
  const companyProfileQuery = useCompanyProfile()

  useEffect(() => {
    if (currentUserQuery.data?.data) {
      setUser(currentUserQuery.data.data)
    }
  }, [currentUserQuery.data, setUser])

  const onMenuClick = (key: string) => {
    if (key === '/logout') {
      signOut()
      navigate('/login')
      return
    }
    navigate(key)
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={user}
        activePath={location.pathname}
        onNavigate={onMenuClick}
        companyProfile={companyProfileQuery.data?.data ?? null}
      />

      <SidebarInset>
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger aria-label="Toggle sidebar" />
              <h2 className="text-base font-semibold text-foreground">HR Management System</h2>
            </div>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <Button variant="outline" size="sm" onClick={() => onMenuClick('/logout')}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default MainLayout
