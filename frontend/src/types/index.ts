export type UserRole = 'admin' | 'hr_manager' | 'employee'

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface AuthUser {
  id: number
  email: string
  full_name: string
  profile_picture_url?: string | null
  contact_number?: string | null
  street?: string | null
  city?: string | null
  region?: string | null
  role: UserRole
}

export interface LoginPayload {
  email: string
  password: string
}

export interface SignupPayload {
  email: string
  full_name: string
  password: string
  department: string
}

export interface AuthTokenData {
  access_token: string
  token_type: string
  user: AuthUser
}

export interface Employee {
  id: number
  user_id: number | null
  biometric_id?: string | null
  employee_code: string
  profile_name: string
  birth_date?: string | null
  civil_status?: string | null
  emergency_contact_name?: string | null
  emergency_contact_number?: string | null
  contact_number?: string | null
  street?: string | null
  city?: string | null
  region?: string | null
  department: string
  position: string
  employment_status: string
  employment_type: 'regular' | 'trainee' | 'intern' | 'probationary' | 'contractual' | 'part_time'
  rate_type: 'daily' | 'monthly'
  rate_amount: number
  hourly_rate: number
  weekly_schedule: Record<string, string | null>
}

export interface EmployeePayload {
  user_id?: number | null
  biometric_id?: string | null
  employee_code: string
  profile_name: string
  birth_date?: string | null
  civil_status?: string | null
  emergency_contact_name?: string | null
  emergency_contact_number?: string | null
  department: string
  position: string
  employment_status: string
  employment_type?: 'regular' | 'trainee' | 'intern' | 'probationary' | 'contractual' | 'part_time'
  rate_type?: 'daily' | 'monthly'
  rate_amount?: number
  hourly_rate?: number
  weekly_schedule?: Record<string, string | null>
}

export interface EmployeeUpdatePayload {
  biometric_id?: string | null
  profile_name?: string
  birth_date?: string | null
  civil_status?: string | null
  emergency_contact_name?: string | null
  emergency_contact_number?: string | null
  department?: string
  position?: string
  employment_status?: string
  employment_type?: 'regular' | 'trainee' | 'intern' | 'probationary' | 'contractual' | 'part_time'
  rate_type?: 'daily' | 'monthly'
  rate_amount?: number
  hourly_rate?: number
  weekly_schedule?: Record<string, string | null>
}

export interface Department {
  id: number
  name: string
  description?: string | null
  head_employee_id?: number | null
}

export interface DepartmentCreatePayload {
  name: string
  description?: string | null
  head_employee_id?: number | null
}

export interface DepartmentUpdatePayload {
  name?: string
  description?: string | null
  head_employee_id?: number | null
}

export interface CompanyProfile {
  id: number
  company_name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  contact_number?: string | null
  street?: string | null
  city?: string | null
  region?: string | null
  logo_url?: string | null
}

export interface CompanyProfileUpdatePayload {
  company_name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  contact_number?: string | null
  street?: string | null
  city?: string | null
  region?: string | null
  logo_url?: string | null
}

export interface AdminSettings {
  id: number
  late_grace_minutes: number
  minimum_overtime_minutes: number
  undertime_rounding_minutes: number
  payroll_cutoff_mode: string
  employee_self_service_enabled: boolean
  allow_hr_process_payroll: boolean
  allow_hr_manage_employees: boolean
  allow_hr_manage_settings: boolean
  default_employee_role: string
  default_rate_type: string
  default_shift_start: string
  default_shift_end: string
  default_work_days: string
}

export interface AdminSettingsUpdatePayload {
  late_grace_minutes: number
  minimum_overtime_minutes: number
  undertime_rounding_minutes: number
  payroll_cutoff_mode: string
  employee_self_service_enabled: boolean
  allow_hr_process_payroll: boolean
  allow_hr_manage_employees: boolean
  allow_hr_manage_settings: boolean
  default_employee_role: string
  default_rate_type: string
  default_shift_start: string
  default_shift_end: string
  default_work_days: string
}

export interface UserProfileUpdatePayload {
  full_name: string
  profile_picture_url?: string | null
  contact_number?: string | null
  street?: string | null
  city?: string | null
  region?: string | null
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
}

export interface PayrollAdjustmentPayload {
  employee_id: number
  actual_minutes?: number
  late_minutes?: number
  overtime_minutes?: number
  allowances?: number
  other_deductions?: number
  notes?: string
}

export interface PayrollProcessPayload {
  cutoff_start: string
  cutoff_end: string
  pay_date?: string
  employee_ids?: number[]
  adjustments?: PayrollAdjustmentPayload[]
}

export interface PayrollRecord {
  id: number
  employee_id: number
  employee_code: string
  profile_name: string
  cutoff_start: string
  cutoff_end: string
  pay_date: string
  scheduled_minutes: number
  actual_minutes: number
  late_minutes: number
  undertime_minutes: number
  overtime_minutes: number
  allowances: number
  other_deductions: number
  basic_pay: number
  overtime_pay: number
  late_deduction: number
  undertime_deduction: number
  gross_pay: number
  net_pay: number
  notes?: string | null
}

export interface PayrollSummary {
  cutoff_start?: string | null
  cutoff_end?: string | null
  record_count: number
  total_gross_pay: number
  total_net_pay: number
  total_late_minutes: number
  total_undertime_minutes: number
  total_overtime_minutes: number
}

export interface AuditLog {
  id: number
  actor_user_id?: number | null
  actor_email?: string | null
  action: string
  entity_type: string
  entity_id?: string | null
  details?: Record<string, unknown> | null
  created_at: string
}

export interface AuditLogList {
  items: AuditLog[]
  total: number
  limit: number
  offset: number
}
