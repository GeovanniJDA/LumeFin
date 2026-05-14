import { create } from 'zustand'
import { supabase, handleSupabaseError } from '@/lib/supabase'
import type { TransactionPayment } from '@/types'

interface TransactionPaymentStore {
  payments: TransactionPayment[]
  loading: boolean
  error: string | null
  fetchByTransaction: (transactionId: string) => Promise<void>
  add: (transactionId: string, data: {
    amount: number
    payment_date: string
    notes?: string
  }) => Promise<{ shouldAutoSettle: boolean; totalPaid: number }>
  remove: (id: string, transactionId: string) => Promise<void>
  reset: () => void
}

export const useTransactionPaymentStore =
  create<TransactionPaymentStore>((set, get) => ({
  payments: [],
  loading: false,
  error: null,

  fetchByTransaction: async (transactionId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('transaction_payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('payment_date', { ascending: false })
    if (error) {
      if (handleSupabaseError(error)) return
      set({ error: error.message, loading: false })
      return
    }
    set({ payments: data ?? [], loading: false, error: null })
  },

  add: async (transactionId, data) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const { error } = await supabase
      .from('transaction_payments')
      .insert({
        ...data,
        transaction_id: transactionId,
        user_id: user.id
      })
    if (error) throw new Error(error.message)

    await get().fetchByTransaction(transactionId)

    // Calculate total paid to check auto-settle
    const totalPaid = get().payments.reduce(
      (sum, p) => sum + p.amount, 0
    )
    return { shouldAutoSettle: false, totalPaid }
  },

  remove: async (id, transactionId) => {
    const { error } = await supabase
      .from('transaction_payments')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
    await get().fetchByTransaction(transactionId)
  },

  reset: () => set({ payments: [], loading: false, error: null })
}))