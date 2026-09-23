import { create } from 'zustand'
import { supabase, handleSupabaseError } from '@/lib/supabase'
import type { CardPurchase, CardPurchaseWithDependents } from '@/types'

type CardPurchaseInput = Omit<CardPurchase, 'id'|'user_id'|'credit_card_id'|'created_at'> & {
  dependent_ids?: string[]
}

const withDependents = (purchase: any): CardPurchaseWithDependents => ({
  ...purchase,
  dependents: purchase.card_purchase_dependents?.map((link: any) => link.dependents).filter(Boolean) ?? []
})

interface CardPurchaseStore {
  purchases: CardPurchaseWithDependents[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  fetchByCard: (cardId: string) => Promise<void>
  add: (cardId: string, data: CardPurchaseInput) => Promise<void>
  update: (id: string, data: Partial<CardPurchaseInput>) => Promise<void>
  remove: (id: string) => Promise<void>
  reset: () => void
}

export const useCardPurchaseStore = create<CardPurchaseStore>((set, get) => ({
  purchases: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('card_purchases')
      .select('*, card_purchase_dependents(dependents(*))')
      .order('purchase_date', { ascending: false })

    if (error) {
      const authError = handleSupabaseError(error)
      set({ purchases: [], error: error.message, loading: false })
      if (authError) return
      return
    }
    set({ purchases: (data ?? []).map(withDependents), loading: false, error: null })
  },
  
  fetchByCard: async (cardId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('card_purchases')
      .select('*, card_purchase_dependents(dependents(*))')
      .eq('credit_card_id', cardId)
      .order('purchase_date', { ascending: false })
      
    if (error) {
      if (handleSupabaseError(error)) {
        set(state => ({ purchases: state.purchases.filter(p => p.credit_card_id !== cardId), loading: false }))
        return
      }
      set(state => ({ purchases: state.purchases.filter(p => p.credit_card_id !== cardId), error: error.message, loading: false }))
      return
    }
    set(state => ({
      purchases: [
        ...state.purchases.filter(p => p.credit_card_id !== cardId),
        ...(data ?? []).map(withDependents)
      ],
      loading: false,
      error: null
    }))
  },
  
  add: async (cardId, data) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')
    
    const { dependent_ids = [], ...purchaseData } = data
    const { data: inserted, error } = await supabase
      .from('card_purchases')
      .insert({ ...purchaseData, credit_card_id: cardId, user_id: user.id, current_installment: 1 })
      .select('id').single()
      
    if (error) throw new Error(error.message)
    
    if (dependent_ids.length) {
      const { error: linkError } = await supabase.from('card_purchase_dependents').insert(
        dependent_ids.map(dependent_id => ({ card_purchase_id: inserted.id, dependent_id })) as any
      )
      if (linkError) {
        await supabase.from('card_purchases').delete().eq('id', inserted.id)
        throw new Error(linkError.message)
      }
    }
    await get().fetchByCard(cardId)
    await recalculateInvoice(cardId, data.reference_month)
  },
  
  update: async (id, data) => {
    const purchase = get().purchases.find(p => p.id === id)
    const { dependent_ids, ...purchaseData } = data
    const { error } = await supabase
      .from('card_purchases')
      .update(purchaseData)
      .eq('id', id)
      
    if (error) throw new Error(error.message)

    if (dependent_ids !== undefined) {
      if (dependent_ids.length) {
        const { error: insertError } = await supabase.from('card_purchase_dependents').upsert(
          dependent_ids.map(dependent_id => ({ card_purchase_id: id, dependent_id })) as any,
          { onConflict: 'card_purchase_id,dependent_id', ignoreDuplicates: true }
        )
        if (insertError) throw new Error(insertError.message)
      }
      const deleteQuery = supabase.from('card_purchase_dependents').delete().eq('card_purchase_id', id)
      const { error: deleteError } = dependent_ids.length
        ? await deleteQuery.not('dependent_id', 'in', `(${dependent_ids.join(',')})`)
        : await deleteQuery
      if (deleteError) throw new Error(deleteError.message)
    }
    
    if (purchase) {
      await get().fetchByCard(purchase.credit_card_id)
      await recalculateInvoice(
        purchase.credit_card_id,
        data.reference_month || purchase.reference_month
      )
    }
  },
  
  remove: async (id) => {
    const purchase = get().purchases.find(p => p.id === id)
    const { error } = await supabase
      .from('card_purchases')
      .delete()
      .eq('id', id)
      
    if (error) throw new Error(error.message)
    
    if (purchase) {
      await get().fetchByCard(purchase.credit_card_id)
      await recalculateInvoice(
        purchase.credit_card_id,
        purchase.reference_month
      )
    }
  },
  
  reset: () => set({ purchases: [], loading: false, error: null })
}))

// Roll forward active purchases from one month to the next
export async function rollForwardCardPurchases(
  cardId: string,
  fromMonth: string,
  toMonth: string
) {
  const { data: purchases, error } = await supabase
    .from('card_purchases')
    .select('*')
    .eq('credit_card_id', cardId)
    .eq('reference_month', fromMonth);

  if (error) throw new Error(error.message);
  if (!purchases || purchases.length === 0) {
    // Nothing to roll forward, but still recalc (will be 0)
    await recalculateInvoice(cardId, toMonth);
    return;
  }

  for (const p of purchases) {
    if (p.type === 'cash') {
      // Cash purchases do not repeat — leave them in the old month
      continue;
    }

    if (p.type === 'recurring') {
      // Recurring purchases move forward as-is, same amount
      const { error: updError } = await supabase
        .from('card_purchases')
        .update({ reference_month: toMonth })
        .eq('id', p.id);
      if (updError) throw new Error(updError.message);
      continue;
    }

    if (p.type === 'installment') {
      const nextInstallment = (p.current_installment || 1) + 1;
      if (nextInstallment > p.installments) {
        // Fully paid off — do not carry forward
        continue;
      }
      const { error: updError } = await supabase
        .from('card_purchases')
        .update({
          reference_month: toMonth,
          current_installment: nextInstallment
        })
        .eq('id', p.id);
      if (updError) throw new Error(updError.message);
    }
  }

  await recalculateInvoice(cardId, toMonth);
}

// Recalculate and update invoice_amount on the credit card
async function recalculateInvoice(cardId: string, referenceMonth: string) {
  const { data } = await supabase
    .from('card_purchases')
    .select('amount, type, installments, current_installment')
    .eq('credit_card_id', cardId)
    .eq('reference_month', referenceMonth)

  if (!data) return

  const total = data.reduce((sum, p) => {
    if (p.type === 'cash' || p.type === 'recurring') {
      return sum + p.amount
    }
    // installment: only current month's installment amount
    const installmentAmount = p.amount / p.installments
    return sum + installmentAmount
  }, 0)

  await supabase
    .from('credit_cards')
    .update({ invoice_amount: Math.round(total * 100) / 100 })
    .eq('id', cardId)
}
