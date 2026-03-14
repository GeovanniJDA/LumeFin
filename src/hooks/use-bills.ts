import { useEffect } from 'react';
import { useBillStoreRaw } from '../store/bill-store';
import { isDueSoon, isOverdue } from '../lib/utils';
import { Bill } from '../types';

export function useBills() {
  const store = useBillStoreRaw();

  useEffect(() => {
    if (store.records.length === 0) {
      store.fetch();
    }
  }, []);

  const getDueSoonBills = () => store.records.filter(b => b.status === 'pending' && isDueSoon(b.due_day));
  const getOverdueBills = () => store.records.filter(b => b.status === 'pending' && isOverdue(b.due_day));

  return {
    bills: store.records,
    loading: store.loading,
    error: store.error,
    addBill: store.add,
    updateBill: store.update,
    removeBill: store.remove,
    refreshBills: store.fetch,
    getDueSoonBills,
    getOverdueBills,
  };
}
