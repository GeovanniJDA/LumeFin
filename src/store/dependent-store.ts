import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Dependent } from '../types';

interface DependentStore {
  records: Dependent[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: Omit<Dependent, 'id' | 'created_at'>) => Promise<void>;
  update: (id: string, data: Partial<Dependent>) => Promise<void>;
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
    const { error } = await supabase.from('dependents').insert([data]);
    if (error) set({ error: error.message, loading: false });
    else await get().fetch();
  },
  update: async (id, data) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('dependents').update(data).eq('id', id);
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
