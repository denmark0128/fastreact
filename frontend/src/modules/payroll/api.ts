import axiosInstance from '../../api/axios'
import type { ApiResponse, PayrollProcessPayload, PayrollRecord, PayrollSummary } from '../../types'

export async function processPayroll(payload: PayrollProcessPayload) {
	const response = await axiosInstance.post<ApiResponse<PayrollRecord[]>>('/payroll/process', payload)
	return response.data
}

export async function getPayrollRecords(params?: {
	cutoff_start?: string
	cutoff_end?: string
	employee_id?: number
}) {
	const response = await axiosInstance.get<ApiResponse<PayrollRecord[]>>('/payroll/records', { params })
	return response.data
}

export async function getPayrollSummary(params?: { cutoff_start?: string; cutoff_end?: string; employee_id?: number }) {
	const response = await axiosInstance.get<ApiResponse<PayrollSummary>>('/payroll/summary', { params })
	return response.data
}
