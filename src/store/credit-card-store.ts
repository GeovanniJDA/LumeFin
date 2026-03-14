import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { CreditCard } from '../types';

interface CreditCardStore {
  records: CreditCard[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: Omit<CreditCard, 'id' | 'created_at'>) => Promise<void>;
  update: (id: string, data: Partial<CreditCard>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useCreditCardStoreRaw = create<CreditCardStore>((set, get) => ({
  records: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('credit_cards').select('*').order('created_at', { ascending: false });
    if (error) set({ error: error.message, loading: false });
    else set({ records: data as CreditCard[], loading: false });
  },
  add: async (data) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('credit_cards').insert([data]);
    if (error) set({ error: error.message, loading: false });
    else await get().fetch();
  },
  update: async (id, data) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('credit_cards').update(data).eq('id', id);
    if (error) set({ error: error.message, loading: false });
    else await get().fetch();
  },
  remove: async (id) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (error) set({ error: error.message, loading: false });
    else await get().fetch();
  }
}));
