import { useEffect } from 'react';
import { useTransactionStoreRaw } from '../store/transaction-store';
import { calculateNetBalance } from '../lib/utils';

export function useTransactions(dependentId?: string) {
  const store = useTransactionStoreRaw();

  useEffect(() => {
    if (store.records.length === 0) {
      store.fetch();
    }
  }, []);

  const getTransactionsByDependent = (id: string) => store.records.filter(t => t.dependent_id === id);
  const getNetBalance = (id: string) => calculateNetBalance(getTransactionsByDependent(id));

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
    getNetBalance,
  };
}
