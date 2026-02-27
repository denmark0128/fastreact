import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  AdminSettingsUpdatePayload,
  CompanyProfileUpdatePayload,
  DepartmentCreatePayload,
  DepartmentUpdatePayload,
} from '../../types'
import {
  createDepartment,
  deleteDepartment,
  getAuditLogs,
  getAdminSettings,
  getCompanyProfile,
  getDepartments,
  updateAdminSettings,
  updateDepartment,
  updateCompanyProfile,
} from './api'

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DepartmentCreatePayload) => createDepartment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (departmentId: number) => deleteDepartment(departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ departmentId, payload }: { departmentId: number; payload: DepartmentUpdatePayload }) =>
      updateDepartment(departmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })
}

export function useCompanyProfile() {
  return useQuery({
    queryKey: ['company-profile'],
    queryFn: getCompanyProfile,
  })
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CompanyProfileUpdatePayload) => updateCompanyProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profile'] })
    },
  })
}

export function useAdminSettings(enabled = true) {
  return useQuery({
    queryKey: ['admin-settings'],
    queryFn: getAdminSettings,
    enabled,
  })
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AdminSettingsUpdatePayload) => updateAdminSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
    },
  })
}

export function useAuditLogs(
  params: {
    limit?: number
    offset?: number
    action?: string
    entity_type?: string
  },
  enabled = true,
) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => getAuditLogs(params),
    enabled,
  })
}
