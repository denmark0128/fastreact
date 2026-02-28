import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'

import { cn } from '../../lib/utils'
import { Button } from './button'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

interface DatePickerProps {
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

  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function toIsoDate(value: Date | undefined): string {
  if (!value) {
    return ''
  }

  return format(value, 'yyyy-MM-dd')
}

export function DatePicker({ value, onChange, placeholder = 'Pick a date', className, disabled = false }: DatePickerProps) {
  const selectedDate = toDate(value)

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
          {selectedDate ? format(selectedDate, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={selectedDate} onSelect={(date) => onChange(toIsoDate(date))} initialFocus />
      </PopoverContent>
    </Popover>
  )
}