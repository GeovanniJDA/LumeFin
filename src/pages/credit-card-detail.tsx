import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, addMonths, subMonths, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, ArrowLeft, CreditCard, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCardPurchaseStore } from '@/store/card-purchase-store'
import { formatCurrency } from '@/lib/utils'
import type { CreditCardWithDependent, CardPurchase } from '@/types'

// ─── Pure helper functions ────────────────────────────────────────────────────

function getPurchasesForMonth(
  purchases: CardPurchase[],
  targetMonth: string // 'YYYY-MM'
): Array<CardPurchase & { installmentLabel?: string; monthlyAmount: number }> {
  return purchases
    .map(p => {
      if (p.type === 'cash') {
        if (p.reference_month === targetMonth) {
          return { ...p, monthlyAmount: p.amount }
        }
        return null
      }

      if (p.type === 'recurring') {
        // Appears from reference_month onwards
        if (targetMonth >= p.reference_month) {
          return { ...p, monthlyAmount: p.amount }
        }
        return null
      }

      if (p.type === 'installment') {
        // Calculate which installment number this month is
        const [baseYear, baseMonth] = p.reference_month.split('-').map(Number)
        const [targetYear, targetMonthNum] = targetMonth.split('-').map(Number)
        const monthDiff = (targetYear - baseYear) * 12 + (targetMonthNum - baseMonth)
        const installmentNumber = monthDiff + 1

        if (installmentNumber >= 1 && installmentNumber <= p.installments) {
          return {
            ...p,
            installmentLabel: `${installmentNumber}/${p.installments}`,
            monthlyAmount: p.amount / p.installments
          }
        }
        return null
      }

      return null
    })
    .filter(Boolean) as Array<CardPurchase & { installmentLabel?: string; monthlyAmount: number }>
}

