import { zodResolver } from '@hookform/resolvers/zod'
import { format, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '../../components/ui/button'
import { Calendar } from '../../components/ui/calendar'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { Select } from '../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { cn } from '../../lib/utils'
import type { Employee, EmployeePayload } from '../../types'

const employeeSchema = z.object({
  employee_code: z.string().min(1, 'Employee code is required'),
  biometric_id: z.string().optional(),
  profile_name: z.string().min(1, 'Profile name is required'),
  birth_date: z.string().optional(),
  civil_status: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_number: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  employment_status: z.enum(['active', 'inactive', 'probation', 'sick_leave', 'vacation_leave']),
  employment_type: z.enum(['regular', 'trainee', 'intern', 'probationary', 'contractual', 'part_time']),
  rate_type: z.enum(['daily', 'monthly']),
  rate_amount: z.number().min(0, 'Rate must be 0 or greater'),
  weekly_schedule: z.object({
    monday: z.string().optional(),
    tuesday: z.string().optional(),
    wednesday: z.string().optional(),
    thursday: z.string().optional(),
    friday: z.string().optional(),
    saturday: z.string().optional(),
    sunday: z.string().optional(),
  }),
})

type EmployeeFormValues = z.output<typeof employeeSchema>

interface EmployeeFormProps {
  initialEmployee?: Employee
  departmentOptions?: string[]
  scheduleTemplate?: Record<string, string>
  loading?: boolean
  onSubmit: (payload: EmployeePayload) => void
}

const defaultSchedule: Record<string, string> = {
  monday: '09:00-18:00',
  tuesday: '09:00-18:00',
  wednesday: '09:00-18:00',
  thursday: '09:00-18:00',
  friday: '09:00-18:00',
  saturday: '',
  sunday: '',
}

const scheduleDays = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const

function EmployeeForm({ initialEmployee, departmentOptions = [], scheduleTemplate = {}, loading = false, onSubmit }: EmployeeFormProps) {
  const [birthDateOpen, setBirthDateOpen] = useState(false)
  const effectiveDefaultSchedule = {
    ...defaultSchedule,
    ...scheduleTemplate,
  }

  const { control, handleSubmit, setValue } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employee_code: initialEmployee?.employee_code ?? '',
      biometric_id: initialEmployee?.biometric_id ?? '',
      profile_name: initialEmployee?.profile_name ?? '',
      birth_date: initialEmployee?.birth_date ?? '',
      civil_status: initialEmployee?.civil_status ?? '',
      emergency_contact_name: initialEmployee?.emergency_contact_name ?? '',
      emergency_contact_number: initialEmployee?.emergency_contact_number ?? '',
      department: initialEmployee?.department ?? '',
      position: initialEmployee?.position ?? '',
      employment_status: (initialEmployee?.employment_status as 'active' | 'inactive' | 'probation' | 'sick_leave' | 'vacation_leave') ?? 'active',
      employment_type: initialEmployee?.employment_type ?? 'regular',
      rate_type: initialEmployee?.rate_type ?? 'monthly',
      rate_amount: initialEmployee?.rate_amount ?? 0,
      weekly_schedule: {
        monday: initialEmployee?.weekly_schedule?.monday ?? effectiveDefaultSchedule.monday,
        tuesday: initialEmployee?.weekly_schedule?.tuesday ?? effectiveDefaultSchedule.tuesday,
        wednesday: initialEmployee?.weekly_schedule?.wednesday ?? effectiveDefaultSchedule.wednesday,
        thursday: initialEmployee?.weekly_schedule?.thursday ?? effectiveDefaultSchedule.thursday,
        friday: initialEmployee?.weekly_schedule?.friday ?? effectiveDefaultSchedule.friday,
        saturday: initialEmployee?.weekly_schedule?.saturday ?? effectiveDefaultSchedule.saturday,
        sunday: initialEmployee?.weekly_schedule?.sunday ?? effectiveDefaultSchedule.sunday,
      },
    },
  })

  useEffect(() => {
    if (initialEmployee) {
      return
    }

    scheduleDays.forEach((day) => {
      setValue(`weekly_schedule.${day.key}`, effectiveDefaultSchedule[day.key], { shouldDirty: false })
    })
  }, [effectiveDefaultSchedule.friday, effectiveDefaultSchedule.monday, effectiveDefaultSchedule.saturday, effectiveDefaultSchedule.sunday, effectiveDefaultSchedule.thursday, effectiveDefaultSchedule.tuesday, effectiveDefaultSchedule.wednesday, initialEmployee, setValue])

  const submitForm = (values: EmployeeFormValues) => {
    const normalizedWeeklySchedule = Object.fromEntries(
      Object.entries(values.weekly_schedule).map(([day, scheduleValue]) => [day, scheduleValue?.trim() ? scheduleValue.trim() : null]),
    )

    onSubmit({
      ...values,
      biometric_id: values.biometric_id?.trim() ? values.biometric_id.trim() : null,
      weekly_schedule: normalizedWeeklySchedule,
    } as EmployeePayload)
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit(submitForm)}>
      <Tabs defaultValue="basic">
        <div className="overflow-x-auto pb-1">
          <TabsList>
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="compensation">Compensation</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="basic" className="mt-3">
          <div className="rounded-md border border-slate-200 p-2.5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Controller
                name="employee_code"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Label>Employee Code</Label>
                    <Input {...field} disabled={Boolean(initialEmployee)} />
                    {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                  </div>
                )}
              />
              <Controller
                name="biometric_id"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label>Biometric ID</Label>
                    <Input {...field} placeholder="e.g. FP-10023" />
                  </div>
                )}
              />
              <Controller
                name="profile_name"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Label>Profile Name</Label>
                    <Input {...field} />
                    {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                  </div>
                )}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="personal" className="mt-3">
          <div className="rounded-md border border-slate-200 p-2.5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Controller
                name="birth_date"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label>Birth Date</Label>
                    <Popover open={birthDateOpen} onOpenChange={setBirthDateOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className={cn('w-full justify-start font-normal')}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? parseISO(field.value).toLocaleDateString() : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? parseISO(field.value) : undefined}
                          defaultMonth={field.value ? parseISO(field.value) : undefined}
                          captionLayout="dropdown"
                          onSelect={(date) => {
                            field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                            setBirthDateOpen(false)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              />
              <Controller
                name="civil_status"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label>Civil Status</Label>
                    <Select value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value)}>
                      <option value="">Select status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="separated">Separated</option>
                      <option value="widowed">Widowed</option>
                    </Select>
                  </div>
                )}
              />
              <Controller
                name="emergency_contact_name"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label>Emergency Contact Name</Label>
                    <Input {...field} />
                  </div>
                )}
              />
              <Controller
                name="emergency_contact_number"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label>Emergency Contact Number</Label>
                    <Input {...field} />
                  </div>
                )}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="employment" className="mt-3">
          <div className="rounded-md border border-slate-200 p-2.5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Controller
                name="department"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Label>Department</Label>
                    <Select value={field.value} onChange={(event) => field.onChange(event.target.value)}>
                      <option value="">Select department</option>
                      {departmentOptions.map((departmentName) => (
                        <option key={departmentName} value={departmentName}>
                          {departmentName}
                        </option>
                      ))}
                    </Select>
                    {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                  </div>
                )}
              />
              <Controller
                name="position"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Label>Position</Label>
                    <Input {...field} />
                    {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                  </div>
                )}
              />
              <Controller
                name="employment_status"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Label>Employment Status</Label>
                    <Select value={field.value} onChange={(event) => field.onChange(event.target.value)}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="probation">Probation</option>
                      <option value="sick_leave">Sick Leave</option>
                      <option value="vacation_leave">Vacation Leave</option>
                    </Select>
                    {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                  </div>
                )}
              />
              <Controller
                name="employment_type"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Label>Employment Type</Label>
                    <Select value={field.value} onChange={(event) => field.onChange(event.target.value)}>
                      <option value="regular">Regular</option>
                      <option value="trainee">Trainee</option>
                      <option value="intern">Intern</option>
                      <option value="probationary">Probationary</option>
                      <option value="contractual">Contractual</option>
                      <option value="part_time">Part Time</option>
                    </Select>
                    {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                  </div>
                )}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compensation" className="mt-3">
          <div className="rounded-md border border-slate-200 p-2.5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Controller
                name="rate_type"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Label>Rate Type</Label>
                    <Select value={field.value} onChange={(event) => field.onChange(event.target.value)}>
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                    </Select>
                    {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                  </div>
                )}
              />
              <Controller
                name="rate_amount"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Label>Rate Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={field.value}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                    />
                    {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                  </div>
                )}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-3">
          <div className="rounded-md border border-slate-200 p-2.5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {scheduleDays.map((day) => (
                <Controller
                  key={day.key}
                  name={`weekly_schedule.${day.key}`}
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <Label>{day.label}</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setValue(`weekly_schedule.${day.key}`, field.value ? '' : effectiveDefaultSchedule[day.key])
                          }}
                        >
                          {field.value ? 'Set Off' : 'Set Default'}
                        </Button>
                      </div>
                      <Input
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder={effectiveDefaultSchedule[day.key] ? `Default: ${effectiveDefaultSchedule[day.key]}` : 'Default: Off'}
                      />
                    </div>
                  )}
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {initialEmployee ? 'Update Employee' : 'Create Employee'}
        </Button>
      </div>
    </form>
  )
}

export default EmployeeForm
