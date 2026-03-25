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
