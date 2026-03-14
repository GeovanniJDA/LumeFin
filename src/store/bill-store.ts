import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Bill } from '../types';

interface BillStore {
  records: Bill[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: Omit<Bill, 'id' | 'created_at'>) => Promise<void>;
  update: (id: string, data: Partial<Bill>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useBillStoreRaw = create<BillStore>((set, get) => ({
  records: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('bills').select('*').order('created_at', { ascending: false });
    if (error) set({ error: error.message, loading: false });
    else set({ records: data as Bill[], loading: false });
  },
  add: async (data) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('bills').insert([data]);
    if (error) set({ error: error.message, loading: false });
    else await get().fetch();
  },
  update: async (id, data) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('bills').update(data).eq('id', id);
    if (error) set({ error: error.message, loading: false });
    else await get().fetch();
  },
  remove: async (id) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) set({ error: error.message, loading: false });
    else await get().fetch();
  }
}));
