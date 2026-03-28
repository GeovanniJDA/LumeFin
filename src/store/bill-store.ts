import { create } from 'zustand';
import { supabase, handleSupabaseError } from '../lib/supabase';
import type { BillWithRelations } from '../types';
import type { BillFormValues } from '../lib/schemas';
import { PAGE_SIZE } from '../hooks/use-pagination';

interface BillStore {
  records: BillWithRelations[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  fetch: (range?: { from: number; to: number }) => Promise<void>;
  add: (data: BillFormValues) => Promise<void>;
  update: (id: string, data: Partial<BillFormValues>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
}

export const useBillStoreRaw = create<BillStore>((set, get) => ({
  records: [],
  totalCount: 0,
  loading: false,
  error: null,
  fetch: async (range?: { from: number; to: number }) => {
    set({ loading: true, error: null });
    const from = range?.from ?? 0;
    const to = range?.to ?? PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from('bills')
      .select('*, bill_categories(*), bill_dependents(dependent_id, dependents(*))', { count: 'exact' })
      .order('due_date', { ascending: true })
      .range(from, to);

    if (error) {
      if (handleSupabaseError(error)) return;
      set({ error: error.message, loading: false });
      return;
    }

    const mapped = data?.map(b => ({
      ...b,
      dependents: (b.bill_dependents || []).map((bd: any) => bd.dependents).filter(Boolean)
    })) ?? [];
    
    set({ records: mapped as any as BillWithRelations[], totalCount: count ?? 0, loading: false, error: null });
  },
  add: async (data) => {
    set({ loading: true, error: null });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ error: 'Unauthenticated', loading: false }); return; }

    const { dependent_ids, ...billData } = data;
    const { data: inserted, error } = await supabase.from('bills').insert([{ ...billData, user_id: user.id } as any]).select().single();
    if (error) { 
      if (handleSupabaseError(error)) return;
      set({ error: error.message, loading: false }); throw new Error(error.message); 
    }
    
    if (dependent_ids && dependent_ids.length > 0) {
      const { error: depError } = await supabase.from('bill_dependents').insert(
        dependent_ids.map(id => ({ bill_id: inserted.id, dependent_id: id })) as any
      );
      if (depError) { 
        if (handleSupabaseError(depError)) return;
        set({ error: depError.message, loading: false }); throw new Error(depError.message); 
      }
    }
    
    await get().fetch();
  },
  update: async (id, data) => {
    set({ loading: true, error: null });
    const { dependent_ids, ...billData } = data;
    
    if (Object.keys(billData).length > 0) {
      const { error } = await supabase.from('bills').update(billData as any).eq('id', id);
      if (error) { 
        if (handleSupabaseError(error)) return;
        set({ error: error.message, loading: false }); throw new Error(error.message); 
      }
    }
    
    if (dependent_ids) {
      const { error: delError } = await supabase.from('bill_dependents').delete().eq('bill_id', id);
      if (delError) {
        if (handleSupabaseError(delError)) return;
      }
      if (dependent_ids.length > 0) {
        const { error: insError } = await supabase.from('bill_dependents').insert(
          dependent_ids.map(did => ({ bill_id: id, dependent_id: did })) as any
        );
        if (insError) {
          if (handleSupabaseError(insError)) return;
        }
      }
    }
    await get().fetch();
  },
  remove: async (id) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) { 
      if (handleSupabaseError(error)) return;
      set({ error: error.message, loading: false }); throw new Error(error.message); 
    }
    else await get().fetch();
  },
  reset: () => set({ records: [], totalCount: 0, loading: false, error: null })
}));
