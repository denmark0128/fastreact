import { useEffect, useMemo, useState } from 'react'

interface UseTableControlsOptions<T, K extends string> {
  items: T[]
  initialSortKey: K
  searchableText: (item: T) => string
  sortValue: (item: T, key: K) => string | number | null | undefined
  initialPageSize?: number
}

export function useTableControls<T, K extends string>({
  items,
  initialSortKey,
  searchableText,
  sortValue,
  initialPageSize = 10,
}: UseTableControlsOptions<T, K>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<K>(initialSortKey)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [currentPage, setCurrentPage] = useState(1)

  const filteredAndSortedItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const filtered = normalizedQuery
      ? items.filter((item) => searchableText(item).toLowerCase().includes(normalizedQuery))
      : items

    return [...filtered].sort((left, right) => {
      const leftValue = sortValue(left, sortKey)
      const rightValue = sortValue(right, sortKey)

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        const comparison = leftValue - rightValue
        return sortDirection === 'asc' ? comparison : -comparison
      }

      const leftString = String(leftValue ?? '')
      const rightString = String(rightValue ?? '')
      const comparison = leftString.localeCompare(rightString)
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [items, searchQuery, searchableText, sortDirection, sortKey, sortValue])

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedItems.length / pageSize))

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredAndSortedItems.slice(startIndex, endIndex)
  }, [currentPage, filteredAndSortedItems, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const toggleSort = (nextKey: K) => {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(nextKey)
    setSortDirection('asc')
  }

  const sortIndicator = (key: K) => {
    if (sortKey !== key) {
      return '↕'
    }
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return {
    searchQuery,
    setSearchQuery,
    sortKey,
    sortDirection,
    toggleSort,
    sortIndicator,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredAndSortedItems,
    paginatedItems,
  }
}
