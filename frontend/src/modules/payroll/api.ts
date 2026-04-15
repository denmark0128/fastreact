import axiosInstance from '../../api/axios'
import type { AdjustmentItem, AdjustmentItemCreate, ApiResponse, PayrollProcessPayload, PayrollRecord, PayrollSummary } from '../../types'

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

// ---------------------------------------------------------------------------
// Adjustment items
// ---------------------------------------------------------------------------

export async function getAdjustmentItems(params: {
	cutoff_start: string
	cutoff_end: string
	employee_id?: number
}) {
	const response = await axiosInstance.get<ApiResponse<AdjustmentItem[]>>('/payroll/adjustments', { params })
	return response.data
}

export async function createAdjustmentItem(data: AdjustmentItemCreate) {
	const response = await axiosInstance.post<ApiResponse<AdjustmentItem>>('/payroll/adjustments', data)
	return response.data
}

export async function deleteAdjustmentItem(itemId: number) {
	const response = await axiosInstance.delete<ApiResponse<null>>(`/payroll/adjustments/${itemId}`)
	return response.data
}
