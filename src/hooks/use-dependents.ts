import { useEffect } from 'react';
import { useDependentStoreRaw } from '../store/dependent-store';

export function useDependents() {
  const store = useDependentStoreRaw();

  useEffect(() => {
    if (store.records.length === 0) {
      store.fetch();
    }
  }, []);

  return {
    dependents: store.records,
    loading: store.loading,
    error: store.error,
    addDependent: store.add,
    updateDependent: store.update,
    removeDependent: store.remove,
    refreshDependents: store.fetch,
  };
}
