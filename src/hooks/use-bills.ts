import { useEffect } from 'react';
import { useBillStoreRaw } from '../store/bill-store';
import { isDueSoon, isOverdue } from '../lib/utils';

export function useBills() {
  const store = useBillStoreRaw();

  useEffect(() => {
    store.fetch();
  }, []);

  const getDueSoonBills = () => store.records.filter(b => b.status === 'pending' && isDueSoon(b.due_date));
  const getOverdueBills = () => store.records.filter(b => b.status === 'pending' && isOverdue(b.due_date));

  const billsByMonth = (month: string) => store.records.filter(b => b.reference_month === month);
  
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const overdueCount = store.records.filter(b => 
    b.status === 'pending' && 
    b.reference_month === currentMonthStr &&
    isOverdue(b.due_date)
  ).length;

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
    billsByMonth,
    overdueCount,
  };
}
