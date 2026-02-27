import axiosInstance from '../../api/axios'
import type {
	AdminSettings,
	AdminSettingsUpdatePayload,
	AuditLogList,
	ApiResponse,
	CompanyProfile,
	CompanyProfileUpdatePayload,
	Department,
	DepartmentCreatePayload,
	DepartmentUpdatePayload,
} from '../../types'

export async function getDepartments(): Promise<ApiResponse<Department[]>> {
	const response = await axiosInstance.get<ApiResponse<Department[]>>('/settings/departments')
	return response.data
}

export async function createDepartment(payload: DepartmentCreatePayload): Promise<ApiResponse<Department>> {
	const response = await axiosInstance.post<ApiResponse<Department>>('/settings/departments', payload)
	return response.data
}

export async function deleteDepartment(departmentId: number): Promise<ApiResponse<null>> {
	const response = await axiosInstance.delete<ApiResponse<null>>(`/settings/departments/${departmentId}`)
	return response.data
}

export async function updateDepartment(departmentId: number, payload: DepartmentUpdatePayload): Promise<ApiResponse<Department>> {
	const response = await axiosInstance.put<ApiResponse<Department>>(`/settings/departments/${departmentId}`, payload)
	return response.data
}

export async function getCompanyProfile(): Promise<ApiResponse<CompanyProfile>> {
	const response = await axiosInstance.get<ApiResponse<CompanyProfile>>('/settings/company-profile')
	return response.data
}

export async function updateCompanyProfile(
	payload: CompanyProfileUpdatePayload,
): Promise<ApiResponse<CompanyProfile>> {
	const response = await axiosInstance.put<ApiResponse<CompanyProfile>>('/settings/company-profile', payload)
	return response.data
}

export async function getAdminSettings(): Promise<ApiResponse<AdminSettings>> {
	const response = await axiosInstance.get<ApiResponse<AdminSettings>>('/settings/admin')
	return response.data
}

export async function updateAdminSettings(
	payload: AdminSettingsUpdatePayload,
): Promise<ApiResponse<AdminSettings>> {
	const response = await axiosInstance.put<ApiResponse<AdminSettings>>('/settings/admin', payload)
	return response.data
}

export async function getAuditLogs(params: {
	limit?: number
	offset?: number
	action?: string
	entity_type?: string
}): Promise<ApiResponse<AuditLogList>> {
	const response = await axiosInstance.get<ApiResponse<AuditLogList>>('/audit/logs', { params })
	return response.data
}
