import { useMemo, useState } from 'react'

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
import type {
  ApplicationStatus,
  ApplicationUpdatePayload,
  JobPosting,
  JobPostingPayload,
  JobStatus,
} from '../../types'
import { useDepartments } from '../settings/hooks'
import {
  useApplications,
  useCreateApplication,
  useCreateJobPosting,
  useDeleteJobPosting,
  useJobPostings,
  useUpdateApplication,
  useUpdateJobPosting,
} from './hooks'

type JobSortKey = 'title' | 'department' | 'status'

const JOB_STATUSES: JobStatus[] = ['open', 'on_hold', 'closed']
const APPLICATION_STATUSES: ApplicationStatus[] = ['new', 'screening', 'interview', 'offered', 'hired', 'rejected', 'withdrawn']

function RecruitmentPage() {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const canManage = user?.role === 'admin' || user?.role === 'hr_manager'

  const jobPostingsQuery = useJobPostings()
  const createJobMutation = useCreateJobPosting()
  const updateJobMutation = useUpdateJobPosting()
  const deleteJobMutation = useDeleteJobPosting()
  const departmentsQuery = useDepartments()

  const [jobTitle, setJobTitle] = useState('')
  const [jobDepartment, setJobDepartment] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobRequirements, setJobRequirements] = useState('')
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false)

  const [selectedJobId, setSelectedJobId] = useState<number | 'all'>('all')
  const applicationsQuery = useApplications(
    selectedJobId === 'all' ? undefined : { job_posting_id: selectedJobId },
    canManage,
  )
  const createApplicationMutation = useCreateApplication()
  const updateApplicationMutation = useUpdateApplication()

  const [applyJobId, setApplyJobId] = useState<number | ''>('')
  const [applicantName, setApplicantName] = useState(user?.full_name ?? '')
  const [applicantEmail, setApplicantEmail] = useState(user?.email ?? '')
  const [applicantPhone, setApplicantPhone] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [applicationNotes, setApplicationNotes] = useState<Record<number, string>>({})
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)

  const jobPostings = jobPostingsQuery.data?.data.items ?? []
  const departmentNames = (departmentsQuery.data?.data ?? []).map((dept) => dept.name)

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
  } = useTableControls<JobPosting, JobSortKey>({
    items: jobPostings,
    initialSortKey: 'title',
    searchableText: (record) => [record.title, record.department, record.status, record.description].join(' '),
    sortValue: (record, key) => record[key] ?? '',
  })

  const applications = applicationsQuery.data?.data.items ?? []

  const resetJobForm = () => {
    setJobTitle('')
    setJobDepartment('')
    setJobDescription('')
    setJobRequirements('')
  }

  const resetApplicationForm = () => {
    setApplyJobId('')
    setApplicantPhone('')
    setResumeUrl('')
    setCoverLetter('')
  }

  const handleCreateJob = () => {
    if (!jobTitle.trim() || !jobDepartment.trim()) {
      showNotification('Title and department are required')
      return
    }

    const payload: JobPostingPayload = {
      title: jobTitle.trim(),
      department: jobDepartment.trim(),
      description: jobDescription.trim() || undefined,
      requirements: jobRequirements.trim() || undefined,
    }

    createJobMutation.mutate(payload, {
      onSuccess: () => {
        showNotification('Job posting created')
        resetJobForm()
        setIsCreateJobModalOpen(false)
      },
    })
  }

  const handleUpdateJobStatus = (postingId: number, status: JobStatus) => {
    updateJobMutation.mutate({ postingId, payload: { status } }, { onSuccess: () => showNotification('Job updated') })
  }

  const handleDeleteJob = (postingId: number) => {
    if (!window.confirm('Delete this job posting?')) return
    deleteJobMutation.mutate(postingId, { onSuccess: () => showNotification('Job deleted') })
  }

  const handleSubmitApplication = () => {
    if (!applyJobId) {
      showNotification('Select a role to apply to')
      return
    }
    if (!applicantName.trim() || !applicantEmail.trim()) {
      showNotification('Name and email are required')
      return
    }

    createApplicationMutation.mutate(
      {
        job_posting_id: Number(applyJobId),
        applicant_name: applicantName.trim(),
        applicant_email: applicantEmail.trim(),
        phone: applicantPhone.trim() || undefined,
        resume_url: resumeUrl.trim() || undefined,
        cover_letter: coverLetter.trim() || undefined,
      },
      {
        onSuccess: () => {
          showNotification('Application submitted')
          resetApplicationForm()
          setIsApplyModalOpen(false)
        },
      },
    )
  }

  const handleUpdateApplication = (applicationId: number, payload: ApplicationUpdatePayload) => {
    updateApplicationMutation.mutate({ applicationId, payload }, {
      onSuccess: () => showNotification('Application updated'),
    })
  }

  const jobHasData = filteredAndSortedItems.length > 0
  const applicationsVisible = canManage && applications.length > 0

  const activeJobOptions = useMemo(() => jobPostings.filter((job) => job.status === 'open'), [jobPostings])

  return (
    <>
      <PageHeader
        title="Recruitment"
        subtitle="Open roles, incoming applications, and hiring pipeline"
        extra={
          <div className="flex items-center gap-2">
            {canManage ? (
              <Badge className="border-sky-200 bg-sky-50 text-sky-700" variant="secondary">
                Hiring access
              </Badge>
            ) : null}
            {canManage ? <Button onClick={() => setIsCreateJobModalOpen(true)}>Create Job Posting</Button> : null}
            <Button onClick={() => setIsApplyModalOpen(true)}>
              Apply to a Role
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Open Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <TableToolbar
            searchPlaceholder="Search roles"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />

          {jobPostingsQuery.isLoading ? <p className="text-sm text-slate-500">Loading job postings...</p> : null}
          {!jobPostingsQuery.isLoading && !jobHasData ? <p className="text-sm text-slate-500">No roles posted yet.</p> : null}

          {jobHasData ? (
            <div className="space-y-3 md:hidden">
              {paginatedItems.map((posting) => (
                <div key={posting.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{posting.title}</p>
                      <p className="text-xs text-slate-500">{posting.department}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {posting.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs text-slate-600">{posting.description || 'No description yet.'}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500">Applications</p>
                      <p className="font-medium text-slate-900">{posting.application_count}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Posted</p>
                      <p className="font-medium text-slate-900">{new Date(posting.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {canManage ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Select
                        value={posting.status}
                        onChange={(event) => handleUpdateJobStatus(posting.id, event.target.value as JobStatus)}
                        className="w-32"
                      >
                        {JOB_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.replace('_', ' ')}
                          </option>
                        ))}
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteJob(posting.id)}
                        disabled={deleteJobMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {jobHasData ? (
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-60" />
                  <col className="w-32" />
                  <col className="w-24" />
                  <col className="w-24" />
                  <col className="w-32" />
                  <col />
                </colgroup>
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600" onClick={() => toggleSort('title')}>
                        Title {sortIndicator('title')}
                      </Button>
                    </th>
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600" onClick={() => toggleSort('department')}>
                        Department {sortIndicator('department')}
                      </Button>
                    </th>
                    <th className="py-2">Applications</th>
                    <th className="py-2">
                      <Button variant="ghost" className="h-auto p-0 text-slate-600" onClick={() => toggleSort('status')}>
                        Status {sortIndicator('status')}
                      </Button>
                    </th>
                    <th className="py-2">Posted</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((posting) => (
                    <tr key={posting.id} className="border-b align-top">
                      <td className="py-2 pr-2">
                        <p className="font-medium text-slate-900">{posting.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600">{posting.description || 'No description yet.'}</p>
                      </td>
                      <td className="py-2 pr-2 text-slate-700">{posting.department}</td>
                      <td className="py-2 pr-2 text-slate-700">{posting.application_count}</td>
                      <td className="py-2 pr-2">
                        <Badge variant="secondary" className="capitalize">
                          {posting.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-2 pr-2 text-xs text-slate-600">{new Date(posting.created_at).toLocaleDateString()}</td>
                      <td className="py-2 pr-2">
                        <div className="flex flex-col gap-2">
                          {canManage ? (
                            <Select
                              value={posting.status}
                              onChange={(event) => handleUpdateJobStatus(posting.id, event.target.value as JobStatus)}
                              className="w-32"
                            >
                              {JOB_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status.replace('_', ' ')}
                                </option>
                              ))}
                            </Select>
                          ) : null}
                          {canManage ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-32"
                              onClick={() => handleDeleteJob(posting.id)}
                              disabled={deleteJobMutation.isPending}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {jobHasData ? (
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

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {canManage ? (
          <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Applications</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <Select
                  value={selectedJobId === 'all' ? 'all' : String(selectedJobId)}
                  onChange={(event) => {
                    const value = event.target.value === 'all' ? 'all' : Number(event.target.value)
                    setSelectedJobId(value)
                  }}
                  className="md:w-52"
                >
                  <option value="all">All roles</option>
                  {jobPostings.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </Select>
                {applicationsQuery.isFetching ? <p className="text-xs text-slate-500">Refreshing...</p> : null}
              </div>

              {applicationsQuery.isLoading ? <p className="text-sm text-slate-500">Loading applications...</p> : null}
              {!applicationsQuery.isLoading && !applicationsVisible ? (
                <p className="text-sm text-slate-500">No applications yet.</p>
              ) : null}

              {applicationsVisible ? (
                <div className="space-y-3 md:hidden">
                  {applications.map((application) => (
                    <div key={application.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{application.applicant_name}</p>
                          <p className="text-xs text-slate-500">{application.applicant_email}</p>
                        </div>
                        <Select
                          value={application.status}
                          onChange={(event) =>
                            handleUpdateApplication(application.id, { status: event.target.value as ApplicationStatus })
                          }
                          className="w-36"
                        >
                          {APPLICATION_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                        <div>
                          <p className="text-slate-500">Role</p>
                          <p className="font-medium text-slate-900">{application.job_title ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Phone</p>
                          <p className="font-medium text-slate-900">{application.phone || 'No phone'}</p>
                        </div>
                      </div>
                      {application.resume_url ? (
                        <a className="mt-2 inline-block text-xs text-sky-600 underline" href={application.resume_url} target="_blank" rel="noreferrer">
                          Resume
                        </a>
                      ) : null}
                      <div className="mt-3">
                        <p className="mb-1 text-xs text-slate-500">Notes</p>
                        <Textarea
                          className="min-h-[56px] py-1"
                          rows={2}
                          value={applicationNotes[application.id] ?? application.notes ?? ''}
                          onChange={(event) =>
                            setApplicationNotes((current) => ({ ...current, [application.id]: event.target.value }))
                          }
                          onBlur={() =>
                            handleUpdateApplication(application.id, {
                              notes: applicationNotes[application.id] ?? application.notes ?? '',
                            })
                          }
                          placeholder="Stage notes"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {applicationsVisible ? (
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full table-fixed border-collapse text-sm">
                    <colgroup>
                      <col className="w-44" />
                      <col className="w-36" />
                      <col className="w-28" />
                      <col className="w-36" />
                      <col />
                    </colgroup>
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="py-2">Candidate</th>
                        <th className="py-2">Email</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Role</th>
                        <th className="py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((application) => (
                        <tr key={application.id} className="border-b align-top">
                          <td className="py-2 pr-2">
                            <p className="font-medium text-slate-900">{application.applicant_name}</p>
                            <p className="text-xs text-slate-500">{application.phone || 'No phone'}</p>
                            {application.resume_url ? (
                              <a
                                className="text-xs text-sky-600 underline"
                                href={application.resume_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Resume
                              </a>
                            ) : null}
                          </td>
                          <td className="py-2 pr-2 text-slate-700">{application.applicant_email}</td>
                          <td className="py-2 pr-2">
                            <Select
                              value={application.status}
                              onChange={(event) =>
                                handleUpdateApplication(application.id, { status: event.target.value as ApplicationStatus })
                              }
                              className="w-36"
                            >
                              {APPLICATION_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </Select>
                          </td>
                          <td className="py-2 pr-2 text-slate-700">{application.job_title ?? '—'}</td>
                          <td className="py-2 pr-2">
                            <Textarea
                              className="min-h-[56px] py-1"
                              rows={2}
                              value={applicationNotes[application.id] ?? application.notes ?? ''}
                              onChange={(event) =>
                                setApplicationNotes((current) => ({ ...current, [application.id]: event.target.value }))
                              }
                              onBlur={() =>
                                handleUpdateApplication(application.id, {
                                  notes: applicationNotes[application.id] ?? application.notes ?? '',
                                })
                              }
                              placeholder="Stage notes"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Modal open={isCreateJobModalOpen} title="Create Job Posting" onClose={() => setIsCreateJobModalOpen(false)}>
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs text-slate-500">Title</p>
            <Input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="Senior Backend Engineer" />
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500">Department</p>
            <Select value={jobDepartment} onChange={(event) => setJobDepartment(event.target.value)}>
              <option value="">Select department</option>
              {departmentNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500">Description</p>
            <Textarea
              rows={3}
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Key responsibilities"
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500">Requirements</p>
            <Textarea
              rows={3}
              value={jobRequirements}
              onChange={(event) => setJobRequirements(event.target.value)}
              placeholder="Skills, tools, experience"
            />
          </div>
          <Button className="w-full" onClick={handleCreateJob} disabled={createJobMutation.isPending}>
            {createJobMutation.isPending ? 'Creating...' : 'Post Job'}
          </Button>
        </div>
      </Modal>

      <Modal open={isApplyModalOpen} title="Apply to a Role" onClose={() => setIsApplyModalOpen(false)}>
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs text-slate-500">Job Posting</p>
            <Select
              value={applyJobId === '' ? '' : String(applyJobId)}
              onChange={(event) => setApplyJobId(event.target.value ? Number(event.target.value) : '')}
            >
              <option value="">Choose a role</option>
              {activeJobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs text-slate-500">Full Name</p>
              <Input value={applicantName} onChange={(event) => setApplicantName(event.target.value)} />
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-500">Email</p>
              <Input type="email" value={applicantEmail} onChange={(event) => setApplicantEmail(event.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs text-slate-500">Phone</p>
              <Input value={applicantPhone} onChange={(event) => setApplicantPhone(event.target.value)} placeholder="Optional" />
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-500">Resume URL</p>
              <Input value={resumeUrl} onChange={(event) => setResumeUrl(event.target.value)} placeholder="Link to resume" />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500">Cover Letter</p>
            <Textarea
              rows={3}
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
              placeholder="Why you are a great fit"
            />
          </div>
          <Button className="w-full" onClick={handleSubmitApplication} disabled={createApplicationMutation.isPending}>
            {createApplicationMutation.isPending ? 'Sending...' : 'Submit Application'}
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default RecruitmentPage
