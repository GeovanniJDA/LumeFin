import { useState } from 'react'

export const PAGE_SIZE = 20

export function usePagination() {
  const [page, setPage] = useState(0)

  const nextPage = () => setPage(p => p + 1)
  const prevPage = () => setPage(p => Math.max(0, p - 1))
  const resetPage = () => setPage(0)

  const range = {
    from: page * PAGE_SIZE,
    to: page * PAGE_SIZE + PAGE_SIZE - 1
  }

  return { page, range, nextPage, prevPage, resetPage }
}
