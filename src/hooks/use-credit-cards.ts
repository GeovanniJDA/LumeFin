import { useEffect } from 'react';
import { useCreditCardStoreRaw } from '../store/credit-card-store';
import { isDueSoon, isOverdue } from '../lib/utils';

export function useCreditCards() {
  const store = useCreditCardStoreRaw();

  useEffect(() => {
    if (store.records.length === 0) {
      store.fetch();
    }
  }, []);

  const getDueSoonCards = () => store.records.filter(c => c.status === 'open' && isDueSoon(c.due_day));
  const getOverdueCards = () => store.records.filter(c => c.status === 'open' && isOverdue(c.due_day));

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
  };
}
