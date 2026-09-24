/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useTransactionPaymentStore } from '@/store/transaction-payment-store'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/shared/date-picker'
import { formatCurrency, getTransactionPaidCents, getTransactionRemainingCents } from '@/lib/utils'
import { useProfileStore } from '@/store/profile-store'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TransactionWithDependent } from '@/types'

interface TransactionPaymentsPanelProps {
  transaction: TransactionWithDependent
  onUpdateTransaction: (id: string, data: Partial<TransactionWithDependent>) => Promise<void>
  onTransactionSettled: () => void
}

export function TransactionPaymentsPanel({
  transaction,
  onUpdateTransaction,
  onTransactionSettled
}: TransactionPaymentsPanelProps) {
  const store = useTransactionPaymentStore()
  const profile = useProfileStore(state => state.profile)
  const payments = store.payments.filter(p => p.transaction_id === transaction.id)

  const [amountCents, setAmountCents] = useState(0)
  const [amountDisplay, setAmountDisplay] = useState('')
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [newPaidBy, setNewPaidBy] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isSettled, setIsSettled] = useState(
    transaction.status === 'paid'
  )

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '')
    const cents = digits === '' ? 0 : parseInt(digits, 10)
    if (cents > 99999999) return
    setAmountCents(cents)
    setAmountDisplay(
      cents === 0 ? '' : (cents / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    )
  }

  const resetAmount = () => {
    setAmountCents(0)
    setAmountDisplay('')
  }

  // Summary calculations
  const totalPaid = getTransactionPaidCents({ ...transaction, transaction_payments: payments }) / 100
  const remaining = getTransactionRemainingCents({ ...transaction, transaction_payments: payments }) / 100
  const progress = Math.min((totalPaid / transaction.amount) * 100, 100)


  const handleAdd = async () => {
    if (amountCents === 0 || !newDate || !newPaidBy.trim()) return

    // Block if already fully paid
    const currentTotalCents = getTransactionPaidCents({ ...transaction, transaction_payments: payments })
    if (currentTotalCents >= Math.round(transaction.amount * 100) || isSettled) {
      toast.warning('Esta transação já está quitada.')
      return
    }

    setIsAdding(true)
    try {
      await store.add(transaction.id, {
        amount: amountCents / 100,
        payment_date: newDate,
        paid_by: newPaidBy.trim(),
        notes: newNotes || undefined
      })

      const updatedPayments = [...payments, { amount: amountCents / 100 }]
      const newTotalCents = getTransactionPaidCents({
        ...transaction,
        status: 'pending',
        transaction_payments: updatedPayments,
      })

      if (newTotalCents >= Math.round(transaction.amount * 100) && !isSettled) {
        await onUpdateTransaction(transaction.id, {
          status: 'paid',
          settled_date: new Date().toISOString()
        })
        setIsSettled(true)
        toast.success('Transação quitada automaticamente! 🎉')
        onTransactionSettled()
      } else {
        toast.success('Pagamento registado.')
        onTransactionSettled()
      }

      // Reset form
      resetAmount()
      setNewDate(format(new Date(), 'yyyy-MM-dd'))
      setNewPaidBy('')
      setNewNotes('')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registar pagamento.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await store.remove(id, transaction.id)
      const remainingPayments = payments.filter(payment => payment.id !== id)
      if (transaction.status === 'paid' && getTransactionRemainingCents({
        ...transaction,
        status: 'pending',
        transaction_payments: remainingPayments,
      }) > 0) {
        await onUpdateTransaction(transaction.id, { status: 'pending', settled_date: null })
        setIsSettled(false)
      }
      toast.success('Pagamento removido.')
      onTransactionSettled()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover pagamento.')
    }
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="space-y-3 p-3 border-t border-white/6">

        {/* Progress summary */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3 text-center"
              style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)'
              }}>
              <p className="text-[10px] text-white/40 mb-1 uppercase
              tracking-wider">Valor Pago</p>
              <p className="text-base font-black text-emerald-400">
                {formatCurrency(totalPaid)}
              </p>
              <p className="text-[10px] text-white/20 mt-0.5">
                de {formatCurrency(transaction.amount)}
              </p>
            </div>
            <div className="rounded-xl p-3 text-center"
              style={{
                background: remaining === 0
                  ? 'rgba(16,185,129,0.08)'
                  : 'rgba(239,68,68,0.08)',
                border: `1px solid ${remaining === 0
                  ? 'rgba(16,185,129,0.2)'
                  : 'rgba(239,68,68,0.2)'}`
              }}>
              <p className="text-[10px] text-white/40 mb-1 uppercase
              tracking-wider">
                {remaining === 0 ? 'Quitado' : 'Restante'}
              </p>
              <p className={`text-base font-black ${remaining === 0
                ? 'text-emerald-400' : 'text-red-400'}`}>
                {remaining === 0 ? '✓' : formatCurrency(remaining)}
              </p>
              <p className="text-[10px] text-white/20 mt-0.5">
                {remaining === 0
                  ? 'Totalmente pago'
                  : `${Math.round(progress)}% pago`}
              </p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: progress >= 100
                  ? '#10B981'
                  : 'linear-gradient(90deg, #F59E0B, #10B981)'
              }}
            />
          </div>
        </div>

        {/* Payment list */}
        {payments.length > 0 && (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {payments.map(p => (
              <div key={p.id}
                className="flex items-center justify-between
                py-1.5 px-2 rounded-lg bg-white/2
                hover:bg-white/4 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-center shrink-0">
                    <p className="text-[10px] text-white/30 leading-none">
                      {format(parseISO(p.payment_date),
                        'dd/MM', { locale: ptBR })}
                    </p>
                    <p className="text-[9px] text-white/20">
                      {format(parseISO(p.payment_date),
                        'yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-400">
                      {formatCurrency(p.amount)}
                    </p>
                    <p className="text-[10px] text-white/40">
                      Pago por: {p.paid_by || 'Não informado (registro antigo)'}
                    </p>
                    {p.notes && (
                      <p className="text-[10px] text-white/30 truncate max-w-[160px]">
                        {p.notes}
                      </p>
                    )}
                    <p className="text-[10px] text-white/30" title={p.user_id}>
                      Registrado por {p.user_id === profile?.id
                        ? profile?.username || 'você'
                        : `conta ${p.user_id.slice(0, 8)}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(p.id)}
                  className="p-1 text-white/20 hover:text-red-400
                  transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Inline add form */}
        {totalPaid < transaction.amount && !isSettled && (
          <div className="pt-3 border-t border-white/6 space-y-3">
            <p className="text-[10px] text-white/40 uppercase
            tracking-wider font-semibold">
              Registar Pagamento
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-white/30">Valor *</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  placeholder="0,00"
                  className="h-9 text-sm bg-white/4 border-white/10
                  focus:border-amber-400/50 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/30">Data *</label>
                <DatePicker
                  value={newDate}
                  onChange={setNewDate}
                  placeholder="Selecione"
                />
              </div>
            </div>

            <label className="block space-y-1">
              <span className="text-[10px] text-white/30">Quem pagou *</span>
              <Input
                value={newPaidBy}
                onChange={e => setNewPaidBy(e.target.value)}
                placeholder="Nome"
                className="h-9 text-sm bg-white/4 border-white/10
                focus:border-amber-400/50 rounded-lg"
              />
            </label>

            <Input
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              placeholder="Observação (opcional)"
              className="h-9 text-sm bg-white/4 border-white/10
              focus:border-amber-400/50 rounded-lg"
            />

            <button
              disabled={isAdding || amountCents === 0 || !newDate || !newPaidBy.trim()}
              onClick={handleAdd}
              className="w-full h-10 rounded-xl text-sm font-bold
              bg-amber-500 hover:bg-amber-600 text-black
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200 flex items-center
              justify-center gap-2"
            >
              {isAdding
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Plus className="w-4 h-4" />
              }
              {isAdding ? 'Registrando...' : 'Registrar Pagamento'}
            </button>
          </div>
        )}
        {(totalPaid >= transaction.amount || isSettled) && (
          <div className="pt-3 border-t border-white/6 text-center py-4">
            <p className="text-emerald-400 font-bold text-sm">
              ✓ Transação quitada
            </p>
            <p className="text-white/30 text-xs mt-1">
              Nenhum pagamento adicional necessário
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
