import { useEffect } from 'react';
import { useTransactionStoreRaw } from '../store/transaction-store';
import { calculateNetBalance } from '../lib/utils';
import { usePagination, PAGE_SIZE } from './use-pagination';

export function useTransactions(dependentId?: string) {
  const store = useTransactionStoreRaw();
  const { page, range, nextPage, prevPage, resetPage } = usePagination();

  useEffect(() => {
    store.fetch(range);
  }, [page]);

  const getTransactionsByDependent = (id: string) => store.records.filter(t => t.dependent_id === id);

  const netBalanceByDependent = (id: string) => {
    const dep = store.records.filter(
      t => t.dependent_id === id && t.status === 'pending'
    );
    return calculateNetBalance(dep);
  };

  const totalCount = store.totalCount;

  return {
    transactions: dependentId ? getTransactionsByDependent(dependentId) : store.records,
    allTransactions: store.records,
    loading: store.loading,
    error: store.error,
    addTransaction: store.add,
    updateTransaction: store.update,
    removeTransaction: store.remove,
    refreshTransactions: () => store.fetch(range),
    getTransactionsByDependent,
    netBalanceByDependent,

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
