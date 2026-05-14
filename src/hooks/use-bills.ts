/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { useBillStoreRaw } from '../store/bill-store';
import { isDueSoon, isOverdue } from '../lib/utils';
import { usePagination, PAGE_SIZE } from './use-pagination';

export function useBills() {
  const store = useBillStoreRaw();
  const { page, range, nextPage, prevPage, resetPage } = usePagination();

  useEffect(() => {
    store.fetch(range);
  }, [page]);

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
    refreshBills: () => store.fetch(range),
    getDueSoonBills,
    getOverdueBills,
    billsByMonth,
    overdueCount,
    
    // Pagination
    page,
    totalCount,
    totalPages: Math.ceil(totalCount / PAGE_SIZE),
    hasNextPage: (page + 1) * PAGE_SIZE < totalCount,
    hasPrevPage: page > 0,
    nextPage,
    prevPage,
    resetPage,
  };
}
