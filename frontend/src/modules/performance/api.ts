import axiosInstance from '../../api/axios'
import type {
	ApiResponse,
	PerformanceReview,
	PerformanceReviewList,
	PerformanceReviewPayload,
	PerformanceReviewUpdatePayload,
} from '../../types'

export async function getPerformanceReviews(): Promise<ApiResponse<PerformanceReviewList>> {
	const response = await axiosInstance.get<ApiResponse<PerformanceReviewList>>('/performance/reviews')
	return response.data
}

export async function createPerformanceReview(
	payload: PerformanceReviewPayload,
): Promise<ApiResponse<PerformanceReview>> {
	const response = await axiosInstance.post<ApiResponse<PerformanceReview>>('/performance/reviews', payload)
	return response.data
}

export async function updatePerformanceReview(
	reviewId: number,
	payload: PerformanceReviewUpdatePayload,
): Promise<ApiResponse<PerformanceReview>> {
	const response = await axiosInstance.put<ApiResponse<PerformanceReview>>(`/performance/reviews/${reviewId}`, payload)
	return response.data
}

export async function deletePerformanceReview(reviewId: number): Promise<ApiResponse<null>> {
	const response = await axiosInstance.delete<ApiResponse<null>>(`/performance/reviews/${reviewId}`)
	return response.data
}
