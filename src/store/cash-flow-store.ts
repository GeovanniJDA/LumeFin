import { create } from 'zustand';
import { supabase, handleSupabaseError } from '../lib/supabase';
import type { CashFlowEntry, CashFlowEntryType } from '../types';

export interface CashFlowEntryInput {
  entry_date: string;
  description: string;
  amount: number;
  type: CashFlowEntryType;
  is_recurring: boolean;
  recurrence?: 'weekly' | 'monthly' | null;
}

interface CashFlowStore {
  entries: CashFlowEntry[];
  loading: boolean;
  error: string | null;
  month: string | null;
  fetch: (month: string) => Promise<void>;
  add: (entry: CashFlowEntryInput) => Promise<void>;
  update: (id: string, entry: CashFlowEntryInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
}

export const useCashFlowStore = create<CashFlowStore>((set, get) => ({
  entries: [], loading: false, error: null, month: null,
  fetch: async (month) => {
    set({ loading: true, error: null, month });
    const [year, monthNumber] = month.split('-').map(Number);
    const from = `${month}-01`;
    const lastDay = String(new Date(year, monthNumber, 0).getDate()).padStart(2, '0');
    const to = `${month}-${lastDay}`;
    const { data, error } = await supabase.from('cash_flow_entries')
      .select('*')
      .or(`and(entry_date.gte.${from},entry_date.lte.${to}),and(is_recurring.eq.true,entry_date.lt.${from})`)
      .order('entry_date', { ascending: false });
    // ponytail: linhas antigas sem a coluna recurrence voltam como null — tratado na página
    if (get().month !== month) return;
    if (error) {
      handleSupabaseError(error);
      set({ entries: [], error: error.message, loading: false });
      return;
    }
    set({ entries: data as CashFlowEntry[], loading: false, error: null });
  },
  add: async (entry) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sessão expirada. Entre novamente.');
    const { error } = await supabase.from('cash_flow_entries').insert({ ...entry, user_id: user.id });
    if (error) {
      handleSupabaseError(error);
      throw new Error(error.message);
    }
    if (get().month) await get().fetch(get().month!);
  },
  update: async (id, entry) => {
    const { error } = await supabase.from('cash_flow_entries').update(entry).eq('id', id);
    if (error) {
      handleSupabaseError(error);
      throw new Error(error.message);
    }
    if (get().month) await get().fetch(get().month!);
  },
  remove: async (id) => {
    const { error } = await supabase.from('cash_flow_entries').delete().eq('id', id);
    if (error) {
      handleSupabaseError(error);
      throw new Error(error.message);
    }
    if (get().month) await get().fetch(get().month!);
  },
  reset: () => set({ entries: [], loading: false, error: null, month: null }),
}));
