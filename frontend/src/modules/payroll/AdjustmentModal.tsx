import { useState } from 'react'
import { Trash2 } from 'lucide-react'

import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select } from '../../components/ui/select'
import { Separator } from '../../components/ui/separator'
import {
  ADDITION_TYPES,
  ADJUSTMENT_TYPE_LABELS,
  DEDUCTION_TYPES,
  type AdjustmentType,
} from '../../types'
import { useAdjustmentItems, useCreateAdjustmentItem, useDeleteAdjustmentItem } from './hooks'

const ALL_TYPES: AdjustmentType[] = [
  'cash_advance',
  'sss_loan',
  'pagibig_loan',
  'other_deduction',
  'allowance',
  'bonus',
  'other_addition',
]

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface AdjustmentModalProps {
  open: boolean
  onClose: () => void
  employeeId: number
  employeeName: string
  cutoffStart: string
  cutoffEnd: string
}

export function AdjustmentModal({
  open,
  onClose,
  employeeId,
  employeeName,
  cutoffStart,
  cutoffEnd,
}: AdjustmentModalProps) {
  const itemsQuery = useAdjustmentItems({ cutoff_start: cutoffStart, cutoff_end: cutoffEnd, employee_id: employeeId })
  const createMutation = useCreateAdjustmentItem(cutoffStart, cutoffEnd)
  const deleteMutation = useDeleteAdjustmentItem(cutoffStart, cutoffEnd)

  const [type, setType] = useState<AdjustmentType>('cash_advance')
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [notes, setNotes] = useState('')

  const items = itemsQuery.data?.data ?? []

  const totalAdditions = items
    .filter((i) => ADDITION_TYPES.has(i.type))
    .reduce((sum, i) => sum + i.amount, 0)

  const totalDeductions = items
    .filter((i) => DEDUCTION_TYPES.has(i.type))
    .reduce((sum, i) => sum + i.amount, 0)

  const handleAdd = () => {
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) return

    createMutation.mutate(
      {
        employee_id: employeeId,
        cutoff_start: cutoffStart,
        cutoff_end: cutoffEnd,
        type,
        amount: parsedAmount,
        label: label.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setAmount('')
          setLabel('')
          setNotes('')
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adjustments — {employeeName}</DialogTitle>
          <p className="text-sm text-slate-500">
            Cutoff: {formatDate(cutoffStart)} – {formatDate(cutoffEnd)}
          </p>
        </DialogHeader>

        {/* Existing items */}
        <div className="max-h-64 overflow-y-auto space-y-1">
          {itemsQuery.isLoading && (
            <p className="text-sm text-slate-500">Loading…</p>
          )}
          {!itemsQuery.isLoading && items.length === 0 && (
            <p className="text-sm text-slate-400">No adjustments yet. Add one below.</p>
          )}
          {items.map((item) => {
            const isDeduction = DEDUCTION_TYPES.has(item.type)
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <Badge
                  variant="outline"
                  className={isDeduction ? 'border-red-300 text-red-600' : 'border-emerald-300 text-emerald-600'}
                >
                  {ADJUSTMENT_TYPE_LABELS[item.type]}
                </Badge>
                {item.label && (
                  <span className="flex-1 truncate text-slate-600">{item.label}</span>
                )}
                {!item.label && <span className="flex-1" />}
                <span className={`font-medium tabular-nums ${isDeduction ? 'text-red-600' : 'text-emerald-600'}`}>
                  {isDeduction ? '-' : '+'}{formatMoney(item.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(item.id)}
                  disabled={deleteMutation.isPending}
                  className="ml-1 text-slate-400 hover:text-red-500 disabled:opacity-40"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>

        {/* Totals */}
        {items.length > 0 && (
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm flex gap-4">
            <span className="text-emerald-600">+{formatMoney(totalAdditions)}</span>
            <span className="text-red-600">−{formatMoney(totalDeductions)}</span>
            <span className="ml-auto font-semibold">
              Net: {formatMoney(totalAdditions - totalDeductions)}
            </span>
          </div>
        )}

        <Separator />

        {/* Add form */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add Adjustment</p>

          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="mb-1 block text-xs">Type</Label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as AdjustmentType)}
              >
                <optgroup label="Deductions">
                  {ALL_TYPES.filter((t) => DEDUCTION_TYPES.has(t)).map((t) => (
                    <option key={t} value={t}>
                      {ADJUSTMENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Additions">
                  {ALL_TYPES.filter((t) => ADDITION_TYPES.has(t)).map((t) => (
                    <option key={t} value={t}>
                      {ADJUSTMENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </optgroup>
              </Select>
            </div>

            <div>
              <Label className="mb-1 block text-xs">Amount (₱)</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs">Label (optional)</Label>
              <Input
                placeholder="e.g. Apr advance"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <Label className="mb-1 block text-xs">Notes (optional)</Label>
              <Input
                placeholder="Any extra detail…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={handleAdd}
              disabled={createMutation.isPending || !amount || parseFloat(amount) <= 0}
            >
              {createMutation.isPending ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
