/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { addDays, parseISO, startOfDay } from 'date-fns';
import { useBillStoreRaw } from '../store/bill-store';
import { isDueSoon, isOverdue } from '../lib/utils';
import { usePagination, PAGE_SIZE } from './use-pagination';

export function useBills(
  filterMonth?: string,
  fetchAll = false,
  paidDateRange?: { from: string; to: string }
) {
  const store = useBillStoreRaw();
  const { page, range, nextPage, prevPage, resetPage } = usePagination();
  const paidDateFrom = paidDateRange?.from
    ? startOfDay(parseISO(paidDateRange.from)).toISOString()
    : undefined;
  const paidDateTo = paidDateRange?.to
    ? addDays(startOfDay(parseISO(paidDateRange.to)), 1).toISOString()
    : undefined;

  useEffect(() => {
    if (fetchAll) {
      store.fetchAll();
    } else if (paidDateFrom || paidDateTo) {
      store.fetch({ paidDateFrom, paidDateTo, range });
    } else if (filterMonth) {
      // Server-side month filter: fetch ALL records for that month
      store.fetch({ month: filterMonth });
    } else {
      store.fetch({ range });
    }
  }, [page, filterMonth, fetchAll, paidDateFrom, paidDateTo]);

  const getDueSoonBills = () => store.records.filter(b => b.status === 'pending' && isDueSoon(b.due_date));
  const getOverdueBills = () => store.records.filter(b => b.status === 'pending' && isOverdue(b.due_date));

  const billsByMonth = (month: string) => store.records.filter(b => b.reference_month === month);
  
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const overdueCount = store.records.filter(b => 
    b.status === 'pending' && 
    b.reference_month === currentMonthStr &&
    isOverdue(b.due_date)
  ).length;

  const totalCount = store.totalCount;

  return {
    bills: store.records,
    loading: store.loading,
    error: store.error,
    addBill: store.add,
    updateBill: store.update,
    removeBill: store.remove,
    refreshBills: () => fetchAll
      ? store.fetchAll()
      : paidDateFrom || paidDateTo
        ? store.fetch({ paidDateFrom, paidDateTo, range })
        : filterMonth
          ? store.fetch({ month: filterMonth })
          : store.fetch({ range }),
    getDueSoonBills,
    getOverdueBills,
    billsByMonth,
    overdueCount,
    
    // Pagination (only meaningful when no month filter)
    page,
    totalCount,
    totalPages: Math.ceil(totalCount / PAGE_SIZE),
    hasNextPage: !filterMonth && (page + 1) * PAGE_SIZE < totalCount,
    hasPrevPage: !filterMonth && page > 0,
    nextPage,
    prevPage,
    resetPage,
  };
}
