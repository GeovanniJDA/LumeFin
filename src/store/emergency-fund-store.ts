import { create } from 'zustand';
import { supabase, handleSupabaseError } from '../lib/supabase';
import type {
  EmergencyFundGoal,
  EmergencyFundContribution,
  EmergencyFundContributionType,
} from '../types';

export interface GoalInput {
  name?: string;
  target_amount: number;
  target_date?: string | null;
  notes?: string | null;
}

export interface ContributionInput {
  amount: number;
  type: EmergencyFundContributionType;
  contribution_date: string;
  notes?: string | null;
}

interface EmergencyFundStore {
  goal: EmergencyFundGoal | null;
  contributions: EmergencyFundContribution[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  saveGoal: (input: GoalInput) => Promise<EmergencyFundGoal>;
  addContribution: (input: ContributionInput) => Promise<void>;
  updateContribution: (id: string, input: Partial<ContributionInput>) => Promise<void>;
  removeContribution: (id: string) => Promise<void>;
  reset: () => void;
}

export const useEmergencyFundStore = create<EmergencyFundStore>((set, get) => ({
  goal: null,
  contributions: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ goal: null, contributions: [], loading: false });
        return;
      }

      const [goalRes, contribRes] = await Promise.all([
        supabase
          .from('emergency_fund_goals')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('emergency_fund_contributions')
          .select('*')
          .eq('user_id', user.id)
          .order('contribution_date', { ascending: false })
          .order('created_at', { ascending: false }),
      ]);

      if (goalRes.error) {
        handleSupabaseError(goalRes.error);
        set({ error: goalRes.error.message, loading: false });
        return;
      }

      if (contribRes.error) {
        handleSupabaseError(contribRes.error);
        set({ error: contribRes.error.message, loading: false });
        return;
      }

      set({
        goal: (goalRes.data as EmergencyFundGoal) || null,
        contributions: (contribRes.data as EmergencyFundContribution[]) || [],
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados da reserva.';
      set({ error: msg, loading: false });
    }
  },

  saveGoal: async (input: GoalInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sessão expirada. Entre novamente.');

    const currentGoal = get().goal;
    const payload = {
      name: input.name?.trim() || 'Reserva de Emergência',
      target_amount: input.target_amount,
      target_date: input.target_date || null,
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (currentGoal) {
      const { data, error } = await supabase
        .from('emergency_fund_goals')
        .update(payload)
        .eq('id', currentGoal.id)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
        throw new Error(error.message);
      }
      set({ goal: data as EmergencyFundGoal });
      return data as EmergencyFundGoal;
    } else {
      const { data, error } = await supabase
        .from('emergency_fund_goals')
        .insert({
          ...payload,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
        throw new Error(error.message);
      }
      set({ goal: data as EmergencyFundGoal });
      return data as EmergencyFundGoal;
    }
  },

  addContribution: async (input: ContributionInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sessão expirada. Entre novamente.');

    let goal = get().goal;
    if (!goal) {
      // Auto-create a default goal of R$ 5.000 if not created yet
      goal = await get().saveGoal({
        name: 'Reserva de Emergência',
        target_amount: 5000,
      });
    }

    const { error } = await supabase
      .from('emergency_fund_contributions')
      .insert({
        goal_id: goal.id,
        user_id: user.id,
        amount: input.amount,
        type: input.type,
        contribution_date: input.contribution_date,
        notes: input.notes?.trim() || null,
      });

    if (error) {
      handleSupabaseError(error);
      throw new Error(error.message);
    }

    await get().fetch();
  },

  updateContribution: async (id: string, input: Partial<ContributionInput>) => {
    const { error } = await supabase
      .from('emergency_fund_contributions')
      .update({
        ...input,
        notes: input.notes !== undefined ? input.notes?.trim() || null : undefined,
      })
      .eq('id', id);

    if (error) {
      handleSupabaseError(error);
      throw new Error(error.message);
    }

    await get().fetch();
  },

  removeContribution: async (id: string) => {
    const { error } = await supabase
      .from('emergency_fund_contributions')
      .delete()
      .eq('id', id);

    if (error) {
      handleSupabaseError(error);
      throw new Error(error.message);
    }

    await get().fetch();
  },

  reset: () => set({ goal: null, contributions: [], loading: false, error: null }),
}));
