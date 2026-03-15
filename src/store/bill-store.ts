import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { BillWithRelations } from '../types';
import type { BillFormValues } from '../lib/schemas';

interface BillStore {
  records: BillWithRelations[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (data: BillFormValues) => Promise<void>;
  update: (id: string, data: Partial<BillFormValues>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useBillStoreRaw = create<BillStore>((set, get) => ({
  records: [],
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.from('bills').select('*, bill_categories(*), bill_dependents(dependent_id, dependents(*))').order('created_at', { ascending: false });
    if (error) set({ error: error.message, loading: false });
    else {
      const mapped = data?.map(b => ({
        ...b,
        dependents: (b.bill_dependents || []).map((bd: any) => ({ id: bd.dependent_id }))
      }));
      set({ records: mapped as any as BillWithRelations[], loading: false });
    }
  },
  add: async (data) => {
    set({ loading: true, error: null });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ error: 'Unauthenticated', loading: false }); return; }

    const { dependent_ids, ...billData } = data;
    const { data: inserted, error } = await supabase.from('bills').insert([{ ...billData, user_id: user.id } as any]).select().single();
    if (error) { set({ error: error.message, loading: false }); return; }
    
    if (dependent_ids && dependent_ids.length > 0) {
      const { error: depError } = await supabase.from('bill_dependents').insert(
        dependent_ids.map(id => ({ bill_id: inserted.id, dependent_id: id })) as any
      );
      if (depError) { set({ error: depError.message, loading: false }); return; }
    }
    
    await get().fetch();
  },
  update: async (id, data) => {
    set({ loading: true, error: null });
    const { dependent_ids, ...billData } = data;
    
    if (Object.keys(billData).length > 0) {
      const { error } = await supabase.from('bills').update(billData as any).eq('id', id);
      if (error) { set({ error: error.message, loading: false }); return; }
    }
    
    if (dependent_ids) {
      // Re-create relations: remove old and insert new.
      await supabase.from('bill_dependents').delete().eq('bill_id', id);
      if (dependent_ids.length > 0) {
        await supabase.from('bill_dependents').insert(
          dependent_ids.map(did => ({ bill_id: id, dependent_id: did })) as any
        );
      }
    }
    await get().fetch();
  },
  remove: async (id) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) set({ error: error.message, loading: false });
    else await get().fetch();
  }
}));
