import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { EmployeePayload, EmployeeUpdatePayload } from '../../types'
import { createEmployee, deleteEmployee, getEmployees, updateEmployee } from './api'

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: EmployeePayload) => createEmployee(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ employeeId, payload }: { employeeId: number; payload: EmployeeUpdatePayload }) =>
      updateEmployee(employeeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeId: number) => deleteEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}
