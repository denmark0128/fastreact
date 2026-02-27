import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import PageHeader from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { useEmployees } from '../employees/hooks'
import { useDepartments } from '../settings/hooks'

function DepartmentDetailPage() {
  const navigate = useNavigate()
  const { departmentId } = useParams()

  const departmentsQuery = useDepartments()
  const employeesQuery = useEmployees()

  const department = useMemo(() => {
    const id = Number(departmentId)
    if (Number.isNaN(id)) {
      return undefined
    }
    return (departmentsQuery.data?.data ?? []).find((item) => item.id === id)
  }, [departmentId, departmentsQuery.data])

  const employees = useMemo(() => {
    if (!department) {
      return []
    }
    return (employeesQuery.data?.data ?? []).filter((item) => item.department === department.name)
  }, [department, employeesQuery.data])

  if (departmentsQuery.isLoading || employeesQuery.isLoading) {
    return <p className="text-sm text-slate-500">Loading department details...</p>
  }

  if (!department) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="mb-4 text-sm text-slate-500">Department not found.</p>
          <Button variant="outline" onClick={() => navigate('/departments')}>
            Back to Departments
          </Button>
        </CardContent>
      </Card>
    )
  }

  const headEmployee = employees.find((item) => item.id === department.head_employee_id)

  return (
    <>
      <PageHeader
        title={department.name}
        subtitle={department.description || 'Department details'}
        extra={
          <Button variant="outline" onClick={() => navigate('/departments')}>
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Department Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Department</p>
              <p className="font-medium text-slate-900">{department.name}</p>
            </div>
            {headEmployee ? (
              <div
                className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/employees/${headEmployee.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/employees/${headEmployee.id}`)
                  }
                }}
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">Head</p>
                <p className="font-medium text-slate-900">{headEmployee.profile_name}</p>
              </div>
            ) : (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Head</p>
                <p className="font-medium text-slate-900">{department.head_employee_id ?? '-'}</p>
              </div>
            )}
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Members</p>
              <p className="font-medium text-slate-900">{employees.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <p className="text-sm text-slate-500">No employees found in this department.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {employees.map((employee) => (
                  <li
                    key={employee.id}
                    className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/employees/${employee.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate(`/employees/${employee.id}`)
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{employee.profile_name}</p>
                      <span className="text-slate-500">{employee.position}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default DepartmentDetailPage
