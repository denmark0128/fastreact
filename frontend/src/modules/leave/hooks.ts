import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { LeaveRequestPayload, LeaveReviewPayload } from '../../types'
import { cancelLeaveRequest, createLeaveRequest, getLeaveRequests, reviewLeaveRequest } from './api'

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
