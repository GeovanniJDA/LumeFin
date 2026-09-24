/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { supabase, handleSupabaseError } from '../lib/supabase';
import type { TransactionWithDependent } from '../types';
import type { TransactionFormValues } from '../lib/schemas';
import { PAGE_SIZE } from '../hooks/use-pagination';

interface TransactionStore {
  records: TransactionWithDependent[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  fetch: (range?: { from: number; to: number }) => Promise<void>;
  fetchAllPending: () => Promise<void>;
  add: (data: TransactionFormValues) => Promise<void>;
  update: (id: string, data: Partial<TransactionFormValues>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
}

export const useTransactionStoreRaw = create<TransactionStore>((set, get) => ({
  records: [],
  totalCount: 0,
  loading: false,
  error: null,
  fetch: async (range?: { from: number; to: number }) => {
    set({ loading: true, error: null });
    const from = range?.from ?? 0;
    const to = range?.to ?? PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from('dependent_transactions')
      .select('*, dependents(*), transaction_payments(amount)', { count: 'exact' })
      .order('transaction_date', { ascending: false })
      .range(from, to);

    if (error) {
      if (handleSupabaseError(error)) return;
      set({ error: error.message, loading: false });
      return;
    }
    
    set({ records: data as any as TransactionWithDependent[], totalCount: count ?? 0, loading: false, error: null });
  },
  fetchAllPending: async () => {
    set({ loading: true, error: null });
    const records: TransactionWithDependent[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('dependent_transactions')
        .select('*, dependents(*), transaction_payments(amount)')
        .eq('status', 'pending')
        .order('transaction_date', { ascending: false })
        .range(from, from + 999);

      if (error) {
        handleSupabaseError(error);
        set({ records: [], totalCount: 0, error: error.message, loading: false });
        return;
      }

      records.push(...data as any as TransactionWithDependent[]);
      if (data.length < 1000) break;
      from += 1000;
    }

    set({ records, totalCount: records.length, loading: false, error: null });
  },
  add: async (data) => {
    set({ loading: true, error: null });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ error: 'Unauthenticated', loading: false }); return; }

    const { error } = await supabase.from('dependent_transactions').insert([{ ...data, user_id: user.id }]);
    if (error) { 
      if (handleSupabaseError(error)) return;
      set({ error: error.message, loading: false }); throw new Error(error.message); 
    }
    else await get().fetch();
  },
  update: async (id, data) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('dependent_transactions').update(data).eq('id', id);
    if (error) { 
      if (handleSupabaseError(error)) return;
      set({ error: error.message, loading: false }); throw new Error(error.message); 
    }
    else await get().fetch();
  },
  remove: async (id) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('dependent_transactions').delete().eq('id', id);
    if (error) { 
      if (handleSupabaseError(error)) return;
      set({ error: error.message, loading: false }); throw new Error(error.message); 
    }
    else await get().fetch();
  },
  reset: () => set({ records: [], totalCount: 0, loading: false, error: null })
}));
