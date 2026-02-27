import { useState } from 'react'

import PageHeader from '../../components/shared/PageHeader'
import { Alert } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { useAuth } from '../../context/AuthContext'
import { useAuditLogs } from './hooks'

function formatDateTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AuditTrailPage() {
  const { user } = useAuth()
  const canAccessAudit = user?.role === 'admin' || user?.role === 'hr_manager'

  const [actionFilter, setActionFilter] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [submittedActionFilter, setSubmittedActionFilter] = useState('')
  const [submittedEntityTypeFilter, setSubmittedEntityTypeFilter] = useState('')

  const auditLogsQuery = useAuditLogs(
    {
      limit: 100,
      offset: 0,
      action: submittedActionFilter || undefined,
      entity_type: submittedEntityTypeFilter || undefined,
    },
    canAccessAudit,
  )

  const logs = auditLogsQuery.data?.data.items ?? []

  const applyFilters = () => {
    setSubmittedActionFilter(actionFilter.trim())
    setSubmittedEntityTypeFilter(entityTypeFilter.trim())
  }

  return (
    <>
      <PageHeader title="Audit Trail" subtitle="Track key system changes and user actions" />

      {!canAccessAudit ? (
        <Alert className="border-sky-200 bg-sky-50 text-sky-700">
          This page is only available to Admin and HR Manager roles.
        </Alert>
      ) : null}

      {canAccessAudit ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <p className="mb-1 text-xs text-slate-500">Action</p>
                <Input value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} placeholder="e.g. update_employee" />
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">Entity Type</p>
                <Input value={entityTypeFilter} onChange={(event) => setEntityTypeFilter(event.target.value)} placeholder="e.g. employee" />
              </div>
              <div className="flex items-end justify-end">
                <Button onClick={applyFilters}>Apply Filters</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogsQuery.isLoading ? <p className="text-sm text-slate-500">Loading audit logs...</p> : null}
              {!auditLogsQuery.isLoading && logs.length === 0 ? <p className="text-sm text-slate-500">No audit records found.</p> : null}

              {logs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed border-collapse text-sm">
                    <colgroup>
                      <col className="w-40" />
                      <col className="w-40" />
                      <col className="w-36" />
                      <col className="w-32" />
                      <col className="w-44" />
                      <col className="w-64" />
                    </colgroup>
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="py-2">Timestamp</th>
                        <th className="py-2">Actor</th>
                        <th className="py-2">Action</th>
                        <th className="py-2">Entity</th>
                        <th className="py-2">Entity ID</th>
                        <th className="py-2">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b align-top">
                          <td className="py-2 pr-2">{formatDateTime(log.created_at)}</td>
                          <td className="truncate py-2 pr-2">{log.actor_email ?? '-'}</td>
                          <td className="truncate py-2 pr-2">{log.action}</td>
                          <td className="truncate py-2 pr-2">{log.entity_type}</td>
                          <td className="truncate py-2 pr-2">{log.entity_id ?? '-'}</td>
                          <td className="py-2">
                            <pre className="whitespace-pre-wrap break-words text-xs text-slate-700">
                              {log.details ? JSON.stringify(log.details) : '-'}
                            </pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  )
}

export default AuditTrailPage
