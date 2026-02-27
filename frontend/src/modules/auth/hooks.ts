import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '../../context/AuthContext'
import { getCurrentUser, login, logout, signup } from './api'
import type { LoginPayload, SignupPayload } from '../../types'

export function useLogin() {
  const { signIn } = useAuth()

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (response) => {
      signIn(response.data.access_token, response.data.user)
    },
  })
}

export function useSignup() {
  return useMutation({
    mutationFn: (payload: SignupPayload) => signup(payload),
  })
}

export function useLogout() {
  const { signOut } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      signOut()
      queryClient.clear()
    },
  })
}

export function useCurrentUser(enabled: boolean) {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    enabled,
  })
}
