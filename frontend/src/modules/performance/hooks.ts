import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PerformanceReviewPayload, PerformanceReviewUpdatePayload } from '../../types'
import { createPerformanceReview, deletePerformanceReview, getPerformanceReviews, updatePerformanceReview } from './api'

export function usePerformanceReviews() {
  return useQuery({
    queryKey: ['performance-reviews'],
    queryFn: getPerformanceReviews,
  })
}

export function useCreatePerformanceReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PerformanceReviewPayload) => createPerformanceReview(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['performance-reviews'] }),
  })
}

export function useUpdatePerformanceReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reviewId, payload }: { reviewId: number; payload: PerformanceReviewUpdatePayload }) =>
      updatePerformanceReview(reviewId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['performance-reviews'] }),
  })
}

export function useDeletePerformanceReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reviewId: number) => deletePerformanceReview(reviewId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['performance-reviews'] }),
  })
}
