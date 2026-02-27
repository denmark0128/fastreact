import axiosInstance from '../../api/axios'
import type { ApiResponse, AuthTokenData, AuthUser, ChangePasswordPayload, LoginPayload, SignupPayload, UserProfileUpdatePayload } from '../../types'

export async function login(payload: LoginPayload): Promise<ApiResponse<AuthTokenData>> {
  const response = await axiosInstance.post<ApiResponse<AuthTokenData>>('/auth/login', payload)
  return response.data
}

export async function signup(payload: SignupPayload): Promise<ApiResponse<AuthUser>> {
  const response = await axiosInstance.post<ApiResponse<AuthUser>>('/auth/signup', payload)
  return response.data
}

export async function logout(): Promise<ApiResponse<null>> {
  const response = await axiosInstance.post<ApiResponse<null>>('/auth/logout')
  return response.data
}

export async function getCurrentUser(): Promise<ApiResponse<AuthUser>> {
  const response = await axiosInstance.get<ApiResponse<AuthUser>>('/auth/me')
  return response.data
}

export async function updateCurrentUser(payload: UserProfileUpdatePayload): Promise<ApiResponse<AuthUser>> {
  const response = await axiosInstance.put<ApiResponse<AuthUser>>('/auth/me', payload)
  return response.data
}

export async function changePassword(payload: ChangePasswordPayload): Promise<ApiResponse<null>> {
  const response = await axiosInstance.put<ApiResponse<null>>('/auth/change-password', payload)
  return response.data
}
