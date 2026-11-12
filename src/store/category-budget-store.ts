import { create } from 'zustand';
import { supabase, handleSupabaseError } from '../lib/supabase';
import type { CategoryBudget } from '../types';

interface CategoryBudgetStore {
  records: CategoryBudget[];
  loading: boolean;
  error: string | null;
  fetch: (month: string) => Promise<void>;
  save: (categoryId: string, month: string, limitAmount: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
}

export const useCategoryBudgetStore = create<CategoryBudgetStore>((set) => ({
  records: [],
  loading: false,
  error: null,

  fetch: async (month) => {
    set({ loading: true, error: null });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ records: [], loading: false });
      return;
    }

    const { data, error } = await supabase
      .from('category_budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('reference_month', month)
      .order('created_at');

    if (error) {
      handleSupabaseError(error);
      set({ error: error.message, loading: false });
      return;
    }
    set({ records: data as CategoryBudget[], loading: false, error: null });
  },

  save: async (categoryId, month, limitAmount) => {
    if (!Number.isFinite(limitAmount) || limitAmount <= 0) throw new Error('O limite deve ser maior que zero.');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sessão expirada. Entre novamente.');

    const { data, error } = await supabase
      .from('category_budgets')
      .upsert({
        user_id: user.id,
        category_id: categoryId,
        reference_month: month,
        limit_amount: Math.round(limitAmount * 100) / 100,
      }, { onConflict: 'user_id,category_id,reference_month' })
      .select()
      .single();

    if (error) {
      handleSupabaseError(error);
      throw new Error(error.message);
    }
    set(state => ({ records: [...state.records.filter(item => item.id !== data.id && item.category_id !== categoryId), data as CategoryBudget] }));
  },

  remove: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sessão expirada. Entre novamente.');
    const { error } = await supabase.from('category_budgets').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      handleSupabaseError(error);
      throw new Error(error.message);
    }
    set(state => ({ records: state.records.filter(item => item.id !== id) }));
  },

  reset: () => set({ records: [], loading: false, error: null }),
}));