function getTotalForMonth(purchases: CardPurchase[], month: string): number {
  return getPurchasesForMonth(purchases, month).reduce((sum, p) => sum + p.monthlyAmount, 0)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreditCardDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { purchases, loading, fetchByCard } = useCardPurchaseStore()
  const [card, setCard] = useState<CreditCardWithDependent | null>(null)
  const [cardLoading, setCardLoading] = useState(true)

  // Current selected month — defaults to today
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))

  // Generate 12 months: 6 before + current + 5 ahead
  const months = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const date = addMonths(subMonths(now, 6), i)
      return format(date, 'yyyy-MM')
    })
  }, [])

  // Fetch card details
  useEffect(() => {
    if (!id) return
    setCardLoading(true)
    supabase
      .from('credit_cards')
      .select('*, dependents(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setCard(data)
        setCardLoading(false)
      })
  }, [id])

  // Fetch all purchases for this card (no month filter — filtering is client-side)
  useEffect(() => {
    if (id) fetchByCard(id)
  }, [id])

  // Purchases for selected month
  const monthPurchases = useMemo(
    () => getPurchasesForMonth(purchases, selectedMonth),
    [purchases, selectedMonth]
  )

  const monthTotal = useMemo(
    () => monthPurchases.reduce((s, p) => s + p.monthlyAmount, 0),
    [monthPurchases]
  )

  // Mini chart data — total per month for all 12 months
  const chartData = useMemo(
    () =>
      months.map(m => ({
        month: m,
        label: format(parseISO(`${m}-01`), 'MMM', { locale: ptBR }),
        total: getTotalForMonth(purchases, m)
      })),
    [purchases, months]
  )
  const maxChartValue = Math.max(...chartData.map(d => d.total), 1)

  if (cardLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )

  if (!card)
    return (
      <div className="p-8 text-white/40 text-center">Cartão não encontrado.</div>
    )

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Back button */}
      <button
        onClick={() => navigate('/app/credit-cards')}
        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Cartões
      </button>

      {/* Card header */}
      <div
        className="relative overflow-hidden glass rounded-2xl p-6"
        style={{ borderLeft: `3px solid ${card.color ?? '#6B7280'}` }}
      >
        <div
          className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${card.color ?? '#6B7280'}15 0%, transparent 70%)`,
            transform: 'translate(20%, -20%)'
          }}
        />
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ background: card.color ?? '#6B7280' }} />
              <h1 className="text-2xl font-black text-white">{card.name}</h1>
            </div>
            {card.dependents && (
              <p className="text-white/40 text-sm">{card.dependents.name}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40 mb-1">Fatura actual</p>
            <p className="text-2xl font-black text-white">{formatCurrency(card.invoice_amount)}</p>
            <p className="text-xs text-white/40 mt-1">
              Vence {format(parseISO(card.due_date), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* Mini bar chart — 12 months overview */}
      <div className="glass rounded-2xl p-5">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-4 font-semibold">
          Projeção 12 meses
        </p>
        <div className="flex items-end gap-1 h-16">
          {chartData.map(d => (
            <button
              key={d.month}
              onClick={() => setSelectedMonth(d.month)}
              className="flex-1 flex flex-col items-center gap-1 group"
              title={`${d.label}: ${formatCurrency(d.total)}`}
            >
              <div
                className="w-full rounded-t-sm transition-all duration-200 group-hover:opacity-100"
                style={{
                  height: `${Math.max((d.total / maxChartValue) * 52, 4)}px`,
                  background:
                    d.month === selectedMonth
                      ? '#F59E0B'
                      : d.total > 0
                        ? 'rgba(245,158,11,0.3)'
                        : 'rgba(255,255,255,0.06)',
                  borderBottom: d.month === selectedMonth ? '2px solid #F59E0B' : 'none'
                }}
              />
              <span
                className={`text-[9px] transition-colors ${
                  d.month === selectedMonth ? 'text-amber-400 font-bold' : 'text-white/30'
                }`}
              >
                {d.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            const idx = months.indexOf(selectedMonth)
            if (idx > 0) setSelectedMonth(months[idx - 1])
          }}
          disabled={months.indexOf(selectedMonth) === 0}
          className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white
            hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <p className="text-lg font-black text-white capitalize">
            {format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: ptBR })}
          </p>
          <p className="text-sm text-amber-400 font-bold">{formatCurrency(monthTotal)}</p>
        </div>

        <button
          onClick={() => {
            const idx = months.indexOf(selectedMonth)
            if (idx < months.length - 1) setSelectedMonth(months[idx + 1])
          }}
          disabled={months.indexOf(selectedMonth) === months.length - 1}
          className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white
            hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Purchase list for selected month */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/6">
          <p className="text-sm font-semibold text-white/70">Compras deste mês</p>
          <button
            onClick={() => navigate('/app/credit-cards')}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Adicionar compra
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : monthPurchases.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-white/30 text-sm">Nenhuma compra neste mês</p>
          </div>
        ) : (
          <div className="divide-y divide-white/6">
            {monthPurchases.map((p, i) => (
              <div
                key={`${p.id}-${i}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Type indicator */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      p.type === 'cash'
                        ? 'bg-emerald-400/10 text-emerald-400'
                        : p.type === 'recurring'
                          ? 'bg-blue-400/10 text-blue-400'
                          : 'bg-amber-400/10 text-amber-400'
                    }`}
                  >
                    {p.type === 'cash' ? 'AV' : p.type === 'recurring' ? 'RC' : p.installmentLabel}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{p.description}</p>
                    <p className="text-xs text-white/30">
                      {p.type === 'cash'
                        ? 'À Vista'
                        : p.type === 'recurring'
                          ? 'Recorrente'
                          : `Parcela ${p.installmentLabel}`}
                      {' · '}
                      {format(parseISO(p.purchase_date), 'dd/MM', { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{formatCurrency(p.monthlyAmount)}</p>
                  {p.type === 'installment' && (
                    <p className="text-[10px] text-white/30">de {formatCurrency(p.amount)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Month total footer */}
        {monthPurchases.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/2">
            <p className="text-sm font-semibold text-white/60">Total estimado</p>
            <p className="text-base font-black text-amber-400">{formatCurrency(monthTotal)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
