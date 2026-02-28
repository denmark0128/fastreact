import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import PageHeader from '../../components/shared/PageHeader'
import { Alert } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select } from '../../components/ui/select'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import type { AdminSettingsUpdatePayload } from '../../types'
import { useAdminSettings, useUpdateAdminSettings } from './hooks'
import { CardTitle } from '@/components/ui/card'

const adminSettingsSchema = z.object({
  late_grace_minutes: z.number().min(0),
  minimum_overtime_minutes: z.number().min(0),
  undertime_rounding_minutes: z.number().min(0),
  payroll_cutoff_mode: z.enum(['semi_monthly', 'monthly']),
  employee_self_service_enabled: z.enum(['true', 'false']),
  allow_hr_process_payroll: z.enum(['true', 'false']),
  allow_hr_manage_employees: z.enum(['true', 'false']),
  allow_hr_manage_settings: z.enum(['true', 'false']),
  default_employee_role: z.enum(['employee', 'hr_manager']),
  default_rate_type: z.enum(['daily', 'monthly']),
  default_shift_start: z.string().min(1),
  default_shift_end: z.string().min(1),
  default_work_days: z.enum(['monday-friday', 'monday-saturday']),
})

type AdminSettingsFormValues = z.infer<typeof adminSettingsSchema>

