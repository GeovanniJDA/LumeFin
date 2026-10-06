import { useMemo, useState } from 'react';
import { addMonths, format, getDay, getDaysInMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CreditCard, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/shared/page-header';
import { EmptyState } from '../components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useBills } from '../hooks/use-bills';
import { useCreditCards } from '../hooks/use-credit-cards';
import { useCategories } from '../hooks/use-categories';
import type { Bill, CreditCard as CreditCardModel } from '../types';
import { buildDueAlerts, projectRecurringBills } from '../lib/due-dates';
import { cn, formatCurrency, isDueSoon, isOverdue } from '../lib/utils';

type EventStatus = 'overdue' | 'dueSoon' | 'upcoming';

interface DueEvent {
  id: string;
  kind: 'bill' | 'card';
  date: string; // yyyy-MM-dd
  name: string;
  amount: number;
  projected: boolean;
  status: EventStatus;
}

interface AlertRow {
  id: string;
  kind: 'bill' | 'card';
  date: string;
  name: string;
  amount: number;
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const statusOf = (date: string): EventStatus =>
  isOverdue(date) ? 'overdue' : isDueSoon(date) ? 'dueSoon' : 'upcoming';

const STATUS_LABELS: Record<EventStatus, string> = {
  overdue: 'Vencida',
  dueSoon: 'Vence em breve',
  upcoming: 'Pendente',
};

const STATUS_CLASSES: Record<EventStatus, string> = {
  overdue: 'border-destructive/30 bg-destructive/10 text-destructive dark:text-destructive',
  dueSoon: 'border-primary/30 bg-primary/10 text-primary',
  upcoming: 'border-border bg-muted text-muted-foreground',
};

const DOT_CLASSES: Record<EventStatus, string> = {
  overdue: 'bg-destructive',
  dueSoon: 'bg-primary',
  upcoming: 'bg-muted-foreground/50',
};

function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={cn('whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-medium', STATUS_CLASSES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function AlertPanel({ title, rows, tone, onOpen }: {
  title: string;
  rows: AlertRow[];
  tone: 'danger' | 'warn';
  onOpen: (kind: AlertRow['kind']) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <div className={cn('rounded-xl border border-border border-l-4 bg-card p-4', tone === 'danger' ? 'border-l-red-600' : 'border-l-primary')}>
      <p className={cn('mb-3 text-sm font-semibold', tone === 'danger' ? 'text-destructive dark:text-destructive' : 'text-primary')}>
        {title} ({rows.length})
      </p>
      <ul className="space-y-2 text-sm">
        {rows.map(row => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => onOpen(row.kind)}
              className="flex w-full items-center justify-between gap-3 border-b border-border pb-2 text-left last:border-0 last:pb-0"
            >
              <span className="min-w-0">
                <span className="block truncate text-muted-foreground">{row.name}</span>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(row.date), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </span>
              <span className={cn(
                'whitespace-nowrap font-semibold tabular-nums',
                tone === 'danger' ? 'text-destructive dark:text-destructive' : 'text-primary'
              )}>
                {formatCurrency(row.amount)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DueDates() {
  const navigate = useNavigate();
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [month, setMonth] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { bills, loading: billsLoading, error: billsError } = useBills(undefined, true);
  const { creditCards, loading: cardsLoading, error: cardsError } = useCreditCards();
  const { categories } = useCategories();

  const isLoading = billsLoading || cardsLoading;
  const error = billsError || cardsError;

  const getCategoryName = (categoryId: string) =>
    categories.find(c => c.id === categoryId)?.name || 'Conta';

  const alerts = useMemo(() => buildDueAlerts(bills, creditCards), [bills, creditCards]);

  const toAlertRows = (alertBills: Bill[], alertCards: CreditCardModel[]): AlertRow[] => [
    ...alertBills.map(b => ({
      id: b.id,
      kind: 'bill' as const,
      date: b.due_date,
      name: getCategoryName(b.category_id),
      amount: b.amount,
    })),
    ...alertCards.map(c => ({
      id: c.id,
      kind: 'card' as const,
      date: c.due_date,
      name: `Cartão: ${c.name}`,
      amount: c.invoice_amount,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  // Contas pendentes (inclusive as projeções recorrentes do mês) e faturas não pagas.
  const events = useMemo<DueEvent[]>(() => {
    const monthBills = bills.filter(b => b.status === 'pending' && b.due_date.startsWith(month));
    const monthKeys = new Set(monthBills.map(b => `${b.category_id}-${b.amount}`));
    const projected = projectRecurringBills(bills, month)
      .filter(b => !monthKeys.has(`${b.category_id}-${b.amount}`));

    const billEvents: DueEvent[] = [...monthBills, ...projected].map(b => ({
      id: b.id,
      kind: 'bill',
      date: b.due_date,
      name: categories.find(c => c.id === b.category_id)?.name || 'Conta',
      amount: b.amount,
      projected: b.id.startsWith('recurring-'),
      status: statusOf(b.due_date),
    }));

    const cardEvents: DueEvent[] = creditCards
      .filter(c => c.status !== 'paid' && c.due_date.startsWith(month))
      .map(c => ({
        id: c.id,
        kind: 'card',
        date: c.due_date,
        name: c.name,
        amount: c.invoice_amount,
        projected: false,
        status: statusOf(c.due_date),
      }));

    return [...billEvents, ...cardEvents].sort((a, b) =>
      a.date.localeCompare(b.date) || a.name.localeCompare(b.name)
    );
  }, [bills, creditCards, categories, month]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, DueEvent[]> = {};
    for (const event of events) (map[event.date] ||= []).push(event);
    return map;
  }, [events]);

  const monthTotalCents = events.reduce((sum, e) => sum + Math.round(e.amount * 100), 0);

  const monthStart = parseISO(`${month}-01`);
  const daysInMonth = getDaysInMonth(monthStart);
  const leadingBlanks = getDay(monthStart);
  const monthLabel = format(monthStart, "MMMM 'de' yyyy", { locale: ptBR });

  const changeMonth = (offset: number) => {
    setMonth(format(addMonths(monthStart, offset), 'yyyy-MM'));
    setSelectedDay(null);
  };

  const shownEvents = selectedDay ? (eventsByDate[selectedDay] ?? []) : events;
  const groupedDates = [...new Set(shownEvents.map(e => e.date))].sort();
  const hasAnyAlert = alerts.overdueBills.length > 0 || alerts.dueSoonBills.length > 0
    || alerts.overdueCards.length > 0 || alerts.dueSoonCards.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vencimentos"
        description="Contas e faturas organizadas pelo dia do vencimento, com os alertas do momento."
      />

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : error ? (
        <p role="alert" className="text-sm text-destructive dark:text-destructive">
          Falha ao carregar os vencimentos: {error}
        </p>
      ) : (
        <>
          {/* ── Alertas ── */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 border-b border-border pb-2 text-lg font-semibold">
              <AlertCircle className="h-5 w-5 text-destructive dark:text-destructive" aria-hidden="true" />
              Alertas
            </h2>
            {hasAnyAlert ? (
              <div className="grid gap-4 md:grid-cols-2">
                <AlertPanel
                  title="Vencidos"
                  tone="danger"
                  rows={toAlertRows(alerts.overdueBills, alerts.overdueCards)}
                  onOpen={kind => navigate(kind === 'bill' ? '/app/bills' : '/app/credit-cards')}
                />
                <AlertPanel
                  title="Vence em breve"
                  tone="warn"
                  rows={toAlertRows(alerts.dueSoonBills, alerts.dueSoonCards)}
                  onOpen={kind => navigate(kind === 'bill' ? '/app/bills' : '/app/credit-cards')}
                />
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success dark:text-success" aria-hidden="true" />
                Nenhuma conta ou fatura vencida ou para vencer nos próximos dias.
              </p>
            )}
          </section>

          {/* ── Calendário ── */}
          <section className="rounded-xl border border-border bg-card p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  aria-label="Mês anterior"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <h2 className="min-w-40 text-center text-sm font-semibold">
                  {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
                </h2>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  aria-label="Próximo mês"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground">
                  {events.length} vencimento{events.length !== 1 ? 's' : ''} • {formatCurrency(monthTotalCents / 100)}
                </p>
                {month !== currentMonth && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => { setMonth(currentMonth); setSelectedDay(null); }}
                  >
                    Hoje
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 pb-1" aria-hidden="true">
              {WEEKDAYS.map(day => (
                <span key={day} className="text-center text-[10px] font-medium uppercase text-muted-foreground sm:text-xs">
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: leadingBlanks }, (_, i) => (
                <span key={`blank-${i}`} aria-hidden="true" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const date = `${month}-${String(i + 1).padStart(2, '0')}`;
                const dayEvents = eventsByDate[date] ?? [];
                const isToday = date === format(new Date(), 'yyyy-MM-dd');
                const isSelected = date === selectedDay;
                return (
                  <button
                    key={date}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`${format(parseISO(date), 'dd/MM/yyyy')} — ${dayEvents.length} vencimento${dayEvents.length !== 1 ? 's' : ''}`}
                    onClick={() => setSelectedDay(isSelected ? null : date)}
                    className={cn(
                      'flex min-h-12 flex-col items-center justify-start gap-1 rounded-lg border px-0.5 py-1 transition-colors sm:min-h-16',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : isToday
                          ? 'border-primary/40 bg-accent/40'
                          : 'border-transparent hover:bg-accent/50'
                    )}
                  >
                    <span className={cn('text-xs tabular-nums sm:text-sm', isToday ? 'font-bold text-primary' : 'text-foreground')}>
                      {i + 1}
                    </span>
                    <span className="flex flex-wrap items-center justify-center gap-0.5">
                      {dayEvents.slice(0, 3).map(event => (
                        <span
                          key={event.id}
                          className={cn('h-1.5 w-1.5 rounded-full', DOT_CLASSES[event.status])}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] leading-none text-muted-foreground">+{dayEvents.length - 3}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Lista ── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
              <h2 className="text-lg font-semibold">
                {selectedDay
                  ? format(parseISO(selectedDay), "dd 'de' MMMM", { locale: ptBR })
                  : `Vencimentos de ${monthLabel}`}
              </h2>
              {selectedDay && (
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="text-xs font-medium text-primary transition-colors hover:underline"
                >
                  Ver mês inteiro
                </button>
              )}
            </div>

            {shownEvents.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Nenhum vencimento"
                description={selectedDay
                  ? 'Nenhuma conta ou fatura vence neste dia.'
                  : 'Nenhuma conta ou fatura em aberto vence neste mês.'}
              />
            ) : (
              <div className="space-y-4">
                {groupedDates.map(date => (
                  <div key={date} className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {format(parseISO(date), "dd 'de' MMMM • EEEE", { locale: ptBR })}
                    </p>
                    {(eventsByDate[date] ?? []).map(event => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => navigate(event.kind === 'bill' ? '/app/bills' : '/app/credit-cards')}
                        className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                            {event.kind === 'bill'
                              ? <Receipt className="h-4 w-4 text-primary" aria-hidden="true" />
                              : <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">{event.name}</span>
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                              {format(parseISO(event.date), 'dd/MM/yyyy', { locale: ptBR })}
                              {event.projected && <span className="italic">Projeção</span>}
                            </span>
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <StatusBadge status={event.status} />
                          <span className="text-sm font-semibold tabular-nums text-foreground">
                            {formatCurrency(event.amount)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
