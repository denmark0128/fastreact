import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PageHeader from '../../components/shared/PageHeader'
import { TablePagination, TableToolbar } from '../../components/shared/TableControls'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import Modal from '../../components/ui/modal'
import { useAuth } from '../../context/AuthContext'
import { useTableControls } from '../../lib/useTableControls'
import type { Employee, EmployeePayload } from '../../types'
import { SquarePen } from 'lucide-react'
import { useAdminSettings, useDepartments } from '../settings/hooks'
import EmployeeForm from './EmployeeForm'
import { useCreateEmployee, useDeleteEmployee, useEmployees, useUpdateEmployee } from './hooks'
import { getEmploymentStatusBadgeVariant, getEmploymentStatusLabel } from './status'

type EmployeeSortKey = 'employee_code' | 'profile_name' | 'department' | 'position' | 'employment_status'

function EmployeesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canManageEmployees = user?.role === 'admin' || user?.role === 'hr_manager'

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  const employeesQuery = useEmployees()
  const departmentsQuery = useDepartments()
  const adminSettingsQuery = useAdminSettings(canManageEmployees)
  const createEmployeeMutation = useCreateEmployee()
  const updateEmployeeMutation = useUpdateEmployee()
  const deleteEmployeeMutation = useDeleteEmployee()

  const employees = employeesQuery.data?.data ?? []
  const departmentOptions = (departmentsQuery.data?.data ?? []).map((department) => department.name)
  const scheduleTemplate = useMemo(() => {
    const defaultShiftStart = adminSettingsQuery.data?.data?.default_shift_start || '09:00'
    const defaultShiftEnd = adminSettingsQuery.data?.data?.default_shift_end || '18:00'
    const shiftValue = `${defaultShiftStart}-${defaultShiftEnd}`
    const defaultWorkDays = adminSettingsQuery.data?.data?.default_work_days || 'monday-friday'

    const template: Record<string, string> = {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: '',
    }

    const workingDays =
      defaultWorkDays === 'monday-saturday'
        ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

    workingDays.forEach((day) => {
      template[day] = shiftValue
    })

    return template
  }, [adminSettingsQuery.data?.data?.default_shift_start, adminSettingsQuery.data?.data?.default_shift_end, adminSettingsQuery.data?.data?.default_work_days])

  const {
    searchQuery,
    setSearchQuery,
    toggleSort,
    sortIndicator,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredAndSortedItems: filteredAndSortedEmployees,
    paginatedItems: paginatedEmployees,
  } = useTableControls<Employee, EmployeeSortKey>({
    items: employees,
    initialSortKey: 'profile_name',
    searchableText: (record) =>
      [record.employee_code, record.profile_name, record.department, record.position, record.employment_status].join(' '),
    sortValue: (record, key) => record[key],
  })

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingEmployee(null)
  }

  const onCreateClick = () => {
    setEditingEmployee(null)
    setIsModalOpen(true)
  }

  const onEditClick = (employee: Employee) => {
    setEditingEmployee(employee)
    setIsModalOpen(true)
  }

  const handleSubmit = (payload: EmployeePayload) => {
    if (editingEmployee) {
      updateEmployeeMutation.mutate(
        {
          employeeId: editingEmployee.id,
          payload: {
            biometric_id: payload.biometric_id,
            profile_name: payload.profile_name,
            department: payload.department,
            position: payload.position,
            employment_status: payload.employment_status,
            employment_type: payload.employment_type,
            rate_type: payload.rate_type,
            rate_amount: payload.rate_amount,
          },
        },
        { onSuccess: closeModal },
      )
      return
    }

    createEmployeeMutation.mutate(payload, { onSuccess: closeModal })
  }

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Manage employee profiles, departments, and employment status"
        extra={canManageEmployees ? <Button onClick={onCreateClick}>Add Employee</Button> : null}
      />

      <Card>
        <CardContent>
          <TableToolbar
            searchPlaceholder="Search employees..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />

          {employeesQuery.isLoading ? <p className="text-sm text-slate-500">Loading employees...</p> : null}

          {!employeesQuery.isLoading && filteredAndSortedEmployees.length === 0 ? (
            <p className="text-sm text-slate-500">No employees yet. Click "Add Employee" to create one.</p>
          ) : null}

          {filteredAndSortedEmployees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-28" />
                  <col className="w-52" />
                  <col className="w-44" />
                  <col className="w-44" />
                  <col className="w-28" />
                  <col className="w-40" />
                </colgroup>
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600" onClick={() => toggleSort('employee_code')}>
                        Code {sortIndicator('employee_code')}
                      </Button>
                    </th>
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600" onClick={() => toggleSort('profile_name')}>
                        Name {sortIndicator('profile_name')}
                      </Button>
                    </th>
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600" onClick={() => toggleSort('department')}>
                        Department {sortIndicator('department')}
                      </Button>
                    </th>
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600" onClick={() => toggleSort('position')}>
                        Position {sortIndicator('position')}
                      </Button>
                    </th>
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600" onClick={() => toggleSort('employment_status')}>
                        Status {sortIndicator('employment_status')}
                      </Button>
                    </th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map((record) => (
                    <tr
                      key={record.id}
                      className="cursor-pointer border-b transition-colors hover:bg-slate-50"
                      onClick={() => navigate(`/employees/${record.id}`)}
                    >
                      <td className="truncate py-2 pr-2">{record.employee_code}</td>
                      <td className="truncate py-2 pr-2">{record.profile_name}</td>
                      <td className="truncate py-2 pr-2">{record.department}</td>
                      <td className="truncate py-2 pr-2">{record.position}</td>
                      <td className="py-2">
                        <Badge variant={getEmploymentStatusBadgeVariant(record.employment_status)}>
                          {getEmploymentStatusLabel(record.employment_status)}
                        </Badge>
                      </td>
                      <td className="py-2">
                        {canManageEmployees ? (
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(event) => event.stopPropagation()}
                                aria-label="Open actions"
                              >
                                <SquarePen className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                              <DropdownMenuItem onClick={() => onEditClick(record)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:bg-red-50 focus:text-red-700"
                                disabled={deleteEmployeeMutation.isPending}
                                onClick={() => {
                                  if (window.confirm('Delete this employee?')) {
                                    deleteEmployeeMutation.mutate(record.id)
                                  }
                                }}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {filteredAndSortedEmployees.length > 0 ? (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredAndSortedEmployees.length}
              onPrevious={() => setCurrentPage((current) => Math.max(1, current - 1))}
              onNext={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
            />
          ) : null}
        </CardContent>
      </Card>

      {canManageEmployees ? (
        <Modal open={isModalOpen} title={editingEmployee ? 'Update Employee' : 'Create Employee'} onClose={closeModal}>
          <EmployeeForm
            initialEmployee={editingEmployee ?? undefined}
            departmentOptions={departmentOptions}
            scheduleTemplate={scheduleTemplate}
            onSubmit={handleSubmit}
            loading={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
          />
        </Modal>
      ) : null}
    </>
  )
}

export default EmployeesPage
