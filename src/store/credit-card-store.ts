/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { supabase, handleSupabaseError } from '../lib/supabase';
import type { CreditCardWithDependents } from '../types';
import type { CreditCardFormValues } from '../lib/schemas';

interface CreditCardStore {
  records: CreditCardWithDependents[];
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
    const { data, error } = await supabase.from('credit_cards')
      .select('*, legacy_dependent:dependents!credit_cards_dependent_id_fkey(*), credit_card_dependents(dependents(*))')
      .order('created_at', { ascending: false });
    if (error) { 
      if (handleSupabaseError(error)) return;
      set({ error: error.message, loading: false }); 
    }
    else set({ records: data?.map((card: any) => ({
      ...card,
      dependents: card.credit_card_dependents?.length
        ? card.credit_card_dependents.map((link: any) => link.dependents).filter(Boolean)
        : card.legacy_dependent ? [card.legacy_dependent] : []
    })) as CreditCardWithDependents[] ?? [], loading: false });
  },
  add: async (data) => {
    set({ loading: true, error: null });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ error: 'Unauthenticated', loading: false }); return; }

    const { dependent_ids = [], ...cardData } = data;
    const { data: inserted, error } = await supabase.from('credit_cards')
      .insert([{ ...cardData, dependent_id: dependent_ids[0] ?? null, user_id: user.id } as any])
      .select('id').single();
    if (error) { 
      if (handleSupabaseError(error)) return;
      set({ error: error.message, loading: false }); throw new Error(error.message); 
    }
    if (dependent_ids.length) {
      const { error: linkError } = await supabase.from('credit_card_dependents').insert(
        dependent_ids.map(dependent_id => ({ credit_card_id: inserted.id, dependent_id })) as any
      );
      if (linkError) {
        await supabase.from('credit_cards').delete().eq('id', inserted.id);
        set({ error: linkError.message, loading: false });
        throw new Error(linkError.message);
      }
    }
    await get().fetch();
  },
  update: async (id, data) => {
    set({ loading: true, error: null });
    const { dependent_ids, ...fields } = data;
    const cardData = dependent_ids === undefined
      ? fields
      : { ...fields, dependent_id: dependent_ids[0] ?? null };
    const { error } = await supabase.from('credit_cards').update(cardData as any).eq('id', id);
    if (error) { 
      if (handleSupabaseError(error)) return;
      set({ error: error.message, loading: false }); throw new Error(error.message); 
    }
    if (dependent_ids !== undefined) {
      if (dependent_ids.length) {
        const { error: insertError } = await supabase.from('credit_card_dependents').upsert(
          dependent_ids.map(dependent_id => ({ credit_card_id: id, dependent_id })) as any,
          { onConflict: 'credit_card_id,dependent_id', ignoreDuplicates: true }
        );
        if (insertError) {
          set({ error: insertError.message, loading: false });
          throw new Error(insertError.message);
        }
      }
      const deleteQuery = supabase.from('credit_card_dependents').delete().eq('credit_card_id', id);
      const { error: deleteError } = dependent_ids.length
        ? await deleteQuery.not('dependent_id', 'in', `(${dependent_ids.join(',')})`)
        : await deleteQuery;
      if (deleteError) {
        set({ error: deleteError.message, loading: false });
        throw new Error(deleteError.message);
      }
    }
    await get().fetch();
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
