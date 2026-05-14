/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { useCreditCardStoreRaw } from '../store/credit-card-store';
import { isDueSoon, isOverdue } from '../lib/utils';

export function useCreditCards() {
  const store = useCreditCardStoreRaw();

  useEffect(() => {
    store.fetch();
  }, []);

  const getDueSoonCards = () => store.records.filter(c => c.status === 'open' && isDueSoon(c.due_date));
  const getOverdueCards = () => store.records.filter(c => c.status === 'open' && isOverdue(c.due_date));

  const totalInvoiceAmount = store.records
    .filter(c => c.status === 'open' || c.status === 'closed')
    .reduce((acc, c) => acc + (c.invoice_amount || 0), 0);

  return {
    creditCards: store.records,
    loading: store.loading,
    error: store.error,
    addCreditCard: store.add,
    updateCreditCard: store.update,
    removeCreditCard: store.remove,
    refreshCreditCards: store.fetch,
    getDueSoonCards,
    getOverdueCards,
    totalInvoiceAmount,
  };
}
