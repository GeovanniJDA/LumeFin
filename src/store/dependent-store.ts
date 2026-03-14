import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Dependent } from '../types';
import type { DependentFormValues } from '../lib/schemas';

interface DependentStore {
  records: Dependent[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: DependentFormValues) => Promise<void>;
  update: (id: string, data: Partial<DependentFormValues>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useDependentStoreRaw = create<DependentStore>((set, get) => ({
  records: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('dependents').select('*').order('created_at', { ascending: false });
    if (error) set({ error: error.message, loading: false });
    else set({ records: data as Dependent[], loading: false });
  },
  add: async (data) => {
    set({ loading: true, error: null });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ error: 'Unauthenticated', loading: false }); return; }
    
    // Convert to row format
    const row = {
      name: data.name,
      relationship: data.relationship,
      notes: data.notes || null,
      user_id: user.id
    };

    const { error } = await supabase.from('dependents').insert([row as any]);
    if (error) set({ error: error.message, loading: false });
    else await get().fetch();
  },
  update: async (id, data) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('dependents').update(data as any).eq('id', id);
    if (error) set({ error: error.message, loading: false });
    else await get().fetch();
  },
  remove: async (id) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('dependents').delete().eq('id', id);
    if (error) set({ error: error.message, loading: false });
    else await get().fetch();
  }
}));
