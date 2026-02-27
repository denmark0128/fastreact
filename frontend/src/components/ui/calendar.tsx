import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '../../lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const isDropdownCaption = props.captionLayout === 'dropdown'

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-2', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: isDropdownCaption ? 'sr-only' : 'text-sm font-medium',
        caption_dropdowns: 'flex items-center gap-1',
        dropdown: 'h-8 rounded-md border border-slate-200 bg-white px-2 text-sm',
        dropdown_month: 'h-8 rounded-md border border-slate-200 bg-white px-2 text-sm',
        dropdown_year: 'h-8 rounded-md border border-slate-200 bg-white px-2 text-sm',
        nav: isDropdownCaption ? 'hidden' : 'space-x-1 flex items-center',
        nav_button: 'h-7 w-7 bg-transparent p-0 text-slate-600 hover:text-slate-900',
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-slate-500 rounded-md w-8 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-8 w-8 text-center text-sm p-0 relative',
        day: 'h-8 w-8 p-0 font-normal rounded-md hover:bg-slate-100',
        day_selected: 'bg-slate-900 text-white hover:bg-slate-900 hover:text-white',
        day_today: 'bg-slate-100 text-slate-900',
        day_outside: 'text-slate-400',
        day_disabled: 'text-slate-400 opacity-50',
        day_range_middle: 'aria-selected:bg-slate-100 aria-selected:text-slate-900',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}

export { Calendar }