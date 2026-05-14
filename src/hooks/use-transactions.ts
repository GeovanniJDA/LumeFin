/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { useTransactionStoreRaw } from '../store/transaction-store';

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
    return dep.reduce((acc, t) => {
      const txPaymentsTotal = t.transaction_payments?.reduce((s: number, p: { amount: number }) => s + p.amount, 0) || 0;
      const installmentTotal = t.payment_type === 'installment' ? ((t.paid_installments || 0) / (t.installments || 1)) * t.amount : 0;
      const totalPaid = Math.min(txPaymentsTotal + installmentTotal, t.amount);
      const remaining = Math.max(t.amount - totalPaid, 0);
      return t.type === 'to_receive' ? acc + remaining : acc - remaining;
    }, 0);
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
