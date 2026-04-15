import { useEffect, useState, type ChangeEvent } from 'react'
import { AxiosError } from 'axios'
import { Download, Plus } from 'lucide-react'

import PageHeader from '../../components/shared/PageHeader'
import { TablePagination, TableToolbar } from '../../components/shared/TableControls'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { DatePicker } from '../../components/ui/date-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select } from '../../components/ui/select'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import type { AttendanceRecord, AttendanceRecordPayload, AttendanceRecordUpdatePayload } from '../../types'
import { useEmployees } from '../employees/hooks'
import { useAttendanceRecords, useCreateAttendanceRecord, useImportAttendance, useUpdateAttendanceRecord } from '../leave/hooks'
import { downloadAttendanceTemplate, type AttendanceTemplateFormat } from '../leave/api'

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

function AttendancePage() {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const canManageAttendance = user?.role === 'admin' || user?.role === 'hr_manager'

  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterEmployeeId, setFilterEmployeeId] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const attendanceRecordsQuery = useAttendanceRecords({
    employee_id: filterEmployeeId ? Number(filterEmployeeId) : undefined,
    date_from: filterDateFrom || undefined,
    date_to: filterDateTo || undefined,
    q: searchQuery || undefined,
    skip: (currentPage - 1) * pageSize,
    limit: pageSize,
  })
  const employeesQuery = useEmployees()
  const createAttendanceMutation = useCreateAttendanceRecord()
  const updateAttendanceMutation = useUpdateAttendanceRecord()
  const importAttendanceMutation = useImportAttendance()

  const [modalOpen, setModalOpen] = useState(false)
  const [attendanceEmployeeId, setAttendanceEmployeeId] = useState('')
  const [attendanceDate, setAttendanceDate] = useState('')
  const [attendanceAmIn, setAttendanceAmIn] = useState('')
  const [attendanceAmOut, setAttendanceAmOut] = useState('')
  const [attendancePmIn, setAttendancePmIn] = useState('')
  const [attendancePmOut, setAttendancePmOut] = useState('')
  const [attendanceNote, setAttendanceNote] = useState('')
  const [attendanceFormError, setAttendanceFormError] = useState<string | null>(null)
  const [editingAttendanceId, setEditingAttendanceId] = useState<number | null>(null)
  const [importSummary, setImportSummary] = useState<string | null>(null)
  const [downloadingTemplate, setDownloadingTemplate] = useState<AttendanceTemplateFormat | null>(null)

  const attendanceItems = attendanceRecordsQuery.data?.data.items ?? []
  const totalItems = attendanceRecordsQuery.data?.data.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const employeeOptions = employeesQuery.data?.data.items ?? []

  useEffect(() => {
    setCurrentPage(1)
  }, [filterEmployeeId, filterDateFrom, filterDateTo, searchQuery, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const resetAttendanceForm = () => {
    setAttendanceEmployeeId('')
    setAttendanceDate('')
    setAttendanceAmIn('')
    setAttendanceAmOut('')
    setAttendancePmIn('')
    setAttendancePmOut('')
    setAttendanceNote('')
    setAttendanceFormError(null)
    setEditingAttendanceId(null)
    setModalOpen(false)
  }

  const handleEditAttendance = (record: AttendanceRecord) => {
    setEditingAttendanceId(record.id)
    setAttendanceEmployeeId(String(record.employee_id))
    setAttendanceDate(record.date)
    setAttendanceAmIn(record.am_in ?? '')
    setAttendanceAmOut(record.am_out ?? '')
    setAttendancePmIn(record.pm_in ?? '')
    setAttendancePmOut(record.pm_out ?? '')
    setAttendanceNote(record.note ?? '')
    setAttendanceFormError(null)
    setModalOpen(true)
  }

  const handleSaveAttendance = () => {
    setAttendanceFormError(null)
    setImportSummary(null)

    if (canManageAttendance && !attendanceEmployeeId) {
      const message = 'Select an employee for attendance'
      setAttendanceFormError(message)
      showNotification(message)
      return
    }

    if (!attendanceDate) {
      const message = 'Attendance date is required'
      setAttendanceFormError(message)
      showNotification(message)
      return
    }

    const payloadBase = {
      am_in: attendanceAmIn || null,
      am_out: attendanceAmOut || null,
      pm_in: attendancePmIn || null,
      pm_out: attendancePmOut || null,
      note: attendanceNote || null,
    }

    if (editingAttendanceId) {
      const payload: AttendanceRecordUpdatePayload = payloadBase
      updateAttendanceMutation.mutate(
        { recordId: editingAttendanceId, payload },
        {
          onSuccess: () => {
            showNotification('Attendance record updated')
            resetAttendanceForm()
          },
          onError: (error) => {
            const message = extractErrorMessage(error, 'Unable to update attendance record')
            setAttendanceFormError(message)
            showNotification(message)
          },
        },
      )
      return
    }

    if (!attendanceEmployeeId) {
      const message = 'Employee is required'
      setAttendanceFormError(message)
      showNotification(message)
      return
    }

    const payload: AttendanceRecordPayload = {
      employee_id: Number(attendanceEmployeeId),
      date: attendanceDate,
      ...payloadBase,
    }

    createAttendanceMutation.mutate(payload, {
      onSuccess: () => {
        showNotification('Attendance record created')
        resetAttendanceForm()
      },
      onError: (error) => {
        const message = extractErrorMessage(error, 'Unable to create attendance record')
        setAttendanceFormError(message)
        showNotification(message)
      },
    })
  }

  const handleImportAttendanceFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      return
    }

    setAttendanceFormError(null)
    setImportSummary(null)

    importAttendanceMutation.mutate(selectedFile, {
      onSuccess: (response) => {
        const result = response.data
        const summary = `Imported: ${result.imported}, Updated: ${result.updated}, Skipped: ${result.skipped}`
        setImportSummary(summary)
        showNotification('Attendance import completed')
      },
      onError: (error) => {
        const message = extractErrorMessage(error, 'Unable to import attendance file')
        setAttendanceFormError(message)
        showNotification(message)
      },
    })

    event.target.value = ''
  }

  const handleDownloadTemplate = async (format: AttendanceTemplateFormat) => {
    try {
      setDownloadingTemplate(format)
      const blob = await downloadAttendanceTemplate(format)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = format === 'xlsx' ? 'attendance_template.xlsx' : 'attendance_template.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      showNotification(`Downloaded ${format.toUpperCase()} template`)
    } catch {
      showNotification('Unable to download template')
    } finally {
      setDownloadingTemplate(null)
    }
  }

  const isAttendanceLoading = attendanceRecordsQuery.isLoading

  const clearFilters = () => {
    setFilterEmployeeId('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setSearchQuery('')
  }

  return (
    <>
      <PageHeader title="Attendance" subtitle="Track employee attendance and import daily logs" />

      {/* Add / Edit Attendance Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) resetAttendanceForm() }}>
        <DialogContent hideOverlay className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAttendanceId ? 'Edit Attendance' : 'Add Attendance'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="mb-1 block text-xs text-slate-500">Employee</Label>
              <Select
                value={attendanceEmployeeId}
                onChange={(event) => setAttendanceEmployeeId(event.target.value)}
                disabled={!!editingAttendanceId}
              >
                <option value="">Select employee</option>
                {employeeOptions.map((employee) => (
                  <option key={employee.id} value={String(employee.id)}>
                    {employee.profile_name} ({employee.employee_code})
                  </option>
                ))}
              </Select>
            </div>

            <div className="col-span-2">
              <Label className="mb-1 block text-xs text-slate-500">Date</Label>
              <DatePicker value={attendanceDate} onChange={setAttendanceDate} placeholder="Select attendance date" />
            </div>

            <div>
              <Label className="mb-1 block text-xs text-slate-500">AM In</Label>
              <Input type="time" value={attendanceAmIn} onChange={(event) => setAttendanceAmIn(event.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block text-xs text-slate-500">AM Out</Label>
              <Input type="time" value={attendanceAmOut} onChange={(event) => setAttendanceAmOut(event.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block text-xs text-slate-500">PM In</Label>
              <Input type="time" value={attendancePmIn} onChange={(event) => setAttendancePmIn(event.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block text-xs text-slate-500">PM Out</Label>
              <Input type="time" value={attendancePmOut} onChange={(event) => setAttendancePmOut(event.target.value)} />
            </div>

            <div className="col-span-2">
              <Label className="mb-1 block text-xs text-slate-500">Note</Label>
              <Input value={attendanceNote} onChange={(event) => setAttendanceNote(event.target.value)} placeholder="Optional note" />
            </div>
          </div>

          {attendanceFormError ? <p className="mt-2 text-sm text-red-600">{attendanceFormError}</p> : null}

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={resetAttendanceForm}>Cancel</Button>
            <Button
              onClick={handleSaveAttendance}
              disabled={createAttendanceMutation.isPending || updateAttendanceMutation.isPending}
            >
              {editingAttendanceId ? 'Update' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Attendance Records</CardTitle>

          {canManageAttendance ? (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => { resetAttendanceForm(); setModalOpen(true) }}>
                <Plus className="mr-1 h-4 w-4" />
                Add Attendance
              </Button>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" disabled={downloadingTemplate !== null}>
                    <Download className="mr-1 h-4 w-4" />
                    {downloadingTemplate ? `Downloading…` : 'Template'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => void handleDownloadTemplate('csv')}>CSV Template</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleDownloadTemplate('xlsx')}>Excel Template</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <label className="inline-flex cursor-pointer items-center gap-1">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xlsm"
                  className="hidden"
                  onChange={handleImportAttendanceFile}
                  disabled={importAttendanceMutation.isPending}
                />
                <span className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                  <Download className="mr-1 h-4 w-4" />
                  {importAttendanceMutation.isPending ? 'Importing…' : 'Import'}
                </span>
              </label>
            </div>
          ) : null}
        </CardHeader>

        <CardContent>
          {importSummary ? <p className="mb-3 text-sm text-emerald-600">{importSummary}</p> : null}

          <TableToolbar
            searchPlaceholder="Search attendance..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />

          <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-4">
            <div>
              <Label className="mb-1 block text-xs text-slate-500">Employee</Label>
              <Select value={filterEmployeeId} onChange={(event) => setFilterEmployeeId(event.target.value)}>
                <option value="">All employees</option>
                {employeeOptions.map((employee) => (
                  <option key={employee.id} value={String(employee.id)}>
                    {employee.profile_name} ({employee.employee_code})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs text-slate-500">Date from</Label>
              <DatePicker value={filterDateFrom} onChange={setFilterDateFrom} placeholder="Start date" />
            </div>
            <div>
              <Label className="mb-1 block text-xs text-slate-500">Date to</Label>
              <DatePicker value={filterDateTo} onChange={setFilterDateTo} placeholder="End date" />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          {isAttendanceLoading ? <p className="text-sm text-slate-500">Loading attendance records…</p> : null}
          {!isAttendanceLoading && totalItems === 0 ? (
            <p className="text-sm text-slate-500">No attendance records found for the selected filters.</p>
          ) : null}

          {totalItems > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-52" />
                  <col className="w-28" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col className="w-20" />
                  <col />
                  <col className="w-24" />
                </colgroup>
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2">Employee</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">AM In</th>
                    <th className="py-2">AM Out</th>
                    <th className="py-2">PM In</th>
                    <th className="py-2">PM Out</th>
                    <th className="py-2">Note</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceItems.map((record) => (
                    <tr key={record.id} className="border-b align-top">
                      <td className="py-2 pr-2">{record.employee_name ?? record.employee_code ?? `#${record.employee_id}`}</td>
                      <td className="py-2 pr-2">{record.date}</td>
                      <td className="py-2 pr-2">{record.am_in || '—'}</td>
                      <td className="py-2 pr-2">{record.am_out || '—'}</td>
                      <td className="py-2 pr-2">{record.pm_in || '—'}</td>
                      <td className="py-2 pr-2">{record.pm_out || '—'}</td>
                      <td className="line-clamp-2 py-2 pr-2">{record.note || '—'}</td>
                      <td className="py-2 pr-2">
                        {canManageAttendance ? (
                          <Button size="sm" variant="outline" onClick={() => handleEditAttendance(record)}>
                            Edit
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {totalItems > 0 ? (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPrevious={() => setCurrentPage((current) => Math.max(1, current - 1))}
              onNext={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
            />
          ) : null}
        </CardContent>
      </Card>
    </>
  )
}

export default AttendancePage
