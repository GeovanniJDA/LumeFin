import { create } from 'zustand'
import { supabase, handleSupabaseError } from '@/lib/supabase'
import type { CardPurchase } from '@/types'

interface CardPurchaseStore {
  purchases: CardPurchase[]
  loading: boolean
  error: string | null
  fetchByCard: (cardId: string) => Promise<void>
  add: (cardId: string, data: Omit<CardPurchase, 'id'|'user_id'|'credit_card_id'|'created_at'>) => Promise<void>
  update: (id: string, data: Partial<CardPurchase>) => Promise<void>
  remove: (id: string) => Promise<void>
  reset: () => void
}

export const useCardPurchaseStore = create<CardPurchaseStore>((set, get) => ({
  purchases: [],
  loading: false,
  error: null,
  
  fetchByCard: async (cardId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('card_purchases')
      .select('*')
      .eq('credit_card_id', cardId)
      .order('purchase_date', { ascending: false })
      
    if (error) {
      if (handleSupabaseError(error)) return
      set({ error: error.message, loading: false })
      return
    }
    set({ purchases: data ?? [], loading: false, error: null })
  },
  
  add: async (cardId, data) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')
    
    const { error } = await supabase
      .from('card_purchases')
      .insert({ ...data, credit_card_id: cardId, user_id: user.id, current_installment: 1 })
      
    if (error) throw new Error(error.message)
    
    await get().fetchByCard(cardId)
    await recalculateInvoice(cardId, data.reference_month)
  },
  
  update: async (id, data) => {
    const purchase = get().purchases.find(p => p.id === id)
    const { error } = await supabase
      .from('card_purchases')
      .update(data)
      .eq('id', id)
      
    if (error) throw new Error(error.message)
    
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
