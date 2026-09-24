import { useBills } from '../hooks/use-bills';
import { useCreditCards } from '../hooks/use-credit-cards';
import { useTransactions } from '../hooks/use-transactions';
import { useDependents } from '../hooks/use-dependents';
import { useCategories } from '../hooks/use-categories';
import { useCardPurchaseStore } from '../store/card-purchase-store';
import { PageHeader } from '../components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, getTransactionRemainingCents, isDueSoon, isOverdue } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CreditCard,
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const RELATIONSHIP_LABELS: Record<string, string> = {
  mae: 'Mãe', pai: 'Pai', avo: 'Avô', avoa: 'Avó',
  irmao: 'Irmão', irma: 'Irmã', tio: 'Tio', tia: 'Tia', outro: 'Outro',
};

function splitCents(amount: number, dependentIds: string[], dependentId: string) {
  const ids = [...dependentIds].sort();
  const index = ids.indexOf(dependentId);
  if (index < 0 || ids.length === 0) return 0;
  const base = Math.floor(amount / ids.length);
  return base + (index < amount % ids.length ? 1 : 0);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { bills, loading: billsLoading, error: billsError, getOverdueBills, getDueSoonBills } = useBills(undefined, true);
  const { creditCards, loading: cardsLoading, error: cardsError, getOverdueCards, getDueSoonCards } = useCreditCards();
  const { transactions, loading: txLoading, error: txError, netBalanceByDependent } = useTransactions(undefined, true);
  const { dependents, loading: depsLoading } = useDependents();
  const { categories, loading: catsLoading } = useCategories();
  const purchases = useCardPurchaseStore(s => s.purchases);
  const purchasesLoading = useCardPurchaseStore(s => s.loading);
  const purchasesError = useCardPurchaseStore(s => s.error);
  const fetchPurchases = useCardPurchaseStore(s => s.fetchAll);

  useEffect(() => {
    fetchPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = billsLoading || cardsLoading || txLoading || depsLoading || catsLoading || purchasesLoading;
  const financialDataError = billsError || cardsError || txError;

  // ── Section 1: Summary metrics ──
  const pendingBills = bills.filter(b => b.status === 'pending');
  const pendingBillsCount = pendingBills.length;
  const pendingBillsCents = pendingBills.reduce((sum, bill) => sum + Math.round(bill.amount * 100), 0);
  const pendingBillsTotal = pendingBillsCents / 100;

  const openCards = creditCards.filter(c => c.status === 'open' || c.status === 'closed');
  const openCardsCount = openCards.length;
  const openCardsCents = openCards.reduce((sum, card) => sum + Math.round(card.invoice_amount * 100), 0);
  const openCardsTotal = openCardsCents / 100;

  const pendingToReceiveCents = transactions
    .filter(t => t.type === 'to_receive' && t.status === 'pending')
    .reduce((sum, transaction) => sum + getTransactionRemainingCents(transaction), 0);

  const pendingToPayCents = transactions
    .filter(t => t.type === 'to_pay' && t.status === 'pending')
    .reduce((sum, transaction) => sum + getTransactionRemainingCents(transaction), 0);

  // Hero card derived values
  const totalToReceive = pendingToReceiveCents / 100;
  const totalToPay = (pendingToPayCents + pendingBillsCents + openCardsCents) / 100;
  const netCommitments = (pendingToReceiveCents - pendingToPayCents - pendingBillsCents - openCardsCents) / 100;
  const transactionCounts = {
    toReceive: transactions.filter(t => t.type === 'to_receive' && t.status === 'pending').length,
  };
  const totalInvoiceAmount = openCardsTotal;

  // ── Section 2: Alerts ──
  const currentMonth = format(new Date(), 'yyyy-MM');
  const currentRecurringKeys = new Set(bills
    .filter(b => b.is_recurring && b.reference_month === currentMonth && !b.id.startsWith('recurring-'))
    .map(b => `${b.category_id}-${b.amount}`));
  // ponytail: recurring bills are identified by category+amount; add series IDs if identical obligations must stay separate.
  const recurringProjectionKeys = new Set<string>();
  const recurringProjections = bills
    .filter(b => b.is_recurring && b.reference_month < currentMonth)
    .filter(b => {
      const key = `${b.category_id}-${b.amount}`;
      if (currentRecurringKeys.has(key) || recurringProjectionKeys.has(key)) return false;
      recurringProjectionKeys.add(key);
      return true;
    })
    .map(b => {
      const [year, month] = currentMonth.split('-');
      const day = b.due_date.split('-')[2];
      return {
        ...b,
        id: `recurring-${b.id}-${currentMonth}`,
        due_date: `${year}-${month}-${day}`,
        reference_month: currentMonth,
        status: 'pending' as const,
      };
    });

  const baseOverdueBills = getOverdueBills();
  const projectedOverdue = recurringProjections.filter(b => isOverdue(b.due_date));
  const overdueBills = [...baseOverdueBills, ...projectedOverdue];
  const overdueCount = overdueBills.length;
  const overdueBillIds = new Set(overdueBills.map(b => b.id));
  
  const baseDueSoonBills = getDueSoonBills();
  const projectedDueSoon = recurringProjections.filter(b => isDueSoon(b.due_date));
  const dueSoonBills = [...baseDueSoonBills, ...projectedDueSoon].filter(b => !overdueBillIds.has(b.id));

  const overdueCards = getOverdueCards();
  const overdueCardIds = new Set(overdueCards.map(c => c.id));
  const dueSoonCards = getDueSoonCards().filter(c => !overdueCardIds.has(c.id));
  const hasAlerts = overdueBills.length > 0 || dueSoonBills.length > 0 || overdueCards.length > 0 || dueSoonCards.length > 0;

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Conta';
  };

  // ── Section 3: Per-dependent ──
  const dependentSummaries = dependents.map(dep => {
    const depBills = pendingBills.filter(b =>
      b.dependents?.some(d => d.id === dep.id)
    );
    const depCards = creditCards.filter(card => {
      if (card.status !== 'open' && card.status !== 'closed') return false;
      const monthPurchases = purchases.filter(p =>
        p.credit_card_id === card.id && p.reference_month === card.reference_month
      );
      return card.dependents.some(cardDependent => cardDependent.id === dep.id) ||
        monthPurchases.some(p => p.dependents.some(purchaseDependent => purchaseDependent.id === dep.id));
    });
    const depCardsTotal = depCards.reduce((totalCents, card) => {
      const monthPurchases = purchases.filter(p =>
        p.credit_card_id === card.id && p.reference_month === card.reference_month
      );
      if (monthPurchases.length === 0) {
        return totalCents + splitCents(Math.round(card.invoice_amount * 100), card.dependents.map(d => d.id), dep.id);
      }
      return totalCents + monthPurchases.reduce((purchaseTotal, purchase) => {
        const purchaseDependents = purchase.dependents.length
          ? purchase.dependents.map(d => d.id)
          : card.dependents.map(d => d.id);
        const cents = purchase.type === 'installment'
          ? Math.round(purchase.amount / Math.max(purchase.installments, 1) * 100)
          : Math.round(purchase.amount * 100);
        return purchaseTotal + splitCents(cents, purchaseDependents, dep.id);
      }, 0);
    }, 0) / 100;
    const balance = netBalanceByDependent(dep.id);

    return {
      ...dep,
      pendingBillsCount: depBills.length,
      pendingCardsCount: depCards.length,
      pendingCardsTotal: depCardsTotal,
      balance,
    };
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader title="Dashboard" description="Visão geral financeira e alertas." />

      {/* ── Hero Card ── */}
      {!isLoading && !financialDataError && (
        <div
          className="relative overflow-hidden rounded-2xl p-4 md:p-6 border border-amber-400/20"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 50%, transparent 100%)' }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
          />
          <div className="relative z-10 flex flex-col gap-4">
            {/* Total amount — always full width */}
            <div>
              <p className="text-sm text-white/50 uppercase tracking-widest font-semibold mb-1">
                Posição líquida de compromissos
              </p>
              <p className="text-3xl md:text-5xl font-black text-white">
                <span className={netCommitments < 0 ? 'text-red-400' : netCommitments > 0 ? 'text-emerald-400' : 'text-white'}>
                  {formatCurrency(netCommitments)}
                </span>
              </p>
              <p className="text-sm text-white/50 mt-1">
                valores a receber menos transações, contas e faturas pendentes
              </p>
            </div>

            {/* Valores em aberto que compõem a posição líquida */}
            <div className="flex gap-3 md:gap-6">
              <div>
                <p className="text-[10px] md:text-xs text-white/40 mb-0.5">
                  A Receber
                </p>
                <p className="text-sm md:text-lg font-bold text-emerald-400">
                  {formatCurrency(totalToReceive)}
                </p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-[10px] md:text-xs text-white/40 mb-0.5">
                  A Pagar
                </p>
                <p className="text-sm md:text-lg font-bold text-red-400">
                  {formatCurrency(totalToPay)}
                </p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-[10px] md:text-xs text-white/40 mb-0.5">
                  Vencidas
                </p>
                <p className="text-sm md:text-lg font-bold text-amber-400">
                  {overdueCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 1: Summary Cards ── */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : financialDataError ? (
        <p role="alert" className="text-sm text-red-400">Falha ao calcular a posição financeira: {financialDataError}</p>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Contas Pendentes */}
          <div className="glass-strong rounded-2xl p-5 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[rgba(255,255,255,0.5)]">Contas Pendentes</span>
              <div className="p-2 bg-[rgba(245,158,11,0.15)] rounded-lg">
                <Receipt className="w-4 h-4 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white font-quicksand">{pendingBillsCount}</div>
            <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">{formatCurrency(pendingBillsTotal)}</p>
            <p className="text-xs text-white/40 mt-1">{overdueCount} vencida{overdueCount !== 1 ? 's' : ''}</p>
          </div>

          {/* Faturas em Aberto */}
          <div className="glass-strong rounded-2xl p-5 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[rgba(255,255,255,0.5)]">Faturas em Aberto</span>
              <div className="p-2 bg-[rgba(245,158,11,0.15)] rounded-lg">
                <CreditCard className="w-4 h-4 text-[#F59E0B]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white font-quicksand">{openCardsCount}</div>
            <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">{formatCurrency(openCardsTotal)}</p>
            <p className="text-xs text-white/40 mt-1">{formatCurrency(totalInvoiceAmount)} em aberto</p>
          </div>

          {/* A Receber */}
          <div className="glass-strong rounded-2xl p-5 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[rgba(255,255,255,0.5)]">A Receber</span>
              <div className="p-2 bg-[rgba(16,185,129,0.15)] rounded-lg">
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#10B981] font-quicksand">{formatCurrency(totalToReceive)}</div>
            <p className="text-xs text-white/40 mt-1">{transactionCounts.toReceive} transaç{transactionCounts.toReceive !== 1 ? 'ões' : 'ão'}</p>
          </div>

          {/* A Pagar */}
          <div className="glass-strong rounded-2xl p-5 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[rgba(255,255,255,0.5)]">A Pagar</span>
              <div className="p-2 bg-[rgba(239,68,68,0.15)] rounded-lg">
                <TrendingDown className="w-4 h-4 text-[#EF4444]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#EF4444] font-quicksand">{formatCurrency(totalToPay)}</div>
            <p className="text-xs text-white/40 mt-1">transações, contas e faturas pendentes</p>
          </div>
        </div>
      )}

      {/* ── Section 2: Alerts ── */}
      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : financialDataError ? (
        null
      ) : hasAlerts ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[rgba(255,255,255,0.9)] flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-2">
            <AlertCircle className="w-5 h-5 text-[#EF4444]" />
            Alertas
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Overdue */}
            {(overdueBills.length > 0 || overdueCards.length > 0) && (
              <div className="glass rounded-2xl p-5" style={{ borderLeft: '3px solid #EF4444' }}>
                <div className="text-[#EF4444] text-sm font-semibold flex items-center gap-2 mb-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Vencidos ({overdueBills.length + overdueCards.length})
                </div>
                <ul className="text-sm space-y-2 font-quicksand">
                  {overdueBills.slice(0, 5).map(b => (
                    <li key={b.id} className="flex justify-between border-b border-[rgba(255,255,255,0.04)] pb-1">
                      <span className="text-[rgba(255,255,255,0.7)] truncate mr-2">
                        {getCategoryName(b.category_id)} — venceu em {format(parseISO(b.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      <span className="font-semibold text-[#EF4444] whitespace-nowrap">{formatCurrency(b.amount)}</span>
                    </li>
                  ))}
                  {overdueCards.slice(0, 3).map(c => (
                    <li key={c.id} className="flex justify-between border-b border-[rgba(255,255,255,0.04)] pb-1">
                      <span className="text-[rgba(255,255,255,0.7)] truncate mr-2">
                        Cartão: {c.name} — venceu em {format(parseISO(c.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      <span className="font-semibold text-[#EF4444] whitespace-nowrap">{formatCurrency(c.invoice_amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Due Soon */}
            {(dueSoonBills.length > 0 || dueSoonCards.length > 0) && (
              <div className="glass rounded-2xl p-5" style={{ borderLeft: '3px solid #F59E0B' }}>
                <div className="text-[#F59E0B] text-sm font-semibold mb-3">
                  Vence em breve ({dueSoonBills.length + dueSoonCards.length})
                </div>
                <ul className="text-sm space-y-2 font-quicksand">
                  {dueSoonBills.slice(0, 5).map(b => (
                    <li key={b.id} className="flex justify-between border-b border-[rgba(255,255,255,0.04)] pb-1">
                      <span className="text-[rgba(255,255,255,0.7)] truncate mr-2">
                        {getCategoryName(b.category_id)} — vence em {format(parseISO(b.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      <span className="font-semibold text-[#F59E0B] whitespace-nowrap">{formatCurrency(b.amount)}</span>
                    </li>
                  ))}
                  {dueSoonCards.slice(0, 3).map(c => (
                    <li key={c.id} className="flex justify-between border-b border-[rgba(255,255,255,0.04)] pb-1">
                      <span className="text-[rgba(255,255,255,0.7)] truncate mr-2">
                        Cartão: {c.name} — vence em {format(parseISO(c.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      <span className="font-semibold text-[#F59E0B] whitespace-nowrap">{formatCurrency(c.invoice_amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ── Section 3: Per-Dependent Summary ── */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : financialDataError ? null : purchasesError ? (
        <p role="alert" className="text-sm text-red-400">Falha ao calcular o rateio por dependente: {purchasesError}</p>
      ) : dependents.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[rgba(255,255,255,0.9)] border-b border-[rgba(255,255,255,0.06)] pb-2">
            Resumo por Dependente
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {dependentSummaries.map(dep => (
              <div key={dep.id} className="glass rounded-2xl p-5 hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base font-semibold text-white">{dep.name}</span>
                  <Badge variant="secondary" className="text-[10px] font-medium py-0 h-5 bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.6)] border-none">
                    {RELATIONSHIP_LABELS[dep.relationship] || dep.relationship}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div className="rounded-xl bg-[rgba(255,255,255,0.04)] p-3">
                    <div className="text-lg font-bold text-white">{dep.pendingBillsCount}</div>
                    <p className="text-[10px] text-[rgba(255,255,255,0.4)]">Contas</p>
                  </div>
                  <div className="rounded-xl bg-[rgba(255,255,255,0.04)] p-3">
                    <div className="text-lg font-bold text-white">{dep.pendingCardsCount}</div>
                    <p className="text-[10px] text-[rgba(255,255,255,0.4)]">Cartões</p>
                    {dep.pendingCardsTotal > 0 && (
                      <p className="text-[10px] text-[rgba(255,255,255,0.3)]" title="Faturas divididas igualmente entre dependentes vinculados.">
                        Sua parte: {formatCurrency(dep.pendingCardsTotal)}
                      </p>
                    )}
                  </div>
                  <div className={`rounded-xl p-3 ${dep.balance > 0
                    ? 'bg-[rgba(16,185,129,0.1)]'
                    : dep.balance < 0
                      ? 'bg-[rgba(239,68,68,0.1)]'
                      : 'bg-[rgba(255,255,255,0.04)]'
                  }`}>
                    <div className={`text-lg font-bold ${dep.balance > 0
                      ? 'text-[#10B981]'
                      : dep.balance < 0
                        ? 'text-[#EF4444]'
                        : 'text-[rgba(255,255,255,0.4)]'
                    }`}>
                      {formatCurrency(Math.abs(dep.balance))}
                    </div>
                    <p className="text-[10px] text-[rgba(255,255,255,0.4)]">
                      {dep.balance > 0 ? 'A receber' : dep.balance < 0 ? 'A pagar' : 'Sem saldo'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => navigate('/app/bills')}
                    className="flex items-center gap-1 text-xs text-[#F59E0B] hover:text-amber-300 font-medium transition-colors"
                  >
                    Contas <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => navigate('/app/credit-cards')}
                    className="flex items-center gap-1 text-xs text-[#F59E0B] hover:text-amber-300 font-medium transition-colors"
                  >
                    Cartões <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => navigate('/app/transactions')}
                    className="flex items-center gap-1 text-xs text-[#F59E0B] hover:text-amber-300 font-medium transition-colors"
                  >
                    Transações <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
