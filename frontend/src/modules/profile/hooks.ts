import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ChangePasswordPayload, UserProfileUpdatePayload } from '../../types'
import { changePassword, getCurrentUser, updateCurrentUser } from '../auth/api'

export function useMyProfile() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
  })
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UserProfileUpdatePayload) => updateCurrentUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
  })
}
