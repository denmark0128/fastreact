import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import PageHeader from '../../components/shared/PageHeader'
import { TablePagination, TableToolbar } from '../../components/shared/TableControls'
import { Alert } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import Modal from '../../components/ui/modal'
import { Select } from '../../components/ui/select'
import { useAuth } from '../../context/AuthContext'
import { useTableControls } from '../../lib/useTableControls'
import type { Department, DepartmentCreatePayload, DepartmentUpdatePayload } from '../../types'
import { SquarePen } from 'lucide-react'
import { useEmployees } from '../employees/hooks'
import { useCreateDepartment, useDeleteDepartment, useDepartments, useUpdateDepartment } from '../settings/hooks'

type DepartmentSortKey = 'name' | 'description' | 'head_employee_id'

const departmentSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
  description: z.string().optional(),
  head_employee_id: z.string().optional(),
})

type DepartmentFormValues = z.infer<typeof departmentSchema>

function DepartmentsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canManageDepartments = user?.role === 'admin' || user?.role === 'hr_manager'

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

  const departmentsQuery = useDepartments()
  const employeesQuery = useEmployees()
  const createDepartmentMutation = useCreateDepartment()
  const updateDepartmentMutation = useUpdateDepartment()
  const deleteDepartmentMutation = useDeleteDepartment()

  const departments = useMemo(() => departmentsQuery.data?.data ?? [], [departmentsQuery.data])
  const employeeOptions = useMemo(() => employeesQuery.data?.data ?? [], [employeesQuery.data])

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
    filteredAndSortedItems: filteredAndSortedDepartments,
    paginatedItems: paginatedDepartments,
  } = useTableControls<(typeof departments)[number], DepartmentSortKey>({
    items: departments,
    initialSortKey: 'name',
    searchableText: (department) =>
      [department.name, department.description ?? '', String(department.head_employee_id ?? '')].join(' '),
    sortValue: (department, key) => department[key],
  })

  const { control, handleSubmit, reset } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      description: '',
      head_employee_id: '',
    },
  })

  const onCreateDepartment = (values: DepartmentFormValues) => {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      head_employee_id: values.head_employee_id ? Number(values.head_employee_id) : undefined,
    }

    if (editingDepartment) {
      updateDepartmentMutation.mutate(
        {
          departmentId: editingDepartment.id,
          payload: payload as DepartmentUpdatePayload,
        },
        {
          onSuccess: () => {
            reset()
            setEditingDepartment(null)
            setIsModalOpen(false)
          },
        },
      )
      return
    }

    createDepartmentMutation.mutate(payload as DepartmentCreatePayload, {
      onSuccess: () => {
        reset()
        setEditingDepartment(null)
        setIsModalOpen(false)
      },
    })
  }

  const openCreateModal = () => {
    setEditingDepartment(null)
    reset({
      name: '',
      description: '',
      head_employee_id: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (department: Department) => {
    setEditingDepartment(department)
    reset({
      name: department.name,
      description: department.description ?? '',
      head_employee_id: department.head_employee_id ? String(department.head_employee_id) : '',
    })
    setIsModalOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Departments"
        subtitle="Manage departments and assign department heads"
        extra={canManageDepartments ? <Button onClick={openCreateModal}>Add Department</Button> : null}
      />

      <Card>
        <CardContent>
          {!canManageDepartments ? (
            <Alert className="mb-4 border-sky-200 bg-sky-50 text-sky-700">
              Read-only access: only Admin and HR Manager can create or delete departments.
            </Alert>
          ) : null}

          <TableToolbar
            searchPlaceholder="Search departments..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />

          {departmentsQuery.isLoading ? <p className="text-sm text-slate-500">Loading departments...</p> : null}

          {!departmentsQuery.isLoading && filteredAndSortedDepartments.length === 0 ? (
            <p className="text-sm text-slate-500">No departments yet.</p>
          ) : null}

          {filteredAndSortedDepartments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-56" />
                  <col className="w-80" />
                  <col className="w-36" />
                  <col className="w-32" />
                </colgroup>
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600" onClick={() => toggleSort('name')}>
                        Name {sortIndicator('name')}
                      </Button>
                    </th>
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600" onClick={() => toggleSort('description')}>
                        Description {sortIndicator('description')}
                      </Button>
                    </th>
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600" onClick={() => toggleSort('head_employee_id')}>
                        Head Employee ID {sortIndicator('head_employee_id')}
                      </Button>
                    </th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDepartments.map((department) => (
                    <tr
                      key={department.id}
                      className="cursor-pointer border-b transition-colors hover:bg-slate-50"
                      onClick={() => navigate(`/departments/${department.id}`)}
                    >
                      <td className="truncate py-2 pr-2">{department.name}</td>
                      <td className="truncate py-2 pr-2">{department.description || '-'}</td>
                      <td className="py-2">{department.head_employee_id ?? '-'}</td>
                      <td className="py-2">
                        {canManageDepartments ? (
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
                              <DropdownMenuItem onClick={() => openEditModal(department)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:bg-red-50 focus:text-red-700"
                                disabled={deleteDepartmentMutation.isPending}
                                onClick={() => {
                                  if (window.confirm('Delete this department?')) {
                                    deleteDepartmentMutation.mutate(department.id)
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

          {filteredAndSortedDepartments.length > 0 ? (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredAndSortedDepartments.length}
              onPrevious={() => setCurrentPage((current) => Math.max(1, current - 1))}
              onNext={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
            />
          ) : null}
        </CardContent>
      </Card>

      {canManageDepartments ? (
        <Modal
          open={isModalOpen}
          title={editingDepartment ? 'Update Department' : 'Create Department'}
          onClose={() => {
            setIsModalOpen(false)
            setEditingDepartment(null)
          }}
        >
          <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit(onCreateDepartment)}>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="mb-3 text-sm font-semibold text-slate-900">Department Information</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Controller
                  name="name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-1">
                      <Label>Department Name</Label>
                      <Input {...field} placeholder="Engineering" />
                      {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                    </div>
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1">
                      <Label>Description</Label>
                      <Input {...field} placeholder="Department description" />
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="rounded-md border border-slate-200 p-3">
              <p className="mb-3 text-sm font-semibold text-slate-900">Assignment</p>
              <Controller
                name="head_employee_id"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label>Department Head</Label>
                    <Select value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value)}>
                      <option value="">Select department head</option>
                      {employeeOptions.map((employee) => (
                        <option key={employee.id} value={String(employee.id)}>
                          {employee.profile_name} ({employee.employee_code})
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" disabled={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}>
                {createDepartmentMutation.isPending || updateDepartmentMutation.isPending
                  ? editingDepartment
                    ? 'Saving...'
                    : 'Adding...'
                  : editingDepartment
                    ? 'Save Department'
                    : 'Add Department'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  )
}

export default DepartmentsPage
