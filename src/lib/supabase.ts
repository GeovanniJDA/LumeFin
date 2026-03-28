import { createClient } from '@supabase/supabase-js';
import type { 
  Dependent, BillCategory, Bill, BillDependent, 
  CreditCard, DependentTransaction 
} from '../types';

export interface Database {
  public: {
    Tables: {
      dependents: {
        Row: Dependent;
        Insert: Omit<Dependent, 'id' | 'created_at'>;
        Update: Partial<Omit<Dependent, 'id' | 'created_at'>>;
      };
      bill_categories: {
        Row: BillCategory;
        Insert: Omit<BillCategory, 'id' | 'created_at'>;
        Update: Partial<Omit<BillCategory, 'id' | 'created_at'>>;
      };
      bills: {
        Row: Bill;
        Insert: Omit<Bill, 'id' | 'created_at'>;
        Update: Partial<Omit<Bill, 'id' | 'created_at'>>;
      };
      bill_dependents: {
        Row: BillDependent;
        Insert: BillDependent;
        Update: Partial<BillDependent>;
      };
      credit_cards: {
        Row: CreditCard;
        Insert: Omit<CreditCard, 'id' | 'created_at'>;
        Update: Partial<Omit<CreditCard, 'id' | 'created_at'>>;
      };
      dependent_transactions: {
        Row: DependentTransaction;
        Insert: Omit<DependentTransaction, 'id' | 'created_at'>;
        Update: Partial<Omit<DependentTransaction, 'id' | 'created_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

import { env } from './env';

export const supabase = createClient<any>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
});

import { useBillStoreRaw } from '../store/bill-store';
import { useDependentStoreRaw } from '../store/dependent-store';
import { useCreditCardStoreRaw } from '../store/credit-card-store';
import { useTransactionStoreRaw } from '../store/transaction-store';
import { useProfileStore } from '../store/profile-store';

export const handleSupabaseError = (error: any) => {
  if (
    error?.code === 'PGRST301' ||
    error?.message?.includes('JWT') ||
    error?.message?.includes('session') ||
    error?.status === 401
  ) {
    supabase.auth.signOut();
    return true;
  }
  return false;
};

export function setupAuthListener(navigate: (path: string) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
      useBillStoreRaw.getState().reset();
      useDependentStoreRaw.getState().reset();
      useCreditCardStoreRaw.getState().reset();
      useTransactionStoreRaw.getState().reset();
      useProfileStore.getState().reset();
      navigate('/auth');
    }
  });
}
