/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { useTransactionStoreRaw } from '../store/transaction-store';

import { usePagination, PAGE_SIZE } from './use-pagination';
import { getTransactionRemainingCents } from '../lib/utils';

export function useTransactions(dependentId?: string, fetchAllPending = false) {
  const store = useTransactionStoreRaw();
  const { page, range, nextPage, prevPage, resetPage } = usePagination();

  useEffect(() => {
    if (fetchAllPending) store.fetchAllPending();
    else store.fetch(range);
  }, [page, fetchAllPending]);

  const getTransactionsByDependent = (id: string) => store.records.filter(t => t.dependent_id === id);

  const netBalanceByDependent = (id: string) => {
    const dep = store.records.filter(
      t => t.dependent_id === id && t.status === 'pending'
    );
    const balanceCents = dep.reduce((acc, t) => {
      const remaining = getTransactionRemainingCents(t);
      return t.type === 'to_receive' ? acc + remaining : acc - remaining;
    }, 0);
    return balanceCents / 100;
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
    refreshTransactions: () => fetchAllPending ? store.fetchAllPending() : store.fetch(range),
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
