import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { DependentTransaction } from '../types';

interface TransactionStore {
  records: DependentTransaction[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: Omit<DependentTransaction, 'id' | 'created_at'>) => Promise<void>;
  update: (id: string, data: Partial<DependentTransaction>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useTransactionStoreRaw = create<TransactionStore>((set, get) => ({
  records: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('dependent_transactions').select('*').order('created_at', { ascending: false });
    if (error) set({ error: error.message, loading: false });
    else set({ records: data as DependentTransaction[], loading: false });
  },
  add: async (data) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('dependent_transactions').insert([data]);
    if (error) set({ error: error.message, loading: false });
    else await get().fetch();
  },
  update: async (id, data) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('dependent_transactions').update(data).eq('id', id);
    if (error) set({ error: error.message, loading: false });
    else await get().fetch();
  },
  remove: async (id) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('dependent_transactions').delete().eq('id', id);
    if (error) set({ error: error.message, loading: false });
    else await get().fetch();
  }
}));
