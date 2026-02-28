import { useMemo, useState } from 'react'

import PageHeader from '../../components/shared/PageHeader'
import { Alert } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { DatePicker } from '../../components/ui/date-picker'
import { Input } from '../../components/ui/input'
import { useAuth } from '../../context/AuthContext'
import { useEmployees } from '../employees/hooks'
import { usePayrollRecords, usePayrollSummary, useProcessPayroll } from './hooks'

type AdjustmentValue = {
  actual_minutes?: string
  late_minutes?: string
  overtime_minutes?: string
  allowances?: string
  other_deductions?: string
  notes?: string
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value)
}

function PayrollPage() {
  const { user } = useAuth()
  const canProcessPayroll = user?.role === 'admin' || user?.role === 'hr_manager'

  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthMid = new Date(today.getFullYear(), today.getMonth(), 15)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const [cutoffStart, setCutoffStart] = useState(toIsoDate(monthStart))
  const [cutoffEnd, setCutoffEnd] = useState(toIsoDate(monthMid))
  const [payDate, setPayDate] = useState(toIsoDate(monthEnd))
  const [adjustments, setAdjustments] = useState<Record<number, AdjustmentValue>>({})

  const employeesQuery = useEmployees()
  const recordsQuery = usePayrollRecords({ cutoff_start: cutoffStart, cutoff_end: cutoffEnd })
  const summaryQuery = usePayrollSummary({ cutoff_start: cutoffStart, cutoff_end: cutoffEnd })
  const processPayrollMutation = useProcessPayroll()

  const employees = employeesQuery.data?.data.items ?? []
  const records = recordsQuery.data?.data ?? []
  const summary = summaryQuery.data?.data

  const editableEmployees = useMemo(
    () => employees.filter((employee) => ['active', 'probation'].includes(employee.employment_status.toLowerCase())),
    [employees],
  )

  const handleAdjustmentChange = (employeeId: number, key: keyof AdjustmentValue, value: string) => {
    setAdjustments((current) => ({
      ...current,
      [employeeId]: {
        ...current[employeeId],
        [key]: value,
      },
    }))
  }

  const parseNumber = (value?: string) => {
    if (!value?.trim()) {
      return undefined
    }
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  const processCutoff = () => {
    const adjustmentPayload = Object.entries(adjustments)
      .map(([employeeId, values]) => {
        const actualMinutes = parseNumber(values.actual_minutes)
        const lateMinutes = parseNumber(values.late_minutes)
        const overtimeMinutes = parseNumber(values.overtime_minutes)
        const allowances = parseNumber(values.allowances)
        const otherDeductions = parseNumber(values.other_deductions)
        const notes = values.notes?.trim() || undefined

        const hasInput =
          actualMinutes !== undefined ||
          lateMinutes !== undefined ||
          overtimeMinutes !== undefined ||
          allowances !== undefined ||
          otherDeductions !== undefined ||
          notes !== undefined

        if (!hasInput) {
          return null
        }

        return {
          employee_id: Number(employeeId),
          actual_minutes: actualMinutes,
          late_minutes: lateMinutes ?? 0,
          overtime_minutes: overtimeMinutes ?? 0,
          allowances: allowances ?? 0,
          other_deductions: otherDeductions ?? 0,
          notes,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    processPayrollMutation.mutate({
      cutoff_start: cutoffStart,
      cutoff_end: cutoffEnd,
      pay_date: payDate,
      adjustments: adjustmentPayload,
    })
  }

  return (
    <>
      <PageHeader title="Payroll" subtitle="Cutoff-based payroll with late, undertime, and overtime computation" />

      <div className="space-y-4">
        {!canProcessPayroll ? (
          <Alert className="border-sky-200 bg-sky-50 text-sky-700">
            Read-only access: only Admin and HR Manager can process payroll cutoffs.
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payroll Cutoff</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <p className="mb-1 text-xs text-slate-500">Cutoff Start</p>
              <DatePicker value={cutoffStart} onChange={setCutoffStart} />
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-500">Cutoff End</p>
              <DatePicker value={cutoffEnd} onChange={setCutoffEnd} />
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-500">Pay Date</p>
              <DatePicker value={payDate} onChange={setPayDate} />
            </div>
            <div className="flex items-end justify-end">
              {canProcessPayroll ? (
                <Button onClick={processCutoff} disabled={processPayrollMutation.isPending}>
                  {processPayrollMutation.isPending ? 'Processing...' : 'Process Cutoff'}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Gross</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatMoney(summary?.total_gross_pay ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Net</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatMoney(summary?.total_net_pay ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Minutes (Late / UT / OT)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">
                {(summary?.total_late_minutes ?? 0)} / {(summary?.total_undertime_minutes ?? 0)} / {(summary?.total_overtime_minutes ?? 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {canProcessPayroll ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Employee Adjustments (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse text-sm">
                  <colgroup>
                    <col className="w-40" />
                    <col className="w-32" />
                    <col className="w-24" />
                    <col className="w-24" />
                    <col className="w-28" />
                    <col className="w-28" />
                    <col className="w-52" />
                  </colgroup>
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="py-2">Employee</th>
                      <th className="py-2">Actual Mins</th>
                      <th className="py-2">Late</th>
                      <th className="py-2">OT</th>
                      <th className="py-2">Allowance</th>
                      <th className="py-2">Deduction</th>
                      <th className="py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editableEmployees.map((employee) => {
                      const values = adjustments[employee.id] ?? {}
                      return (
                        <tr key={employee.id} className="border-b">
                          <td className="truncate py-2 pr-2">{employee.profile_name}</td>
                          <td className="py-2 pr-2">
                            <Input
                              value={values.actual_minutes ?? ''}
                              onChange={(event) => handleAdjustmentChange(employee.id, 'actual_minutes', event.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <Input
                              value={values.late_minutes ?? ''}
                              onChange={(event) => handleAdjustmentChange(employee.id, 'late_minutes', event.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <Input
                              value={values.overtime_minutes ?? ''}
                              onChange={(event) => handleAdjustmentChange(employee.id, 'overtime_minutes', event.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <Input
                              value={values.allowances ?? ''}
                              onChange={(event) => handleAdjustmentChange(employee.id, 'allowances', event.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <Input
                              value={values.other_deductions ?? ''}
                              onChange={(event) => handleAdjustmentChange(employee.id, 'other_deductions', event.target.value)}
                              placeholder="0"
                            />
                          </td>
                          <td className="py-2">
                            <Input
                              value={values.notes ?? ''}
                              onChange={(event) => handleAdjustmentChange(employee.id, 'notes', event.target.value)}
                              placeholder="Optional"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Processed Payroll Records</CardTitle>
          </CardHeader>
          <CardContent>
            {recordsQuery.isLoading ? <p className="text-sm text-slate-500">Loading payroll records...</p> : null}
            {!recordsQuery.isLoading && records.length === 0 ? <p className="text-sm text-slate-500">No records for this cutoff.</p> : null}

            {records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse text-sm">
                  <colgroup>
                    <col className="w-44" />
                    <col className="w-24" />
                    <col className="w-24" />
                    <col className="w-24" />
                    <col className="w-32" />
                    <col className="w-32" />
                  </colgroup>
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="py-2">Employee</th>
                      <th className="py-2">Late</th>
                      <th className="py-2">UT</th>
                      <th className="py-2">OT</th>
                      <th className="py-2">Gross</th>
                      <th className="py-2">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b">
                        <td className="truncate py-2 pr-2">{record.profile_name}</td>
                        <td className="py-2 pr-2">{record.late_minutes}</td>
                        <td className="py-2 pr-2">{record.undertime_minutes}</td>
                        <td className="py-2 pr-2">{record.overtime_minutes}</td>
                        <td className="py-2 pr-2">{formatMoney(record.gross_pay)}</td>
                        <td className="py-2">{formatMoney(record.net_pay)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default PayrollPage
