/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { supabase, handleSupabaseError } from '../lib/supabase';
import type { BillWithRelations } from '../types';
import type { BillFormValues } from '../lib/schemas';
import { PAGE_SIZE } from '../hooks/use-pagination';

interface FetchOptions {
  range?: { from: number; to: number };
  month?: string; // 'YYYY-MM' — when set, fetches ALL records for that month (no pagination)
  paidDateFrom?: string;
  paidDateTo?: string;
}

interface BillStore {
  records: BillWithRelations[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  lastFetchOptions?: FetchOptions;
  fetch: (options?: FetchOptions) => Promise<void>;
  fetchAll: () => Promise<void>;
  add: (data: BillFormValues) => Promise<void>;
  update: (id: string, data: Partial<BillFormValues>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
}

const mapBills = (data: any[] | null) => data?.map(b => ({
  ...b,
  dependents: (b.bill_dependents || []).map((bd: any) => bd.dependents).filter(Boolean)
})) ?? [];

export const useBillStoreRaw = create<BillStore>((set, get) => ({
  records: [],
  totalCount: 0,
  loading: false,
  error: null,
  lastFetchOptions: undefined,
  fetch: async (options?: FetchOptions) => {
    set({ loading: true, error: null, lastFetchOptions: options });

    let query = supabase
      .from('bills')
      .select('*, bill_categories(*), bill_dependents(dependent_id, dependents(*))', { count: 'exact' })
      .order('due_date', { ascending: true });

    if (options?.paidDateFrom || options?.paidDateTo) {
      query = query.eq('status', 'paid');
      if (options.paidDateFrom) query = query.gte('paid_date', options.paidDateFrom);
      if (options.paidDateTo) query = query.lt('paid_date', options.paidDateTo);
      const from = options.range?.from ?? 0;
      const to = options.range?.to ?? PAGE_SIZE - 1;
      query = query.range(from, to);
    } else if (options?.month) {
      // Server-side month filter — fetch ALL records for that month AND all previous recurring bills
      query = query.or(`reference_month.eq.${options.month},and(is_recurring.eq.true,reference_month.lte.${options.month})`);
    } else {
      // Paginated fetch without month filter
      const from = options?.range?.from ?? 0;
      const to = options?.range?.to ?? PAGE_SIZE - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      const authError = handleSupabaseError(error);
      set({ records: [], totalCount: 0, error: error.message, loading: false });
      if (authError) return;
      return;
    }

    set({ records: mapBills(data) as any as BillWithRelations[], totalCount: count ?? 0, loading: false, error: null });
  },
  fetchAll: async () => {
    set({ loading: true, error: null, lastFetchOptions: undefined });
    const records: BillWithRelations[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('bills')
        .select('*, bill_categories(*), bill_dependents(dependent_id, dependents(*))')
        .or('status.eq.pending,is_recurring.eq.true')
        .order('due_date', { ascending: true })
        .range(from, from + 999);

      if (error) {
        handleSupabaseError(error);
        set({ records: [], totalCount: 0, error: error.message, loading: false });
        return;
      }

      records.push(...mapBills(data) as any as BillWithRelations[]);
      if (data.length < 1000) break;
      from += 1000;
    }

    set({ records, totalCount: records.length, loading: false, error: null });
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
    
    set({ loading: false });
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
    // Re-fetch with the same options as last time so UI reflects server state
    await get().fetch(get().lastFetchOptions);
  },
  remove: async (id) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) { 
      if (handleSupabaseError(error)) return;
      set({ error: error.message, loading: false }); throw new Error(error.message); 
    }
    else set({ loading: false });
  },
  reset: () => set({ records: [], totalCount: 0, loading: false, error: null })
}));
