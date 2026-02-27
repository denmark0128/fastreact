import axiosInstance from '../../api/axios'
import type { ApiResponse, Employee, EmployeePayload, EmployeeUpdatePayload } from '../../types'

export async function getEmployees(): Promise<ApiResponse<Employee[]>> {
  const response = await axiosInstance.get<ApiResponse<Employee[]>>('/employees/')
  return response.data
}

export async function createEmployee(payload: EmployeePayload): Promise<ApiResponse<Employee>> {
  const response = await axiosInstance.post<ApiResponse<Employee>>('/employees/', payload)
  return response.data
}

export async function updateEmployee(
  employeeId: number,
  payload: EmployeeUpdatePayload,
): Promise<ApiResponse<Employee>> {
  const response = await axiosInstance.put<ApiResponse<Employee>>(`/employees/${employeeId}`, payload)
  return response.data
}

export async function deleteEmployee(employeeId: number): Promise<ApiResponse<null>> {
  const response = await axiosInstance.delete<ApiResponse<null>>(`/employees/${employeeId}`)
  return response.data
}
