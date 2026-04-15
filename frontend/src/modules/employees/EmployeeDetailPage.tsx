import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import PageHeader from '../../components/shared/PageHeader'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { MonthPicker } from '../../components/ui/month-picker'
import Modal from '../../components/ui/modal'
import { useAuth } from '../../context/AuthContext'
import type { EmployeePayload } from '../../types'
import { useAttendanceRecords } from '../leave/hooks'
import EmployeeForm from './EmployeeForm'
import { useEmployees, useUpdateEmployee } from './hooks'
import { getEmploymentStatusBadgeVariant, getEmploymentStatusLabel } from './status'

const scheduleOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const TIME_RANGE_PATTERN = /\d{1,2}:\d{2}-\d{1,2}:\d{2}/

function EmployeeDetailPage() {
  const navigate = useNavigate()
  const { employeeId } = useParams()
  const { user } = useAuth()
  const canManageEmployees = user?.role === 'admin' || user?.role === 'hr_manager'

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [attendanceMonth, setAttendanceMonth] = useState('2026-03')

  const employeesQuery = useEmployees()
  const updateEmployeeMutation = useUpdateEmployee()

  const selectedMonthStart = `${attendanceMonth}-01`
  const monthEndDate = new Date(`${selectedMonthStart}T00:00:00`)
  monthEndDate.setMonth(monthEndDate.getMonth() + 1)
  monthEndDate.setDate(0)
  const selectedMonthEnd = `${attendanceMonth}-${String(monthEndDate.getDate()).padStart(2, '0')}`

  const monthDays = useMemo(() => {
    const firstDay = new Date(`${selectedMonthStart}T00:00:00`)
    const lastDay = new Date(`${selectedMonthEnd}T00:00:00`)
    const days: string[] = []
    const cursor = new Date(firstDay)

    while (cursor <= lastDay) {
      const dateValue = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
      days.push(dateValue)
      cursor.setDate(cursor.getDate() + 1)
    }

    return days
  }, [selectedMonthStart, selectedMonthEnd])

  const employeeIdNumber = Number(employeeId)
  const attendanceQuery = useAttendanceRecords(
    Number.isNaN(employeeIdNumber)
      ? undefined
      : {
          employee_id: employeeIdNumber,
          date_from: selectedMonthStart,
          date_to: selectedMonthEnd,
          skip: 0,
          limit: 500,
        },
  )

  const employee = useMemo(() => {
    const id = Number(employeeId)
    if (Number.isNaN(id)) {
      return undefined
    }
    return (employeesQuery.data?.data.items ?? []).find((item) => item.id === id)
  }, [employeeId, employeesQuery.data])

  if (employeesQuery.isLoading) {
    return <p className="text-sm text-slate-500">Loading employee details...</p>
  }

  if (!employee) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="mb-4 text-sm text-slate-500">Employee not found.</p>
          <Button variant="outline" onClick={() => navigate('/employees')}>
            Back to Employees
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleUpdate = (payload: EmployeePayload) => {
    updateEmployeeMutation.mutate(
      {
        employeeId: employee.id,
        payload: {
          profile_name: payload.profile_name,
          birth_date: payload.birth_date,
          civil_status: payload.civil_status,
          emergency_contact_name: payload.emergency_contact_name,
          emergency_contact_number: payload.emergency_contact_number,
          department: payload.department,
          position: payload.position,
          employment_status: payload.employment_status,
          employment_type: payload.employment_type,
          rate_type: payload.rate_type,
          rate_amount: payload.rate_amount,
        },
      },
      {
        onSuccess: () => setIsEditModalOpen(false),
      },
    )
  }

  const scheduleMap = scheduleOrder.map((day) => ({
    day,
    hours: employee.weekly_schedule?.[day] ?? null,
  }))
  const fullAddress = [employee.street, employee.city, employee.region].filter(Boolean).join(', ')

  const attendanceByDate = new Map((attendanceQuery.data?.data.items ?? []).map((item) => [item.date, item]))

  return (
    <>
      <PageHeader
        title={employee.profile_name}
        subtitle={`${employee.position} • ${employee.department}`}
        extra={
          <div className="flex items-center gap-2">
            {canManageEmployees ? <Button onClick={() => setIsEditModalOpen(true)}>Edit</Button> : null}
            <Button variant="outline" onClick={() => navigate('/employees')}>
              Back
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Employee Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Employee Code</p>
                <p className="font-medium text-slate-900">{employee.employee_code}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                <Badge variant={getEmploymentStatusBadgeVariant(employee.employment_status)}>
                  {getEmploymentStatusLabel(employee.employment_status, 'full')}
                </Badge>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Employment Type</p>
                <p className="font-medium capitalize text-slate-900">{employee.employment_type.replace('_', ' ')}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Rate</p>
                <p className="font-medium text-slate-900">{employee.rate_amount} ({employee.rate_type})</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Contact Number</p>
                <p className="font-medium text-slate-900">{employee.contact_number || '-'}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Address</p>
                <p className="font-medium text-slate-900">{fullAddress || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Department</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Name</p>
              <p className="font-medium text-slate-900">{employee.department}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Position</p>
              <p className="font-medium text-slate-900">{employee.position}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Personal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Birth Date</p>
              <p className="font-medium text-slate-900">{employee.birth_date || '-'}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Civil Status</p>
              <p className="font-medium capitalize text-slate-900">{employee.civil_status || '-'}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Emergency Contact Name</p>
              <p className="font-medium text-slate-900">{employee.emergency_contact_name || '-'}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Emergency Contact Number</p>
              <p className="font-medium text-slate-900">{employee.emergency_contact_number || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Weekly Schedule Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {scheduleMap.map((entry) => (
              <div key={entry.day} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">{entry.day.slice(0, 3)}</p>
                <p className="mt-1 font-medium text-slate-900">{entry.hours ?? 'Off'}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Monthly Attendance</CardTitle>
          <div className="w-44">
            <MonthPicker value={attendanceMonth} onChange={setAttendanceMonth} />
          </div>
        </CardHeader>
        <CardContent>
          {attendanceQuery.isLoading ? <p className="text-sm text-slate-500">Loading attendance...</p> : null}

          {!attendanceQuery.isLoading ? (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-28" />
                  <col className="w-24" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col />
                </colgroup>
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2">Date</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">AM In</th>
                    <th className="py-2">AM Out</th>
                    <th className="py-2">PM In</th>
                    <th className="py-2">PM Out</th>
                    <th className="py-2">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {monthDays.map((day) => {
                    const attendance = attendanceByDate.get(day)
                    const weekdayKey = new Date(`${day}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
                    const scheduleValue = employee.weekly_schedule?.[weekdayKey]
                    const isDayOff = !scheduleValue || !TIME_RANGE_PATTERN.test(scheduleValue)
                    const status = isDayOff ? 'Day Off' : attendance ? 'Present' : 'Absent'

                    return (
                      <tr key={day} className="border-b align-top">
                        <td className="py-2 pr-2">{day}</td>
                        <td className="py-2 pr-2">{status}</td>
                        <td className="py-2 pr-2">{attendance?.am_in || '—'}</td>
                        <td className="py-2 pr-2">{attendance?.am_out || '—'}</td>
                        <td className="py-2 pr-2">{attendance?.pm_in || '—'}</td>
                        <td className="py-2 pr-2">{attendance?.pm_out || '—'}</td>
                        <td className="py-2 pr-2">{attendance?.note || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {canManageEmployees ? (
        <Modal open={isEditModalOpen} title="Update Employee" onClose={() => setIsEditModalOpen(false)}>
          <EmployeeForm
            initialEmployee={employee}
            onSubmit={handleUpdate}
            loading={updateEmployeeMutation.isPending}
          />
        </Modal>
      ) : null}
    </>
  )
}

export default EmployeeDetailPage
