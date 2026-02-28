import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import PageHeader from '../../components/shared/PageHeader'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import Modal from '../../components/ui/modal'
import { useAuth } from '../../context/AuthContext'
import type { EmployeePayload } from '../../types'
import EmployeeForm from './EmployeeForm'
import { useEmployees, useUpdateEmployee } from './hooks'
import { getEmploymentStatusBadgeVariant, getEmploymentStatusLabel } from './status'

const scheduleOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

function EmployeeDetailPage() {
  const navigate = useNavigate()
  const { employeeId } = useParams()
  const { user } = useAuth()
  const canManageEmployees = user?.role === 'admin' || user?.role === 'hr_manager'

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const employeesQuery = useEmployees()
  const updateEmployeeMutation = useUpdateEmployee()

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
