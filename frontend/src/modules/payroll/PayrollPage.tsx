import { useMemo, useState } from 'react'

import PageHeader from '../../components/shared/PageHeader'
import { Alert } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { DatePicker } from '../../components/ui/date-picker'
import { useAuth } from '../../context/AuthContext'
import { ADDITION_TYPES, DEDUCTION_TYPES, type Employee } from '../../types'
import { useEmployees } from '../employees/hooks'
import { useAdjustmentItems, usePayrollRecords, usePayrollSummary, useProcessPayroll } from './hooks'
import { AdjustmentModal } from './AdjustmentModal'

function toIsoDate(value: Date) {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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
  const [modalEmployee, setModalEmployee] = useState<Employee | null>(null)

  const employeesQuery = useEmployees()
  const recordsQuery = usePayrollRecords({ cutoff_start: cutoffStart, cutoff_end: cutoffEnd })
  const summaryQuery = usePayrollSummary({ cutoff_start: cutoffStart, cutoff_end: cutoffEnd })
  const adjustmentItemsQuery = useAdjustmentItems({ cutoff_start: cutoffStart, cutoff_end: cutoffEnd })
  const processPayrollMutation = useProcessPayroll()

  const employees = employeesQuery.data?.data.items ?? []
  const records = recordsQuery.data?.data ?? []
  const summary = summaryQuery.data?.data
  const allAdjustmentItems = adjustmentItemsQuery.data?.data ?? []

  const editableEmployees = useMemo(
    () => employees.filter((emp) => ['active', 'probation'].includes(emp.employment_status.toLowerCase())),
    [employees],
  )

  // Build per-employee adjustment summaries
  const adjustmentsByEmployee = useMemo(() => {
    const map: Record<number, { count: number; totalAdditions: number; totalDeductions: number }> = {}
    for (const item of allAdjustmentItems) {
      if (!map[item.employee_id]) {
        map[item.employee_id] = { count: 0, totalAdditions: 0, totalDeductions: 0 }
      }
      map[item.employee_id].count++
      if (ADDITION_TYPES.has(item.type)) {
        map[item.employee_id].totalAdditions += item.amount
      } else if (DEDUCTION_TYPES.has(item.type)) {
        map[item.employee_id].totalDeductions += item.amount
      }
    }
    return map
  }, [allAdjustmentItems])
  const processCutoff = () => {
    processPayrollMutation.mutate({
      cutoff_start: cutoffStart,
      cutoff_end: cutoffEnd,
      pay_date: payDate,
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

        {/* Cutoff dates */}
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

        {/* Summary */}
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

        {/* Per-employee adjustments */}
        {canProcessPayroll ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Employee Adjustments</CardTitle>
              <p className="text-xs text-slate-500">
                Pre-save cash advances, allowances, loans, and bonuses per employee before processing.
                Stored items are automatically applied when you run Process Cutoff.
              </p>
            </CardHeader>
            <CardContent>
              {employeesQuery.isLoading ? (
                <p className="text-sm text-slate-500">Loading employees…</p>
              ) : editableEmployees.length === 0 ? (
                <p className="text-sm text-slate-500">No active employees found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="py-2 pr-4">Employee</th>
                        <th className="py-2 pr-4">Department</th>
                        <th className="py-2 pr-4">Items</th>
                        <th className="py-2 pr-4 text-right">Additions</th>
                        <th className="py-2 pr-4 text-right">Deductions</th>
                        <th className="py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {editableEmployees.map((emp) => {
                        const adj = adjustmentsByEmployee[emp.id]
                        return (
                          <tr key={emp.id} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">{emp.profile_name}</td>
                            <td className="py-2 pr-4 text-slate-500">{emp.department}</td>
                            <td className="py-2 pr-4">
                              {adj?.count ? (
                                <Badge variant="secondary">{adj.count} item{adj.count !== 1 ? 's' : ''}</Badge>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-2 pr-4 text-right tabular-nums text-emerald-600">
                              {adj?.totalAdditions ? formatMoney(adj.totalAdditions) : '—'}
                            </td>
                            <td className="py-2 pr-4 text-right tabular-nums text-red-600">
                              {adj?.totalDeductions ? formatMoney(adj.totalDeductions) : '—'}
                            </td>
                            <td className="py-2 text-right">
                              <Button size="sm" variant="outline" onClick={() => setModalEmployee(emp)}>
                                Adjust
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
                    <col className="w-20" />
                    <col className="w-20" />
                    <col className="w-20" />
                    <col className="w-28" />
                    <col className="w-28" />
                    <col className="w-28" />
                  </colgroup>
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="py-2">Employee</th>
                      <th className="py-2">Late</th>
                      <th className="py-2">UT</th>
                      <th className="py-2">OT</th>
                      <th className="py-2">Adj. Net</th>
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
                        <td className={`py-2 pr-2 tabular-nums text-xs ${record.allowances - record.other_deductions >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {record.allowances - record.other_deductions !== 0
                            ? formatMoney(record.allowances - record.other_deductions)
                            : '—'}
                        </td>
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

      {/* Adjustment modal */}
      {modalEmployee ? (
        <AdjustmentModal
          open={!!modalEmployee}
          onClose={() => setModalEmployee(null)}
          employeeId={modalEmployee.id}
          employeeName={modalEmployee.profile_name}
          cutoffStart={cutoffStart}
          cutoffEnd={cutoffEnd}
        />
      ) : null}
    </>
  )
}

export default PayrollPage
