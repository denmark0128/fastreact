import {
  Briefcase,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  LayoutGrid,
  Settings,
  Shield,
  UserRound,
  Users,
  UsersRound,
} from 'lucide-react'
import { useState } from 'react'

import type { AuthUser, CompanyProfile } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from './ui/sidebar'

interface AppSidebarProps {
  user: AuthUser | null
  companyProfile?: CompanyProfile | null
  activePath: string
  onNavigate: (path: string) => void
}

const primaryMenu = [
  { key: '/', label: 'Dashboard', icon: LayoutGrid },
  { key: '/employees', label: 'Employees', icon: Users },
  { key: '/departments', label: 'Departments', icon: UsersRound },
  { key: '/settings', label: 'Settings', icon: Settings },
] as const

const secondaryMenu = [
  { key: '/profile', label: 'My Profile', icon: UserRound },
  { key: '/leave', label: 'Leave', icon: CalendarClock },
  { key: '/payroll', label: 'Payroll', icon: ClipboardList },
  { key: '/recruitment', label: 'Recruitment', icon: Briefcase },
  { key: '/performance', label: 'Performance', icon: LayoutGrid },
] as const

const privilegedMenu = [
  { key: '/settings/admin', label: 'Admin Settings', icon: Shield },
  { key: '/settings/audit-trail', label: 'Audit Trail', icon: ClipboardList },
] as const

function isPathActive(pathname: string, key: string) {
  if (key === '/') {
    return pathname === '/'
  }

  return pathname === key || pathname.startsWith(`${key}/`)
}

function getInitials(name?: string | null) {
  if (!name) {
    return 'HR'
  }

  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }

  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
}

export function AppSidebar({ user, companyProfile, activePath, onNavigate }: AppSidebarProps) {
  const [isPlatformOpen, setIsPlatformOpen] = useState(true)
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const isPrivileged = user?.role === 'admin' || user?.role === 'hr_manager'
  const companyName = companyProfile?.company_name?.trim() || 'HR Management'
  const companyLogoUrl = companyProfile?.logo_url || undefined
  const companyInitials = getInitials(companyName)
  const labelTransitionClass =
    'whitespace-nowrap transition-[transform,width] duration-500 ease-in-out group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:-translate-x-1 group-data-[collapsible=icon]:overflow-hidden'

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={companyName} isActive>
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={companyLogoUrl} alt={companyName} className="object-cover" />
                <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  {companyInitials}
                </AvatarFallback>
              </Avatar>
              <div className={`grid flex-1 text-left text-sm leading-tight ${labelTransitionClass}`}>
                <span className="truncate font-semibold">Company</span>
                <span className="truncate text-xs">{companyName}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {isCollapsed ? (
              primaryMenu.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={isPathActive(activePath, item.key)}
                      onClick={() => onNavigate(item.key)}
                      tooltip={item.label}
                    >
                      <Icon />
                      <span className={labelTransitionClass}>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })
            ) : (
              <Collapsible open={isPlatformOpen} onOpenChange={setIsPlatformOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Main Navigation">
                      <LayoutGrid />
                      <span className={labelTransitionClass}>Main Navigation</span>
                      <ChevronDown className="ml-auto transition-transform duration-500 ease-in-out group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {primaryMenu.map((item) => {
                        const Icon = item.icon
                        return (
                          <SidebarMenuSubItem key={item.key}>
                            <SidebarMenuSubButton
                              isActive={isPathActive(activePath, item.key)}
                              onClick={() => onNavigate(item.key)}
                              asChild
                            >
                              <button type="button" className="w-full">
                                <Icon />
                                <span className={labelTransitionClass}>{item.label}</span>
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )}

            {secondaryMenu.map((item) => {
              const Icon = item.icon
              return (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={isPathActive(activePath, item.key)}
                    onClick={() => onNavigate(item.key)}
                    tooltip={item.label}
                  >
                    <Icon />
                    <span className={labelTransitionClass}>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}

            {isPrivileged
              ? privilegedMenu.map((item) => {
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        isActive={isPathActive(activePath, item.key)}
                        onClick={() => onNavigate(item.key)}
                        tooltip={item.label}
                      >
                        <Icon />
                        <span className={labelTransitionClass}>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })
              : null}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={user?.full_name ?? 'User'}>
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.profile_picture_url ?? undefined} alt={user?.full_name ?? 'User'} />
                <AvatarFallback className="rounded-lg">{getInitials(user?.full_name)}</AvatarFallback>
              </Avatar>
              <div className={`grid flex-1 text-left text-sm leading-tight ${labelTransitionClass}`}>
                <span className="truncate font-semibold">{user?.full_name ?? 'User'}</span>
                <span className="truncate text-xs">{user?.email ?? 'unknown@example.com'}</span>
              </div>
              <UserRound className="ml-auto size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
