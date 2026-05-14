/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { supabase, handleSupabaseError } from '../lib/supabase';
import type { CreditCardWithDependent } from '../types';
import type { CreditCardFormValues } from '../lib/schemas';

interface CreditCardStore {
  records: CreditCardWithDependent[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: CreditCardFormValues) => Promise<void>;
  update: (id: string, data: Partial<CreditCardFormValues>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
}

export const useCreditCardStoreRaw = create<CreditCardStore>((set, get) => ({
  records: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('credit_cards').select('*, dependents(*)').order('created_at', { ascending: false });
    if (error) { 
      if (handleSupabaseError(error)) return;
      set({ error: error.message, loading: false }); 
    }
    else set({ records: data as any as CreditCardWithDependent[], loading: false });
  },
  add: async (data) => {
    set({ loading: true, error: null });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ error: 'Unauthenticated', loading: false }); return; }

    const { error } = await supabase.from('credit_cards').insert([{ ...data, user_id: user.id } as any]);
    if (error) { 
      if (handleSupabaseError(error)) return;
      set({ error: error.message, loading: false }); throw new Error(error.message); 
    }
    else await get().fetch();
  },
  update: async (id, data) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('credit_cards').update(data as any).eq('id', id);
    if (error) { 
      if (handleSupabaseError(error)) return;
      set({ error: error.message, loading: false }); throw new Error(error.message); 
    }
    else await get().fetch();
  },
  remove: async (id) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (error) { 
      if (handleSupabaseError(error)) return;
      set({ error: error.message, loading: false }); throw new Error(error.message); 
    }
    else await get().fetch();
  },
  reset: () => set({ records: [], loading: false, error: null })
}));
