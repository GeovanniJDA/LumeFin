/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useState } from 'react'
import { useTransactionPaymentStore } from '@/store/transaction-payment-store'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/shared/date-picker'
import { formatCurrency } from '@/lib/utils'
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
  const payments = store.payments.filter(p => p.transaction_id === transaction.id)

  const [amountCents, setAmountCents] = useState(0)
  const [amountDisplay, setAmountDisplay] = useState('')
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'))
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
  const installmentsPaid = transaction.payment_type === 'installment'
    ? (transaction.paid_installments / transaction.installments) * transaction.amount
    : 0
  const freePaymentsPaid = payments.reduce((s, p) => s + p.amount, 0)
  const totalPaid = Math.min(
    installmentsPaid + freePaymentsPaid,
    transaction.amount
  )
  const remaining = Math.max(transaction.amount - totalPaid, 0)
  const progress = Math.min((totalPaid / transaction.amount) * 100, 100)


  const handleAdd = async () => {
    if (amountCents === 0 || !newDate) return

    // Block if already fully paid
    const currentTotal = Math.min(
      installmentsPaid + freePaymentsPaid,
      transaction.amount
    )
    if (currentTotal >= transaction.amount || isSettled) {
      toast.warning('Esta transação já está quitada.')
      return
    }

    setIsAdding(true)
    try {
      await store.add(transaction.id, {
        amount: amountCents / 100,
        payment_date: newDate,
        notes: newNotes || undefined
      })

      // Auto-update paid_installments based on free payments
      if (transaction.payment_type === 'installment') {
        const installmentValue = transaction.amount / transaction.installments
        const newFreeTotal = payments.reduce((s, p) => s + p.amount, 0)
          + (amountCents / 100)

        // How many installments do free payments cover?
        const installmentsCoveredByFree = Math.floor(
          newFreeTotal / installmentValue
        )

        // Total paid_installments = max of current or newly covered
        // (never decrease what was already manually marked)
        const newPaidInstallments = Math.min(
          Math.max(
            transaction.paid_installments,
            installmentsCoveredByFree
          ),
          transaction.installments
        )

        // Only update if it changed
        if (newPaidInstallments > transaction.paid_installments) {
          await onUpdateTransaction(transaction.id, {
            paid_installments: newPaidInstallments
          })
        }
      }

      // Check auto-settle AFTER the installments update
      const updatedPaidInstallments = transaction.payment_type === 'installment'
        ? Math.min(
            Math.max(
              transaction.paid_installments,
              Math.floor(
                (payments.reduce((s, p) => s + p.amount, 0) + amountCents / 100)
                / (transaction.amount / transaction.installments)
              )
            ),
            transaction.installments
          )
        : transaction.paid_installments

      const installmentsTotalUpdated = transaction.payment_type === 'installment'
        ? (updatedPaidInstallments / transaction.installments)
          * transaction.amount
        : 0

      const freeTotal = payments.reduce((s, p) => s + p.amount, 0)
        + (amountCents / 100)

      const newTotal = Math.min(
        installmentsTotalUpdated + freeTotal,
        transaction.amount
      )

      if (newTotal >= transaction.amount && !isSettled) {
        await onUpdateTransaction(transaction.id, {
          status: 'paid',
          paid_installments: transaction.installments,
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
                    {p.notes && (
                      <p className="text-[10px] text-white/30 truncate max-w-[160px]">
                        {p.notes}
                      </p>
                    )}
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

            <Input
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              placeholder="Observação (opcional)"
              className="h-9 text-sm bg-white/4 border-white/10
              focus:border-amber-400/50 rounded-lg"
            />

            <button
              disabled={isAdding || amountCents === 0 || !newDate}
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