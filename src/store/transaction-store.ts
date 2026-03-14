import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { TransactionWithDependent } from '../types';
import type { TransactionFormValues } from '../lib/schemas';

interface TransactionStore {
  records: TransactionWithDependent[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: TransactionFormValues) => Promise<void>;
  update: (id: string, data: Partial<TransactionFormValues>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useTransactionStoreRaw = create<TransactionStore>((set, get) => ({
  records: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('dependent_transactions').select('*, dependents(*)').order('created_at', { ascending: false });
    if (error) set({ error: error.message, loading: false });
    else set({ records: data as any as TransactionWithDependent[], loading: false });
  },
  add: async (data) => {
    set({ loading: true, error: null });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ error: 'Unauthenticated', loading: false }); return; }

    const { error } = await supabase.from('dependent_transactions').insert([{ ...data, user_id: user.id }]);
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
