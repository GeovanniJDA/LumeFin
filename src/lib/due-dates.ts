import { format, parseISO } from 'date-fns';
import type { Bill, CreditCard } from '@/types';
import { isDueSoon, isOverdue } from './utils';

// ponytail: a série recorrente é identificada por categoria+valor e o dia 31
// cai no último dia de meses curtos (mesma regra da tela de Contas).
// upgrade path: guardar um ID de série no banco para separar obrigações
// idênticas e datas de vencimento fora do mês de referência.
export function projectRecurringBills(bills: Bill[], month: string): Bill[] {
  const [year, monthNumber] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();

  const existingKeys = new Set(
    bills
      .filter(b => b.is_recurring && b.reference_month === month && !b.id.startsWith('recurring-'))
      .map(b => `${b.category_id}-${b.amount}`)
  );

  const seenKeys = new Set<string>();
  return bills
    .filter(b => b.is_recurring && b.reference_month < month)
    .filter(b => {
      const key = `${b.category_id}-${b.amount}`;
      if (existingKeys.has(key) || seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    })
    .map(b => ({
      ...b,
      id: `recurring-${b.id}-${month}`,
      due_date: `${month}-${String(Math.min(parseISO(b.due_date).getDate(), daysInMonth)).padStart(2, '0')}`,
      reference_month: month,
      status: 'pending' as const,
    }));
}

export interface DueAlerts {
  overdueBills: Bill[];
  dueSoonBills: Bill[];
  overdueCards: CreditCard[];
  dueSoonCards: CreditCard[];
}

// Mesmas regras do dashboard: contas pendentes e faturas em aberto ('open'),
// vencidas ou a vencer em até 3 dias, com as projeções do mês corrente.
export function buildDueAlerts(bills: Bill[], cards: CreditCard[]): DueAlerts {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const projections = projectRecurringBills(bills, currentMonth);

  const overdueBills = [
    ...bills.filter(b => b.status === 'pending' && isOverdue(b.due_date)),
    ...projections.filter(b => isOverdue(b.due_date)),
  ];
  const overdueBillIds = new Set(overdueBills.map(b => b.id));
  const dueSoonBills = [
    ...bills.filter(b => b.status === 'pending' && isDueSoon(b.due_date)),
    ...projections.filter(b => isDueSoon(b.due_date)),
  ].filter(b => !overdueBillIds.has(b.id));

  const overdueCards = cards.filter(c => c.status === 'open' && isOverdue(c.due_date));
  const overdueCardIds = new Set(overdueCards.map(c => c.id));
  const dueSoonCards = cards.filter(c => c.status === 'open' && isDueSoon(c.due_date) && !overdueCardIds.has(c.id));

  return { overdueBills, dueSoonBills, overdueCards, dueSoonCards };
}
