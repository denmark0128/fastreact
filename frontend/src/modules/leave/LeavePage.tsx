import { useMemo, useState } from 'react'
import { AxiosError } from 'axios'
import { SquarePen } from 'lucide-react'

import PageHeader from '../../components/shared/PageHeader'
import { TablePagination } from '../../components/shared/TableControls'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { DatePicker } from '../../components/ui/date-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Input } from '../../components/ui/input'
import Modal from '../../components/ui/modal'
import { Select } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import { useTableControls } from '../../lib/useTableControls'
import type { LeaveRequest, LeaveRequestPayload, LeaveStatus, LeaveType } from '../../types'
import { useEmployees } from '../employees/hooks'
import { useCancelLeaveRequest, useCreateLeaveRequest, useLeaveRequests, useReviewLeaveRequest } from './hooks'

type LeaveSortKey = 'leave_type' | 'start_date' | 'status' | 'employee_name'

type BaseLeaveType = 'vacation' | 'sick'
type CompensationType = 'paid' | 'unpaid'

const BASE_LEAVE_TYPES: BaseLeaveType[] = ['vacation', 'sick']

const LEAVE_STATUS: LeaveStatus[] = ['pending', 'approved', 'rejected', 'cancelled']

const statusStyle: Record<LeaveStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-slate-50 text-slate-600 border-slate-200',
}

function diffDays(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diff = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1)
}

function toTitleLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail
    if (typeof detail === 'string' && detail.trim()) {
      return detail
    }
    const message = (error.response?.data as { message?: string } | undefined)?.message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }
  return fallback
}

