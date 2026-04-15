import axiosInstance from '../../api/axios'
import type {
	ApiResponse,
	AttendanceImportResult,
	AttendanceRecord,
	AttendanceRecordList,
	AttendanceRecordPayload,
	AttendanceRecordUpdatePayload,
	LeaveRequest,
	LeaveRequestList,
	LeaveRequestPayload,
	LeaveReviewPayload,
} from '../../types'

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

export interface AttendanceFilters {
	employee_id?: number
	date_from?: string
	date_to?: string
	q?: string
	skip?: number
	limit?: number
}

export type AttendanceTemplateFormat = 'csv' | 'xlsx'

export async function getAttendanceRecords(params?: AttendanceFilters): Promise<ApiResponse<AttendanceRecordList>> {
	const response = await axiosInstance.get<ApiResponse<AttendanceRecordList>>('/attendance/records', { params })
	return response.data
}

export async function createAttendanceRecord(payload: AttendanceRecordPayload): Promise<ApiResponse<AttendanceRecord>> {
	const response = await axiosInstance.post<ApiResponse<AttendanceRecord>>('/attendance/records', payload)
	return response.data
}

export async function updateAttendanceRecord(
	recordId: number,
	payload: AttendanceRecordUpdatePayload,
): Promise<ApiResponse<AttendanceRecord>> {
	const response = await axiosInstance.put<ApiResponse<AttendanceRecord>>(`/attendance/records/${recordId}`, payload)
	return response.data
}

export async function importAttendanceFile(file: File): Promise<ApiResponse<AttendanceImportResult>> {
	const formData = new FormData()
	formData.append('file', file)

	const response = await axiosInstance.post<ApiResponse<AttendanceImportResult>>('/attendance/records/import', formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
	})

	return response.data
}

export async function downloadAttendanceTemplate(format: AttendanceTemplateFormat): Promise<Blob> {
	const response = await axiosInstance.get('/attendance/records/template', {
		params: { format },
		responseType: 'blob',
	})

	return response.data as Blob
}
