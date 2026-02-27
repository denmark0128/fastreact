import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select } from '../ui/select'

interface TableToolbarProps {
  searchPlaceholder: string
  searchQuery: string
  onSearchChange: (value: string) => void
  pageSize: number
  onPageSizeChange: (value: number) => void
}

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPrevious: () => void
  onNext: () => void
}

export function TableToolbar({
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  pageSize,
  onPageSizeChange,
}: TableToolbarProps) {
  return (
    <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <Input
        placeholder={searchPlaceholder}
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        className="md:max-w-sm"
      />
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Rows per page</span>
        <Select value={String(pageSize)} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="w-24">
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
        </Select>
      </div>
    </div>
  )
}

export function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPrevious,
  onNext,
}: TablePaginationProps) {
  const from = (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="mt-3 flex items-center justify-between">
      <p className="text-sm text-slate-500">
        Showing {from}-{to} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={onPrevious}>
          Previous
        </Button>
        <p className="text-sm text-slate-600">Page {currentPage} of {totalPages}</p>
        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  )
}
