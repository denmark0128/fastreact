import axiosInstance from '../../api/axios'
import type {
	ApiResponse,
	ApplicationList,
	ApplicationPayload,
	ApplicationUpdatePayload,
	JobPosting,
	JobPostingList,
	JobPostingPayload,
	JobPostingUpdatePayload,
} from '../../types'

export async function getJobPostings(): Promise<ApiResponse<JobPostingList>> {
	const response = await axiosInstance.get<ApiResponse<JobPostingList>>('/recruitment/jobs')
	return response.data
}

export async function createJobPosting(payload: JobPostingPayload): Promise<ApiResponse<JobPosting>> {
	const response = await axiosInstance.post<ApiResponse<JobPosting>>('/recruitment/jobs', payload)
	return response.data
}

export async function updateJobPosting(
	postingId: number,
	payload: JobPostingUpdatePayload,
): Promise<ApiResponse<null>> {
	const response = await axiosInstance.put<ApiResponse<null>>(`/recruitment/jobs/${postingId}`, payload)
	return response.data
}

export async function deleteJobPosting(postingId: number): Promise<ApiResponse<null>> {
	const response = await axiosInstance.delete<ApiResponse<null>>(`/recruitment/jobs/${postingId}`)
	return response.data
}

export interface ApplicationFilters {
	job_posting_id?: number
}

export async function getApplications(params?: ApplicationFilters): Promise<ApiResponse<ApplicationList>> {
	const response = await axiosInstance.get<ApiResponse<ApplicationList>>('/recruitment/applications', { params })
	return response.data
}

export async function createApplication(payload: ApplicationPayload): Promise<ApiResponse<null>> {
	const response = await axiosInstance.post<ApiResponse<null>>('/recruitment/applications', payload)
	return response.data
}

export async function updateApplication(
	applicationId: number,
	payload: ApplicationUpdatePayload,
): Promise<ApiResponse<null>> {
	const response = await axiosInstance.put<ApiResponse<null>>(`/recruitment/applications/${applicationId}`, payload)
	return response.data
}
