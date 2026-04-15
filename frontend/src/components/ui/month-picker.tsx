import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { useMemo } from 'react'

import { cn } from '../../lib/utils'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Select } from './select'

interface MonthPickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function toDate(value: string): Date | undefined {
  if (!value) {
    return undefined
  }

  const parsed = new Date(`${value}-01T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function splitMonthValue(value: string): { year: string; month: string } {
  const [year = '', month = ''] = value.split('-')
  return { year, month }
}

export function MonthPicker({ value, onChange, placeholder = 'Pick a month', className, disabled = false }: MonthPickerProps) {
  const selectedDate = toDate(value)
  const { year: selectedYear, month: selectedMonth } = splitMonthValue(value)

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 21 }, (_, index) => String(currentYear - 10 + index))
  }, [])

  const monthOptions = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  const handleMonthChange = (nextMonth: string) => {
    const nextYear = selectedYear || String(new Date().getFullYear())
    onChange(`${nextYear}-${nextMonth}`)
  }

  const handleYearChange = (nextYear: string) => {
    const nextMonth = selectedMonth || '01'
    onChange(`${nextYear}-${nextMonth}`)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn('w-full justify-start text-left font-normal', !selectedDate && 'text-slate-500 dark:text-slate-400', className)}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, 'MMMM yyyy') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-2">
          <div>
            <p className="mb-1 text-xs text-slate-500">Month</p>
            <Select value={selectedMonth || ''} onChange={(event) => handleMonthChange(event.target.value)}>
              <option value="" disabled>
                Select month
              </option>
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <p className="mb-1 text-xs text-slate-500">Year</p>
            <Select value={selectedYear || ''} onChange={(event) => handleYearChange(event.target.value)}>
              <option value="" disabled>
                Select year
              </option>
              {yearOptions.map((yearOption) => (
                <option key={yearOption} value={yearOption}>
                  {yearOption}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
