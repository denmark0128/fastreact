import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ApplicationPayload, ApplicationUpdatePayload } from '../../types'
import type { JobPostingPayload, JobPostingUpdatePayload } from '../../types'
import {
  createApplication,
  createJobPosting,
  deleteJobPosting,
  getApplications,
  getJobPostings,
  updateApplication,
  updateJobPosting,
} from './api'
import type { ApplicationFilters } from './api'

export function useJobPostings() {
  return useQuery({
    queryKey: ['job-postings'],
    queryFn: () => getJobPostings(),
  })
}

export function useCreateJobPosting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: JobPostingPayload) => createJobPosting(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-postings'] }),
  })
}

export function useUpdateJobPosting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postingId, payload }: { postingId: number; payload: JobPostingUpdatePayload }) =>
      updateJobPosting(postingId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-postings'] }),
  })
}

export function useDeleteJobPosting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (postingId: number) => deleteJobPosting(postingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-postings'] }),
  })
}

export function useApplications(filters?: ApplicationFilters, enabled = true) {
  return useQuery({
    queryKey: ['applications', filters?.job_posting_id ?? 'all'],
    queryFn: () => getApplications(filters),
    enabled,
  })
}

export function useCreateApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ApplicationPayload) => createApplication(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  })
}

export function useUpdateApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId, payload }: { applicationId: number; payload: ApplicationUpdatePayload }) =>
      updateApplication(applicationId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  })
}
