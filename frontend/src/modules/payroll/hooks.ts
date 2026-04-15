import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { AdjustmentItemCreate, PayrollProcessPayload } from '../../types'
import { createAdjustmentItem, deleteAdjustmentItem, getAdjustmentItems, getPayrollRecords, getPayrollSummary, processPayroll } from './api'

export function usePayrollRecords(params?: { cutoff_start?: string; cutoff_end?: string; employee_id?: number }) {
  return useQuery({
    queryKey: ['payroll-records', params?.cutoff_start, params?.cutoff_end, params?.employee_id],
    queryFn: () => getPayrollRecords(params),
  })
}

export function usePayrollSummary(params?: { cutoff_start?: string; cutoff_end?: string; employee_id?: number }) {
  return useQuery({
    queryKey: ['payroll-summary', params?.cutoff_start, params?.cutoff_end, params?.employee_id],
    queryFn: () => getPayrollSummary(params),
  })
}

export function useProcessPayroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PayrollProcessPayload) => processPayroll(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] })
      queryClient.invalidateQueries({ queryKey: ['payroll-summary'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Adjustment item hooks
// ---------------------------------------------------------------------------

export function useAdjustmentItems(params: { cutoff_start: string; cutoff_end: string; employee_id?: number }) {
  return useQuery({
    queryKey: ['payroll-adjustments', params.cutoff_start, params.cutoff_end, params.employee_id],
    queryFn: () => getAdjustmentItems(params),
    enabled: !!(params.cutoff_start && params.cutoff_end),
  })
}

export function useCreateAdjustmentItem(cutoff_start: string, cutoff_end: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AdjustmentItemCreate) => createAdjustmentItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-adjustments', cutoff_start, cutoff_end] })
    },
  })
}

export function useDeleteAdjustmentItem(cutoff_start: string, cutoff_end: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: number) => deleteAdjustmentItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-adjustments', cutoff_start, cutoff_end] })
    },
  })
}
