/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 1000;

export interface FinanceExportData {
  bills: any[];
  cards: any[];
  purchases: any[];
  cashFlow: any[];
  emergencyGoal: any | null;
  contributions: any[];
}

async function fetchAllRows(
  queryPage: (from: number, to: number) => PromiseLike<{
    data: any[] | null;
    error: { message: string } | null;
  }>,
) {
  const rows: any[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await queryPage(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export async function fetchFinanceExportData(): Promise<FinanceExportData> {
  const [bills, cards, purchases, cashFlow, goalResult, contributions] = await Promise.all([
    fetchAllRows((from, to) => supabase.from('bills')
      .select('*, bill_categories(name), bill_dependents(dependents(name))')
      .order('due_date', { ascending: true }).range(from, to)),
    fetchAllRows((from, to) => supabase.from('credit_cards')
      .select('*, credit_card_dependents(dependents(name))')
      .order('created_at', { ascending: false }).range(from, to)),
    fetchAllRows((from, to) => supabase.from('card_purchases')
      .select('*, credit_cards(name), card_purchase_dependents(dependents(name))')
      .order('purchase_date', { ascending: false }).range(from, to)),
    fetchAllRows((from, to) => supabase.from('cash_flow_entries')
      .select('*').order('entry_date', { ascending: false }).range(from, to)),
    supabase.from('emergency_fund_goals').select('*').maybeSingle(),
    fetchAllRows((from, to) => supabase.from('emergency_fund_contributions')
      .select('*').order('contribution_date', { ascending: false }).range(from, to)),
  ]);

  if (goalResult.error) throw new Error(goalResult.error.message);
  return { bills, cards, purchases, cashFlow, emergencyGoal: goalResult.data, contributions };
}
