import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { BillCategory } from '../types';
import type { BillCategoryFormValues } from '../lib/schemas';

interface CategoryStore {
  records: BillCategory[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: BillCategoryFormValues) => Promise<BillCategory | undefined>;
  update: (id: string, data: Partial<BillCategoryFormValues>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
}

export const useCategoryStoreRaw = create<CategoryStore>((set, get) => ({
  records: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('bill_categories').select('*').order('created_at', { ascending: false });
    if (error) set({ error: error.message, loading: false });
    else set({ records: data as BillCategory[], loading: false });
  },
  add: async (data) => {
    set({ loading: true, error: null });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ error: 'Unauthenticated', loading: false }); return; }
    
    const row = {
      name: data.name,
      icon: data.icon || null,
      is_system: data.is_system,
      user_id: user.id
    };

    const { data: newRow, error } = await supabase.from('bill_categories').insert([row as any]).select().single();
    if (error) { set({ error: error.message, loading: false }); throw new Error(error.message); }
    else { await get().fetch(); return newRow as BillCategory; }
  },
  update: async (id, data) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('bill_categories').update(data as any).eq('id', id);
    if (error) { set({ error: error.message, loading: false }); throw new Error(error.message); }
    else await get().fetch();
  },
  remove: async (id) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('bill_categories').delete().eq('id', id);
    if (error) { set({ error: error.message, loading: false }); throw new Error(error.message); }
    else await get().fetch();
  },
  reset: () => set({ records: [], loading: false, error: null })
}));
