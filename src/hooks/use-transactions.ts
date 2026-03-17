import { useEffect } from 'react';
import { useTransactionStoreRaw } from '../store/transaction-store';

export function useTransactions(dependentId?: string) {
  const store = useTransactionStoreRaw();

  useEffect(() => {
    if (store.records.length === 0) {
      store.fetch();
    }
  }, []);

  const getTransactionsByDependent = (id: string) => store.records.filter(t => t.dependent_id === id);

  const netBalanceByDependent = (id: string) => {
    const dep = store.records.filter(t => t.dependent_id === id);
    const toReceive = dep
      .filter(t => t.type === 'to_receive' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
    const toPay = dep
      .filter(t => t.type === 'to_pay' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
    return toReceive - toPay;
  };

  return {
    transactions: dependentId ? getTransactionsByDependent(dependentId) : store.records,
    allTransactions: store.records,
    loading: store.loading,
    error: store.error,
    addTransaction: store.add,
    updateTransaction: store.update,
    removeTransaction: store.remove,
    refreshTransactions: store.fetch,
    getTransactionsByDependent,
    netBalanceByDependent,
  };
}
