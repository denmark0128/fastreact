import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PayrollProcessPayload } from '../../types'
import { getPayrollRecords, getPayrollSummary, processPayroll } from './api'

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
