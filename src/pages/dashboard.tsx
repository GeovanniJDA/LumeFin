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
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Visão geral financeira e alertas." />

      {/* ── Hero Card ── */}
      {!isLoading && !financialDataError && (
        <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-5 md:p-7">
          <div className="relative z-10 flex flex-col gap-4">
            <div>
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                Posição líquida de compromissos
              </p>
              <p className="text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">
                <span className={netCommitments < 0 ? 'text-destructive dark:text-destructive' : netCommitments > 0 ? 'text-success dark:text-success' : 'text-foreground'}>
                  {formatCurrency(netCommitments)}
                </span>
              </p>
              <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
                O que falta receber, menos pagamentos, contas e faturas em aberto.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-border pt-4 md:max-w-xl md:gap-6">
              <div>
                <p className="mb-0.5 text-xs text-muted-foreground">A receber</p>
                <p className="text-sm font-semibold tabular-nums text-success dark:text-success md:text-lg">
                  {formatCurrency(totalToReceive)}
                </p>
              </div>
              <div>
                <p className="mb-0.5 text-xs text-muted-foreground">A pagar</p>
                <p className="text-sm font-semibold tabular-nums text-destructive dark:text-destructive md:text-lg">
                  {formatCurrency(totalToPay)}
                </p>
              </div>
              <div>
                <p className="mb-0.5 text-xs text-muted-foreground">Vencidas</p>
                <p className="text-sm font-semibold tabular-nums text-foreground md:text-lg">
                  {overdueCount}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Section 1: Summary Cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : financialDataError ? (
        <p role="alert" className="text-sm text-destructive dark:text-destructive">Falha ao calcular a posição financeira: {financialDataError}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {/* Contas Pendentes */}
          <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Contas pendentes</span>
              <div className="rounded-md bg-primary/10 p-2">
                <Receipt className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="text-2xl font-semibold tabular-nums">{pendingBillsCount}</div>
            <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(pendingBillsTotal)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{overdueCount} vencida{overdueCount !== 1 ? 's' : ''}</p>
          </div>

          {/* Faturas em Aberto */}
          <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Faturas em aberto</span>
              <div className="rounded-md bg-primary/10 p-2">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="text-2xl font-semibold tabular-nums">{openCardsCount}</div>
            <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(openCardsTotal)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(totalInvoiceAmount)} em aberto</p>
          </div>

          {/* A Receber */}
          <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">A receber</span>
              <div className="rounded-md bg-emerald-600/10 p-2">
                <TrendingUp className="h-4 w-4 text-success dark:text-success" />
              </div>
            </div>
            <div className="text-2xl font-semibold tabular-nums text-success dark:text-success">{formatCurrency(totalToReceive)}</div>
            <p className="mt-1 text-xs text-muted-foreground">{transactionCounts.toReceive} transaç{transactionCounts.toReceive !== 1 ? 'ões' : 'ão'}</p>
          </div>

          {/* A Pagar */}
          <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">A pagar</span>
              <div className="rounded-md bg-red-600/10 p-2">
                <TrendingDown className="h-4 w-4 text-destructive dark:text-destructive" />
              </div>
            </div>
            <div className="text-2xl font-semibold tabular-nums text-destructive dark:text-destructive">{formatCurrency(totalToPay)}</div>
            <p className="mt-1 text-xs text-muted-foreground">transações, contas e faturas pendentes</p>
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
          <h2 className="flex items-center gap-2 border-b border-border pb-2 text-lg font-semibold">
            <AlertCircle className="h-5 w-5 text-destructive dark:text-destructive" />
            Alertas
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Overdue */}
            {(overdueBills.length > 0 || overdueCards.length > 0) && (
              <div className="rounded-xl border border-border border-l-4 border-l-red-600 bg-card p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive dark:text-destructive">
                  Vencidos ({overdueBills.length + overdueCards.length})
                </div>
                <ul className="space-y-2 text-sm">
                  {overdueBills.slice(0, 5).map(b => (
                    <li key={b.id} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                      <span className="truncate text-muted-foreground">
                        {getCategoryName(b.category_id)}, venceu em {format(parseISO(b.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      <span className="whitespace-nowrap font-semibold tabular-nums text-destructive dark:text-destructive">{formatCurrency(b.amount)}</span>
                    </li>
                  ))}
                  {overdueCards.slice(0, 3).map(c => (
                    <li key={c.id} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                      <span className="truncate text-muted-foreground">
                        Cartão: {c.name}, venceu em {format(parseISO(c.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      <span className="whitespace-nowrap font-semibold tabular-nums text-destructive dark:text-destructive">{formatCurrency(c.invoice_amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Due Soon */}
            {(dueSoonBills.length > 0 || dueSoonCards.length > 0) && (
              <div className="rounded-xl border border-border border-l-4 border-l-primary bg-card p-5">
                <div className="mb-3 text-sm font-semibold text-primary">
                  Vence em breve ({dueSoonBills.length + dueSoonCards.length})
                </div>
                <ul className="space-y-2 text-sm">
                  {dueSoonBills.slice(0, 5).map(b => (
                    <li key={b.id} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                      <span className="truncate text-muted-foreground">
                        {getCategoryName(b.category_id)}, vence em {format(parseISO(b.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      <span className="whitespace-nowrap font-semibold tabular-nums text-primary">{formatCurrency(b.amount)}</span>
                    </li>
                  ))}
                  {dueSoonCards.slice(0, 3).map(c => (
                    <li key={c.id} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                      <span className="truncate text-muted-foreground">
                        Cartão: {c.name}, vence em {format(parseISO(c.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      <span className="whitespace-nowrap font-semibold tabular-nums text-primary">{formatCurrency(c.invoice_amount)}</span>
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
        <p role="alert" className="text-sm text-destructive dark:text-destructive">Falha ao calcular o rateio por dependente: {purchasesError}</p>
      ) : dependents.length > 0 ? (
        <div className="space-y-4">
          <h2 className="border-b border-border pb-2 text-lg font-semibold">
            Resumo por Dependente
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {dependentSummaries.map(dep => (
              <div key={dep.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base font-semibold text-foreground">{dep.name}</span>
                  <Badge variant="secondary" className="h-5 border-0 bg-muted px-2 py-0 text-[10px] font-medium text-muted-foreground">
                    {RELATIONSHIP_LABELS[dep.relationship] || dep.relationship}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div className="rounded-lg bg-muted p-3">
                    <div className="text-lg font-semibold tabular-nums text-foreground">{dep.pendingBillsCount}</div>
                    <p className="text-[10px] text-muted-foreground">Contas</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <div className="text-lg font-semibold tabular-nums text-foreground">{dep.pendingCardsCount}</div>
                    <p className="text-[10px] text-muted-foreground">Cartões</p>
                    {dep.pendingCardsTotal > 0 && (
                      <p className="text-[10px] text-muted-foreground" title="Faturas divididas igualmente entre dependentes vinculados.">
                        Sua parte: {formatCurrency(dep.pendingCardsTotal)}
                      </p>
                    )}
                  </div>
                  <div className={`rounded-xl p-3 ${dep.balance > 0
                    ? 'bg-[rgba(16,185,129,0.1)]'
                    : dep.balance < 0
                      ? 'bg-[rgba(239,68,68,0.1)]'
                      : 'bg-muted'
                  }`}>
                    <div className={`text-lg font-bold ${dep.balance > 0
                      ? 'text-success dark:text-success'
                      : dep.balance < 0
                        ? 'text-destructive dark:text-destructive'
                      : 'text-muted-foreground'
                    }`}>
                      {formatCurrency(Math.abs(dep.balance))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {dep.balance > 0 ? 'A receber' : dep.balance < 0 ? 'A pagar' : 'Sem saldo'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => navigate('/app/bills')}
                    className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:underline"
                  >
                    Contas <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => navigate('/app/credit-cards')}
                    className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:underline"
                  >
                    Cartões <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => navigate('/app/transactions')}
                    className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:underline"
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
