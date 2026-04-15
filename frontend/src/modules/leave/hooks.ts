import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { AttendanceRecordPayload, AttendanceRecordUpdatePayload, LeaveRequestPayload, LeaveReviewPayload } from '../../types'
import {
  type AttendanceFilters,
  cancelLeaveRequest,
  createAttendanceRecord,
  createLeaveRequest,
  getAttendanceRecords,
  getLeaveRequests,
  importAttendanceFile,
  reviewLeaveRequest,
  updateAttendanceRecord,
} from './api'

export function useLeaveRequests() {
  return useQuery({
    queryKey: ['leave-requests'],
    queryFn: () => getLeaveRequests(),
  })
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LeaveRequestPayload) => createLeaveRequest(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leave-requests'] }),
  })
}

export function useReviewLeaveRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leaveRequestId, payload }: { leaveRequestId: number; payload: LeaveReviewPayload }) =>
      reviewLeaveRequest(leaveRequestId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leave-requests'] }),
  })
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (leaveRequestId: number) => cancelLeaveRequest(leaveRequestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leave-requests'] }),
  })
}

export function useAttendanceRecords(filters?: AttendanceFilters) {
  return useQuery({
    queryKey: ['attendance-records', filters],
    queryFn: () => getAttendanceRecords(filters),
  })
}

export function useCreateAttendanceRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AttendanceRecordPayload) => createAttendanceRecord(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-records'] }),
  })
}

export function useUpdateAttendanceRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ recordId, payload }: { recordId: number; payload: AttendanceRecordUpdatePayload }) =>
      updateAttendanceRecord(recordId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-records'] }),
  })
}

export function useImportAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => importAttendanceFile(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-records'] }),
  })
}
