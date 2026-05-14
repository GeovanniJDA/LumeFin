/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { useCategoryStoreRaw } from '../store/category-store';

export function useCategories() {
  const store = useCategoryStoreRaw();

  useEffect(() => {
    if (store.records.length === 0) store.fetch();
  }, []);

  const systemCategories = store.records.filter(c => c.is_system);
  const userCategories = store.records.filter(c => !c.is_system);

  return {
    categories: store.records,
    systemCategories,
    userCategories,
    loading: store.loading,
    error: store.error,
    addCategory: store.add,
    updateCategory: store.update,
    removeCategory: store.remove,
    refreshCategories: store.fetch,
  };
}
