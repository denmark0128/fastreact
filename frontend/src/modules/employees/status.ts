type EmploymentStatusLabelMode = 'short' | 'full'

function toTitleCaseWithSpaces(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function getEmploymentStatusLabel(status: string, mode: EmploymentStatusLabelMode = 'short'): string {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus === 'vacation_leave') {
    return mode === 'short' ? 'VL' : 'Vacation Leave'
  }

  if (normalizedStatus === 'sick_leave') {
    return mode === 'short' ? 'SL' : 'Sick Leave'
  }

  if (normalizedStatus === 'active') {
    return 'Active'
  }

  if (normalizedStatus === 'inactive') {
    return 'Inactive'
  }

  if (normalizedStatus === 'probation') {
    return 'Probation'
  }

  return toTitleCaseWithSpaces(status)
}

export function getEmploymentStatusBadgeVariant(status: string): 'success' | 'info' | 'danger' | 'warning' {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus === 'active') {
    return 'success'
  }

  if (normalizedStatus === 'vacation_leave') {
    return 'info'
  }

  if (normalizedStatus === 'sick_leave') {
    return 'danger'
  }

  return 'warning'
}
