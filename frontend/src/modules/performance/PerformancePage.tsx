import { useState } from 'react'

import PageHeader from '../../components/shared/PageHeader'
import { TablePagination, TableToolbar } from '../../components/shared/TableControls'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import Modal from '../../components/ui/modal'
import { Select } from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import { useTableControls } from '../../lib/useTableControls'
import type { PerformanceReview, PerformanceReviewPayload, ReviewCycle, ReviewStatus } from '../../types'
import { useEmployees } from '../employees/hooks'
import {
  useCreatePerformanceReview,
  useDeletePerformanceReview,
  usePerformanceReviews,
  useUpdatePerformanceReview,
} from './hooks'

type ReviewSortKey = 'employee_name' | 'review_period' | 'status' | 'rating'

const REVIEW_CYCLES: ReviewCycle[] = ['quarterly', 'semi_annual', 'annual']
const REVIEW_STATUSES: ReviewStatus[] = ['draft', 'submitted', 'acknowledged']

const statusBadge: Record<ReviewStatus, string> = {
  draft: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
  submitted: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-900',
  acknowledged: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-900',
}

function PerformancePage() {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const canManage = user?.role === 'admin' || user?.role === 'hr_manager'

  const performanceQuery = usePerformanceReviews()
  const createReviewMutation = useCreatePerformanceReview()
  const updateReviewMutation = useUpdatePerformanceReview()
  const deleteReviewMutation = useDeletePerformanceReview()
  const employeesQuery = useEmployees()

  const [employeeId, setEmployeeId] = useState<number | ''>('')
  const [reviewPeriod, setReviewPeriod] = useState('')
  const [cycle, setCycle] = useState<ReviewCycle>('quarterly')
  const [rating, setRating] = useState(3)
  const [strengths, setStrengths] = useState('')
  const [improvements, setImprovements] = useState('')
  const [goals, setGoals] = useState('')
  const [comments, setComments] = useState('')
  const [isCreateReviewModalOpen, setIsCreateReviewModalOpen] = useState(false)

  const reviews = performanceQuery.data?.data.items ?? []

  const {
    searchQuery,
    setSearchQuery,
    toggleSort,
    sortIndicator,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredAndSortedItems,
    paginatedItems,
  } = useTableControls<PerformanceReview, ReviewSortKey>({
    items: reviews,
    initialSortKey: 'employee_name',
    searchableText: (record) =>
      [record.employee_name, record.reviewer_name, record.review_period, record.status, record.strengths, record.improvements].join(' '),
    sortValue: (record, key) => (key === 'rating' ? record.rating : record[key] ?? ''),
  })

  const resetForm = () => {
    setEmployeeId('')
    setReviewPeriod('')
    setCycle('quarterly')
    setRating(3)
    setStrengths('')
    setImprovements('')
    setGoals('')
    setComments('')
  }

  const handleCreate = () => {
    if (!employeeId || !reviewPeriod.trim()) {
      showNotification('Employee and review period are required')
      return
    }

    const payload: PerformanceReviewPayload = {
      employee_id: Number(employeeId),
      review_period: reviewPeriod.trim(),
      cycle,
      rating,
      strengths: strengths.trim() || undefined,
      improvements: improvements.trim() || undefined,
      goals: goals.trim() || undefined,
      comments: comments.trim() || undefined,
    }

    createReviewMutation.mutate(payload, {
      onSuccess: () => {
        showNotification('Performance review created')
        resetForm()
        setIsCreateReviewModalOpen(false)
      },
    })
  }

  const handleStatusChange = (reviewId: number, nextStatus: ReviewStatus) => {
    updateReviewMutation.mutate({ reviewId, payload: { status: nextStatus } }, { onSuccess: () => showNotification('Status updated') })
  }

  const handleRatingChange = (reviewId: number, nextRating: number) => {
    updateReviewMutation.mutate({ reviewId, payload: { rating: nextRating } }, { onSuccess: () => showNotification('Rating updated') })
  }

  const handleDelete = (reviewId: number) => {
    if (!window.confirm('Delete this review?')) return
    deleteReviewMutation.mutate(reviewId, { onSuccess: () => showNotification('Review deleted') })
  }

  const hasItems = filteredAndSortedItems.length > 0
  const canEditRows = canManage
  const employeeOptions = employeesQuery.data?.data.items ?? []

  return (
    <>
      <PageHeader
        title="Performance"
        subtitle="Track reviews, ratings, and coaching conversations"
        extra={
          <div className="flex items-center gap-2">
            {canManage ? (
              <Badge className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/50 dark:text-purple-200" variant="secondary">
                Manager access
              </Badge>
            ) : null}
            {canManage ? <Button onClick={() => setIsCreateReviewModalOpen(true)}>Create Review</Button> : null}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <TableToolbar
            searchPlaceholder="Search reviews"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />

          {performanceQuery.isLoading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading reviews...</p> : null}
          {!performanceQuery.isLoading && !hasItems ? <p className="text-sm text-slate-500 dark:text-slate-400">No reviews yet.</p> : null}

          {hasItems ? (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-48" />
                  <col className="w-28" />
                  <col className="w-20" />
                  <col className="w-28" />
                  <col className="w-24" />
                  <col />
                </colgroup>
                <thead>
                  <tr className="border-b text-left text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600 dark:text-slate-300" onClick={() => toggleSort('employee_name')}>
                        Employee {sortIndicator('employee_name')}
                      </Button>
                    </th>
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600 dark:text-slate-300" onClick={() => toggleSort('review_period')}>
                        Period {sortIndicator('review_period')}
                      </Button>
                    </th>
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600 dark:text-slate-300" onClick={() => toggleSort('rating')}>
                        Rating {sortIndicator('rating')}
                      </Button>
                    </th>
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600 dark:text-slate-300" onClick={() => toggleSort('status')}>
                        Status {sortIndicator('status')}
                      </Button>
                    </th>
                    <th className="py-2">Reviewer</th>
                    <th className="py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((review) => (
                    <tr key={review.id} className="border-b align-top dark:border-slate-700">
                      <td className="py-2 pr-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{review.employee_name ?? '—'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{review.cycle.replace('_', ' ')} • {new Date(review.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="py-2 pr-2 text-slate-700 dark:text-slate-300">{review.review_period}</td>
                      <td className="py-2 pr-2">
                        {canEditRows ? (
                          <Input
                            type="number"
                            min={1}
                            max={5}
                            value={review.rating}
                            onChange={(event) => handleRatingChange(review.id, Number(event.target.value))}
                          />
                        ) : (
                          <span>{review.rating}</span>
                        )}
                      </td>
                      <td className="py-2 pr-2">
                        <Badge className={`${statusBadge[review.status]} border`}>{review.status}</Badge>
                        {canEditRows ? (
                          <Select
                            value={review.status}
                            onChange={(event) => handleStatusChange(review.id, event.target.value as ReviewStatus)}
                            className="mt-2 w-36"
                          >
                            {REVIEW_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </Select>
                        ) : null}
                      </td>
                      <td className="py-2 pr-2 text-slate-700 dark:text-slate-300">{review.reviewer_name ?? '—'}</td>
                      <td className="py-2 pr-2">
                        <p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-300">{review.strengths || 'No notes'}</p>
                        {review.improvements ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400">Areas: {review.improvements}</p>
                        ) : null}
                        {review.goals ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400">Goals: {review.goals}</p>
                        ) : null}
                        {canEditRows ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleDelete(review.id)}
                            disabled={deleteReviewMutation.isPending}
                          >
                            Delete
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {hasItems ? (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredAndSortedItems.length}
              onPageChange={setCurrentPage}
              onPrevious={() => setCurrentPage((current) => Math.max(1, current - 1))}
              onNext={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
            />
          ) : null}
        </CardContent>
      </Card>

      <Modal open={isCreateReviewModalOpen} title="Create Review" onClose={() => setIsCreateReviewModalOpen(false)}>
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Employee</p>
            <Select
              value={employeeId === '' ? '' : String(employeeId)}
              onChange={(event) => setEmployeeId(event.target.value ? Number(event.target.value) : '')}
            >
              <option value="">Select employee</option>
              {employeeOptions.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.profile_name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Review Period</p>
            <Input value={reviewPeriod} onChange={(event) => setReviewPeriod(event.target.value)} placeholder="Q2 2024" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Cycle</p>
              <Select value={cycle} onChange={(event) => setCycle(event.target.value as ReviewCycle)}>
                {REVIEW_CYCLES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace('_', ' ')}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Rating</p>
              <Input
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
              />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Strengths</p>
            <Textarea
              className="min-h-[72px]"
              rows={2}
              value={strengths}
              onChange={(event) => setStrengths(event.target.value)}
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Improvements</p>
            <Textarea
              className="min-h-[72px]"
              rows={2}
              value={improvements}
              onChange={(event) => setImprovements(event.target.value)}
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Goals</p>
            <Textarea
              className="min-h-[72px]"
              rows={2}
              value={goals}
              onChange={(event) => setGoals(event.target.value)}
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Manager Notes</p>
            <Textarea
              className="min-h-[72px]"
              rows={2}
              value={comments}
              onChange={(event) => setComments(event.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={createReviewMutation.isPending}>
            {createReviewMutation.isPending ? 'Saving...' : 'Create Review'}
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default PerformancePage
