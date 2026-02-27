import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { useAuth } from '../context/AuthContext'
import { useCurrentUser } from '../modules/auth/hooks'

const baseMenuItems = [
  { key: '/', label: 'Dashboard' },
  { key: '/profile', label: 'My Profile' },
  { key: '/employees', label: 'Employees' },
  { key: '/departments', label: 'Departments' },
  { key: '/leave', label: 'Leave' },
  { key: '/payroll', label: 'Payroll' },
  { key: '/recruitment', label: 'Recruitment' },
  { key: '/performance', label: 'Performance' },
  { key: '/settings', label: 'Settings' },
] as const

const privilegedMenuItems = [
  { key: '/settings/admin', label: 'Admin Settings' },
  { key: '/settings/audit-trail', label: 'Audit Trail' },
] as const

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, isAuthenticated, setUser, user } = useAuth()
  const currentUserQuery = useCurrentUser(isAuthenticated)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showExpandedText, setShowExpandedText] = useState(true)
  const menuItems = user?.role === 'admin' || user?.role === 'hr_manager'
    ? [...baseMenuItems, ...privilegedMenuItems]
    : baseMenuItems

  useEffect(() => {
    if (currentUserQuery.data?.data) {
      setUser(currentUserQuery.data.data)
    }
  }, [currentUserQuery.data, setUser])

  useEffect(() => {
    if (isSidebarCollapsed) {
      setShowExpandedText(false)
      return
    }

    const timer = window.setTimeout(() => {
      setShowExpandedText(true)
    }, 300)

    return () => {
      window.clearTimeout(timer)
    }
  }, [isSidebarCollapsed])

  const onMenuClick = (key: string) => {
    if (key === '/logout') {
      signOut()
      navigate('/login')
      return
    }
    navigate(key)
  }

  const isMenuItemActive = (key: string) => {
    if (key === '/') {
      return location.pathname === '/'
    }

    if (key === '/settings') {
      return location.pathname === '/settings'
    }

    return location.pathname === key || location.pathname.startsWith(`${key}/`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div
        className="mx-auto grid min-h-screen grid-cols-1 transition-[grid-template-columns] duration-300 ease-in-out"
        style={{ gridTemplateColumns: isSidebarCollapsed ? '72px 1fr' : '240px 1fr' }}
      >
        <aside className="border-r bg-white">
          <div className="sticky top-0 p-4">
            <div className="mb-4 flex items-center gap-2">
              {!isSidebarCollapsed && showExpandedText ? (
                <h1 className="px-2 text-lg font-semibold text-slate-900 transition-all duration-400 ease-in-out">HR Management</h1>
              ) : (
                <span className="px-2 text-lg font-semibold text-slate-900 transition-all duration-400 ease-in-out">HR</span>
              )}
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.key}
                  variant={isMenuItemActive(item.key) ? 'default' : 'ghost'}
                  className={
                    isSidebarCollapsed
                      ? 'w-full justify-start px-2 transition-all duration-400 ease-in-out'
                      : 'w-full justify-start transition-all duration-400 ease-in-out'
                  }
                  onClick={() => onMenuClick(item.key)}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  {isSidebarCollapsed || !showExpandedText ? item.label.slice(0, 2).toUpperCase() : item.label}
                </Button>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Toggle sidebar"
                  onClick={() => setIsSidebarCollapsed((current) => !current)}
                >
                  {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </Button>
                <h2 className="text-base font-semibold text-slate-900">HR Management System</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onMenuClick('/logout')}>
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <main className="p-6">
            <Card>
              <CardContent className="pt-6">
                <Outlet />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  )
}

export default MainLayout
