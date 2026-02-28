import PageHeader from '../../components/shared/PageHeader'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { useNavigate } from 'react-router-dom'
import { useEmployees } from '../employees/hooks'
import { getEmploymentStatusBadgeVariant, getEmploymentStatusLabel } from '../employees/status'

const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

function DashboardPage() {
  const navigate = useNavigate()
  const employeesQuery = useEmployees()
  const employees = employeesQuery.data?.data.items ?? []
  const todayKey = dayKeys[new Date().getDay()]

  const unavailableToday = employees
    .map((employee) => {
      const scheduleToday = employee.weekly_schedule?.[todayKey]
      const isDayOff = scheduleToday == null || scheduleToday.trim() === ''
      const isUnavailable = employee.employment_status.toLowerCase() !== 'active'

      if (!isDayOff && !isUnavailable) {
        return null
      }

      return {
        id: employee.id,
        name: employee.profile_name,
        department: employee.department,
        reason: isUnavailable ? getEmploymentStatusLabel(employee.employment_status) : 'Day Off',
        reasonVariant: isUnavailable ? getEmploymentStatusBadgeVariant(employee.employment_status) : 'secondary',
      }
    })
    .filter((item): item is { id: number; name: string; department: string; reason: string; reasonVariant: 'success' | 'info' | 'danger' | 'warning' | 'secondary' } => item !== null)

  const stats = [
    { label: 'Total Employees', value: employees.length },
    { label: 'Unavailable / Day Off Today', value: unavailableToday.length },
    { label: 'Open Positions', value: 0 },
    { label: 'Pending Appraisals', value: 0 },
  ]

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Quick overview of HR activities" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Unavailable / Day Off People Today</CardTitle>
        </CardHeader>
        <CardContent>
          {employeesQuery.isLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading employees...</p>
          ) : unavailableToday.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No unavailable or day-off employees today.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {unavailableToday.map((item) => (
                <li
                  key={item.id}
                  className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/employees/${item.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      navigate(`/employees/${item.id}`)
                    }
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                      <p className="text-slate-500 dark:text-slate-400">{item.department}</p>
                    </div>
                    <Badge variant={item.reasonVariant}>{item.reason}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default DashboardPage
