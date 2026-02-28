import axiosInstance from '../../api/axios'
import type { ApiResponse, LeaveRequest, LeaveRequestList, LeaveRequestPayload, LeaveReviewPayload } from '../../types'

export interface LeaveRequestFilters {
	leave_status?: string
}

export async function getLeaveRequests(params?: LeaveRequestFilters): Promise<ApiResponse<LeaveRequestList>> {
	const response = await axiosInstance.get<ApiResponse<LeaveRequestList>>('/leave/requests', { params })
	return response.data
}

export async function createLeaveRequest(payload: LeaveRequestPayload): Promise<ApiResponse<LeaveRequest>> {
	const response = await axiosInstance.post<ApiResponse<LeaveRequest>>('/leave/requests', payload)
	return response.data
}

export async function reviewLeaveRequest(
	leaveRequestId: number,
	payload: LeaveReviewPayload,
): Promise<ApiResponse<LeaveRequest>> {
	const response = await axiosInstance.put<ApiResponse<LeaveRequest>>(`/leave/requests/${leaveRequestId}/review`, payload)
	return response.data
}

export async function cancelLeaveRequest(leaveRequestId: number): Promise<ApiResponse<LeaveRequest>> {
	const response = await axiosInstance.put<ApiResponse<LeaveRequest>>(`/leave/requests/${leaveRequestId}/cancel`)
	return response.data
}