function LeavePage() {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const canReview = user?.role === 'admin' || user?.role === 'hr_manager'

  const leaveRequestsQuery = useLeaveRequests()
  const employeesQuery = useEmployees()
  const createLeaveMutation = useCreateLeaveRequest()
  const reviewLeaveMutation = useReviewLeaveRequest()
  const cancelLeaveMutation = useCancelLeaveRequest()

  const [baseLeaveType, setBaseLeaveType] = useState<BaseLeaveType>('vacation')
  const [compensationType, setCompensationType] = useState<CompensationType>('paid')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'all'>('all')
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

  const items = leaveRequestsQuery.data?.data.items ?? []
  const employeeOptions = employeesQuery.data?.data.items ?? []

  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') {
      return items
    }
    return items.filter((item) => item.status === statusFilter)
  }, [items, statusFilter])

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
    filteredAndSortedItems,
    paginatedItems,
  } = useTableControls<LeaveRequest, LeaveSortKey>({
    items: filteredItems,
    initialSortKey: 'start_date',
    searchableText: (record) =>
      [record.employee_name, record.leave_type, record.status, record.start_date, record.end_date, record.reason].join(' '),
    sortValue: (record, key) => record[key] ?? '',
  })

  const resetForm = () => {
    setBaseLeaveType('vacation')
    setCompensationType('paid')
    setStartDate('')
    setEndDate('')
    setReason('')
    setSelectedEmployeeId('')
    setFormError(null)
  }

  const handleCreate = () => {
    setFormError(null)

    if (canReview && !selectedEmployeeId) {
      const message = 'Select an employee'
      setFormError(message)
      showNotification(message)
      return
    }

    if (!startDate || !endDate) {
      const message = 'Start and end dates are required'
      setFormError(message)
      showNotification(message)
      return
    }

    const startDateValue = new Date(`${startDate}T00:00:00`)
    const endDateValue = new Date(`${endDate}T00:00:00`)

    if (endDateValue < startDateValue) {
      const message = 'End date cannot be earlier than start date'
      setFormError(message)
      showNotification(message)
      return
    }

    const resolvedLeaveType: LeaveType = compensationType === 'unpaid' ? 'unpaid' : baseLeaveType

    const payload: LeaveRequestPayload = {
      leave_type: resolvedLeaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason || undefined,
      ...(canReview && selectedEmployeeId ? { employee_id: Number(selectedEmployeeId) } : {}),
    }

    createLeaveMutation.mutate(payload, {
      onSuccess: () => {
        showNotification('Leave request submitted')
        resetForm()
        setIsRequestModalOpen(false)
      },
      onError: (error) => {
        const message = extractErrorMessage(error, 'Unable to submit leave request')
        setFormError(message)
        showNotification(message)
      },
    })
  }

  const handleReview = (leaveRequestId: number, nextStatus: LeaveStatus) => {
    reviewLeaveMutation.mutate(
      { leaveRequestId, payload: { status: nextStatus } },
      {
        onSuccess: () => showNotification('Leave request updated'),
      },
    )
  }

  const handleCancel = (leaveRequestId: number) => {
    cancelLeaveMutation.mutate(leaveRequestId, {
      onSuccess: () => showNotification('Leave request cancelled'),
    })
  }

  const isLoading = leaveRequestsQuery.isLoading
  const hasItems = filteredAndSortedItems.length > 0
  const allowEmployeeCancel = user?.role === 'employee'

  return (
    <>
      <PageHeader
        title="Leave"
        subtitle="Submit leave requests and track approval status"
        extra={
          <div className="flex items-center gap-2">
            {!canReview ? null : (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700" variant="secondary">
                HR access
              </Badge>
            )}
            <Button onClick={() => setIsRequestModalOpen(true)}>Request Time Off</Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Input
              placeholder="Search by employee, type, or notes"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="md:max-w-sm"
            />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as LeaveStatus | 'all')}
                className="md:w-44"
              >
                <option value="all">All statuses</option>
                {LEAVE_STATUS.map((status) => (
                  <option key={status} value={status}>
                    {toTitleLabel(status)}
                  </option>
                ))}
              </Select>
              <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                <span className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">Rows per page</span>
                <Select value={String(pageSize)} onChange={(event) => setPageSize(Number(event.target.value))} className="w-24">
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? <p className="text-sm text-slate-500">Loading leave requests...</p> : null}
          {!isLoading && !hasItems ? <p className="text-sm text-slate-500">No leave requests yet.</p> : null}

          {hasItems ? (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-44" />
                  <col className="w-28" />
                  <col className="w-40" />
                  <col className="w-16" />
                  <col className="w-28" />
                  <col />
                  <col className="w-20" />
                </colgroup>
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600" onClick={() => toggleSort('employee_name')}>
                        Employee {sortIndicator('employee_name')}
                      </Button>
                    </th>
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600" onClick={() => toggleSort('leave_type')}>
                        Type {sortIndicator('leave_type')}
                      </Button>
                    </th>
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600" onClick={() => toggleSort('start_date')}>
                        Dates {sortIndicator('start_date')}
                      </Button>
                    </th>
                    <th className="py-2">Days</th>
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600" onClick={() => toggleSort('status')}>
                        Status {sortIndicator('status')}
                      </Button>
                    </th>
                    <th className="py-2">Notes</th>
                    <th className="w-20 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((request) => (
                    <tr key={request.id} className="border-b align-top">
                      <td className="truncate py-2 pr-2">{request.employee_name ?? '—'}</td>
                      <td className="truncate py-2 pr-2 capitalize">{request.leave_type.replace('_', ' ')}</td>
                      <td className="py-2 pr-2">
                        <div className="flex flex-col">
                          <span>{request.start_date}</span>
                          <span className="text-xs text-slate-500">to {request.end_date}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-2 text-slate-700">{diffDays(request.start_date, request.end_date)}</td>
                      <td className="py-2 pr-2">
                        <Badge className={`${statusStyle[request.status]} border capitalize transition-colors`}>
                          {request.status}
                        </Badge>
                      </td>
                      <td className="py-2 pr-2">
                        <p className="line-clamp-3 whitespace-pre-wrap text-slate-700">{request.reason || '—'}</p>
                        {request.review_note ? <p className="mt-1 text-xs text-slate-500">Reviewer note: {request.review_note}</p> : null}
                      </td>
                      <td className="w-20 py-2 pr-2">
                        <div className="flex flex-col items-start gap-2">
                          {canReview && request.status === 'pending' ? (
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-9 px-0"
                                  disabled={reviewLeaveMutation.isPending}
                                  aria-label="Open actions"
                                >
                                  <SquarePen className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleReview(request.id, 'approved')}>Approve</DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 focus:bg-red-50 focus:text-red-700"
                                  onClick={() => handleReview(request.id, 'rejected')}
                                >
                                  Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}

                          {allowEmployeeCancel && request.status === 'pending' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancel(request.id)}
                              disabled={cancelLeaveMutation.isPending}
                            >
                              Cancel request
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {hasItems ? (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredAndSortedItems.length}
              onPageChange={setCurrentPage}
              onPrevious={() => setCurrentPage((current) => Math.max(1, current - 1))}
              onNext={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
            />
          ) : null}
        </CardContent>
      </Card>

      <Modal open={isRequestModalOpen} title="Request Time Off" onClose={() => setIsRequestModalOpen(false)}>
        <div className="space-y-3">
          {canReview ? (
            <div>
              <p className="mb-1 text-xs text-slate-500">Employee</p>
              <Select value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)}>
                <option value="">Select employee</option>
                {employeeOptions.map((employee) => (
                  <option key={employee.id} value={String(employee.id)}>
                    {employee.profile_name} ({employee.employee_code})
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          <div>
            <p className="mb-1 text-xs text-slate-500">Leave Category</p>
            <Select value={baseLeaveType} onChange={(event) => setBaseLeaveType(event.target.value as BaseLeaveType)}>
              {BASE_LEAVE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {toTitleLabel(type.replace('_', ' '))}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500">Compensation</p>
            <Select value={compensationType} onChange={(event) => setCompensationType(event.target.value as CompensationType)}>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs text-slate-500">Start Date</p>
              <DatePicker value={startDate} onChange={setStartDate} />
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-500">End Date</p>
              <DatePicker value={endDate} onChange={setEndDate} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500">Reason (optional)</p>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="Family event, medical leave, etc."
            />
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={createLeaveMutation.isPending}>
            {createLeaveMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        </div>
      </Modal>
    </>
  )
}

export default LeavePage