function AdminSettingsPage() {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const canAccessAdminSettings = user?.role === 'admin' || user?.role === 'hr_manager'
  const canManageAdminSettings = user?.role === 'admin'
  const [isAdminEditing, setIsAdminEditing] = useState(false)

  const adminSettingsQuery = useAdminSettings(canAccessAdminSettings)
  const updateAdminSettingsMutation = useUpdateAdminSettings()

  const {
    control: adminControl,
    handleSubmit: handleAdminSubmit,
    reset: resetAdmin,
  } = useForm<AdminSettingsFormValues>({
    resolver: zodResolver(adminSettingsSchema),
    defaultValues: {
      late_grace_minutes: 5,
      minimum_overtime_minutes: 30,
      undertime_rounding_minutes: 15,
      payroll_cutoff_mode: 'semi_monthly',
      employee_self_service_enabled: 'true',
      allow_hr_process_payroll: 'true',
      allow_hr_manage_employees: 'true',
      allow_hr_manage_settings: 'false',
      default_employee_role: 'employee',
      default_rate_type: 'monthly',
      default_shift_start: '09:00',
      default_shift_end: '18:00',
      default_work_days: 'monday-friday',
    },
  })

  useEffect(() => {
    const adminSettings = adminSettingsQuery.data?.data
    if (!adminSettings) {
      return
    }

    resetAdmin({
      late_grace_minutes: adminSettings.late_grace_minutes,
      minimum_overtime_minutes: adminSettings.minimum_overtime_minutes,
      undertime_rounding_minutes: adminSettings.undertime_rounding_minutes,
      payroll_cutoff_mode: adminSettings.payroll_cutoff_mode === 'monthly' ? 'monthly' : 'semi_monthly',
      employee_self_service_enabled: adminSettings.employee_self_service_enabled ? 'true' : 'false',
      allow_hr_process_payroll: adminSettings.allow_hr_process_payroll ? 'true' : 'false',
      allow_hr_manage_employees: adminSettings.allow_hr_manage_employees ? 'true' : 'false',
      allow_hr_manage_settings: adminSettings.allow_hr_manage_settings ? 'true' : 'false',
      default_employee_role: adminSettings.default_employee_role === 'hr_manager' ? 'hr_manager' : 'employee',
      default_rate_type: adminSettings.default_rate_type === 'daily' ? 'daily' : 'monthly',
      default_shift_start: adminSettings.default_shift_start,
      default_shift_end: adminSettings.default_shift_end,
      default_work_days: adminSettings.default_work_days === 'monday-saturday' ? 'monday-saturday' : 'monday-friday',
    })
  }, [adminSettingsQuery.data, resetAdmin])

  const handleCancelAdminEdit = () => {
    const adminSettings = adminSettingsQuery.data?.data
    if (adminSettings) {
      resetAdmin({
        late_grace_minutes: adminSettings.late_grace_minutes,
        minimum_overtime_minutes: adminSettings.minimum_overtime_minutes,
        undertime_rounding_minutes: adminSettings.undertime_rounding_minutes,
        payroll_cutoff_mode: adminSettings.payroll_cutoff_mode === 'monthly' ? 'monthly' : 'semi_monthly',
        employee_self_service_enabled: adminSettings.employee_self_service_enabled ? 'true' : 'false',
        allow_hr_process_payroll: adminSettings.allow_hr_process_payroll ? 'true' : 'false',
        allow_hr_manage_employees: adminSettings.allow_hr_manage_employees ? 'true' : 'false',
        allow_hr_manage_settings: adminSettings.allow_hr_manage_settings ? 'true' : 'false',
        default_employee_role: adminSettings.default_employee_role === 'hr_manager' ? 'hr_manager' : 'employee',
        default_rate_type: adminSettings.default_rate_type === 'daily' ? 'daily' : 'monthly',
        default_shift_start: adminSettings.default_shift_start,
        default_shift_end: adminSettings.default_shift_end,
        default_work_days: adminSettings.default_work_days === 'monday-saturday' ? 'monday-saturday' : 'monday-friday',
      })
    }

    setIsAdminEditing(false)
  }

  const onUpdateAdminSettings = (values: AdminSettingsFormValues) => {
    const payload: AdminSettingsUpdatePayload = {
      late_grace_minutes: values.late_grace_minutes,
      minimum_overtime_minutes: values.minimum_overtime_minutes,
      undertime_rounding_minutes: values.undertime_rounding_minutes,
      payroll_cutoff_mode: values.payroll_cutoff_mode,
      employee_self_service_enabled: values.employee_self_service_enabled === 'true',
      allow_hr_process_payroll: values.allow_hr_process_payroll === 'true',
      allow_hr_manage_employees: values.allow_hr_manage_employees === 'true',
      allow_hr_manage_settings: values.allow_hr_manage_settings === 'true',
      default_employee_role: values.default_employee_role,
      default_rate_type: values.default_rate_type,
      default_shift_start: values.default_shift_start,
      default_shift_end: values.default_shift_end,
      default_work_days: values.default_work_days,
    }

    updateAdminSettingsMutation.mutate(payload, {
      onSuccess: () => {
        showNotification('Admin settings saved successfully')
        setIsAdminEditing(false)
      },
    })
  }

  return (
    <>
      <PageHeader
        title="Admin Settings"
        subtitle="Policies, permissions, and defaults"
        extra={
          canManageAdminSettings ? (
            isAdminEditing ? (
              <Button variant="outline" size="sm" onClick={handleCancelAdminEdit} disabled={updateAdminSettingsMutation.isPending}>
                Cancel
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIsAdminEditing(true)}>
                Edit
              </Button>
            )
          ) : null
        }
      />

      {!canAccessAdminSettings ? (
        <Alert className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-200">
          This page is only available to Admin and HR Manager roles.
        </Alert>
      ) : null}

      {canAccessAdminSettings ? (
        <div className="space-y-4">
          {!canManageAdminSettings ? (
            <Alert className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-200">
              Read-only access: only Admin can update policies, permissions, and defaults.
            </Alert>
          ) : null}
          <form className="grid grid-cols-1 gap-4" onSubmit={handleAdminSubmit(onUpdateAdminSettings)}>
              <div className="rounded-md border border-border p-6">
                <CardTitle className="mb-3 text-base">Policies</CardTitle>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Controller
                    name="late_grace_minutes"
                    control={adminControl}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <p className="mb-1 text-xs text-slate-500">Late Grace (minutes)</p>
                        <Input
                          type="number"
                          min="0"
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                          disabled={!canManageAdminSettings || !isAdminEditing}
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name="minimum_overtime_minutes"
                    control={adminControl}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <p className="mb-1 text-xs text-slate-500">Minimum Overtime (minutes)</p>
                        <Input
                          type="number"
                          min="0"
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                          disabled={!canManageAdminSettings || !isAdminEditing}
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name="undertime_rounding_minutes"
                    control={adminControl}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <p className="mb-1 text-xs text-slate-500">Undertime Rounding (minutes)</p>
                        <Input
                          type="number"
                          min="0"
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                          disabled={!canManageAdminSettings || !isAdminEditing}
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name="payroll_cutoff_mode"
                    control={adminControl}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <p className="mb-1 text-xs text-slate-500">Payroll Cutoff</p>
                        <Select value={field.value} onChange={(event) => field.onChange(event.target.value)} disabled={!canManageAdminSettings || !isAdminEditing}>
                          <option value="semi_monthly">Semi-monthly</option>
                          <option value="monthly">Monthly</option>
                        </Select>
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="rounded-md border border-border p-6">
                <CardTitle className="mb-3 text-base">Permissions</CardTitle>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Controller
                    name="employee_self_service_enabled"
                    control={adminControl}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <p className="mb-1 text-xs text-slate-500">Employee Self-Service</p>
                        <Select value={field.value} onChange={(event) => field.onChange(event.target.value)} disabled={!canManageAdminSettings || !isAdminEditing}>
                          <option value="true">Enabled</option>
                          <option value="false">Disabled</option>
                        </Select>
                      </div>
                    )}
                  />
                  <Controller
                    name="allow_hr_process_payroll"
                    control={adminControl}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <p className="mb-1 text-xs text-slate-500">HR Can Process Payroll</p>
                        <Select value={field.value} onChange={(event) => field.onChange(event.target.value)} disabled={!canManageAdminSettings || !isAdminEditing}>
                          <option value="true">Allowed</option>
                          <option value="false">Not allowed</option>
                        </Select>
                      </div>
                    )}
                  />
                  <Controller
                    name="allow_hr_manage_employees"
                    control={adminControl}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <p className="mb-1 text-xs text-slate-500">HR Can Manage Employees</p>
                        <Select value={field.value} onChange={(event) => field.onChange(event.target.value)} disabled={!canManageAdminSettings || !isAdminEditing}>
                          <option value="true">Allowed</option>
                          <option value="false">Not allowed</option>
                        </Select>
                      </div>
                    )}
                  />
                  <Controller
                    name="allow_hr_manage_settings"
                    control={adminControl}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <p className="mb-1 text-xs text-slate-500">HR Can Manage Settings</p>
                        <Select value={field.value} onChange={(event) => field.onChange(event.target.value)} disabled={!canManageAdminSettings || !isAdminEditing}>
                          <option value="true">Allowed</option>
                          <option value="false">Not allowed</option>
                        </Select>
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="rounded-md border border-border p-6">
                <CardTitle className="mb-3 text-base">Defaults</CardTitle>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Controller
                    name="default_employee_role"
                    control={adminControl}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <p className="mb-1 text-xs text-slate-500">Default Role</p>
                        <Select value={field.value} onChange={(event) => field.onChange(event.target.value)} disabled={!canManageAdminSettings || !isAdminEditing}>
                          <option value="employee">Employee</option>
                          <option value="hr_manager">HR Manager</option>
                        </Select>
                      </div>
                    )}
                  />
                  <Controller
                    name="default_rate_type"
                    control={adminControl}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <p className="mb-1 text-xs text-slate-500">Default Rate Type</p>
                        <Select value={field.value} onChange={(event) => field.onChange(event.target.value)} disabled={!canManageAdminSettings || !isAdminEditing}>
                          <option value="monthly">Monthly</option>
                          <option value="daily">Daily</option>
                        </Select>
                      </div>
                    )}
                  />
                  <Controller
                    name="default_shift_start"
                    control={adminControl}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <p className="mb-1 text-xs text-slate-500">Default Shift Start</p>
                        <Input {...field} disabled={!canManageAdminSettings || !isAdminEditing} />
                      </div>
                    )}
                  />
                  <Controller
                    name="default_shift_end"
                    control={adminControl}
                    render={({ field }) => (
                      <div className="space-y-1">
                        <p className="mb-1 text-xs text-slate-500">Default Shift End</p>
                        <Input {...field} disabled={!canManageAdminSettings || !isAdminEditing} />
                      </div>
                    )}
                  />
                  <Controller
                    name="default_work_days"
                    control={adminControl}
                    render={({ field }) => (
                      <div className="space-y-1 md:col-span-2">
                        <p className="mb-1 text-xs text-slate-500">Default Work Days</p>
                        <Select value={field.value} onChange={(event) => field.onChange(event.target.value)} disabled={!canManageAdminSettings || !isAdminEditing}>
                          <option value="monday-friday">Monday-Friday</option>
                          <option value="monday-saturday">Monday-Saturday</option>
                        </Select>
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={!canManageAdminSettings || !isAdminEditing || updateAdminSettingsMutation.isPending}>
                  {updateAdminSettingsMutation.isPending ? 'Saving...' : 'Save Admin Settings'}
                </Button>
              </div>
          </form>
        </div>
      ) : null}
    </>
  )
}

export default AdminSettingsPage
