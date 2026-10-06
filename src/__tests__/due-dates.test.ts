import { describe, it, expect } from 'vitest';
import { format } from 'date-fns';
import { buildDueAlerts, projectRecurringBills } from '../lib/due-dates';
import type { Bill, CreditCard } from '../types';

const makeBill = (overrides: Partial<Bill> = {}): Bill => ({
  id: 'b1',
  user_id: 'u1',
  category_id: 'cat-1',
  amount: 100,
  due_date: '2025-01-10',
  status: 'pending',
  paid_date: null,
  reference_month: '2025-01',
  notes: null,
  created_at: '2025-01-01T00:00:00Z',
  is_recurring: false,
  ...overrides,
});

const makeCard = (overrides: Partial<CreditCard> = {}): CreditCard => ({
  id: 'c1',
  user_id: 'u1',
  dependent_id: null,
  name: 'Nubank',
  due_date: '2025-01-12',
  closing_day: 5,
  invoice_amount: 500,
  status: 'open',
  paid_date: null,
  reference_month: '2025-01',
  color: null,
  notes: null,
  created_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const dayOffset = (days: number) => format(new Date(Date.now() + days * 86400000), 'yyyy-MM-dd');

describe('projectRecurringBills', () => {
  it('projects one occurrence per category+amount', () => {
    const bills = [
      makeBill({ id: 'a', is_recurring: true, reference_month: '2025-01', due_date: '2025-01-10' }),
      makeBill({ id: 'b', is_recurring: true, reference_month: '2025-02', due_date: '2025-02-10' }),
    ];

    const projected = projectRecurringBills(bills, '2025-06');

    expect(projected).toHaveLength(1);
    expect(projected[0].id).toBe('recurring-a-2025-06');
  });

  it('does not project when the month already has the recurring bill', () => {
    const bills = [
      makeBill({ id: 'a', is_recurring: true, reference_month: '2025-01', due_date: '2025-01-10' }),
      makeBill({ id: 'b', is_recurring: true, reference_month: '2025-06', due_date: '2025-06-10' }),
    ];

    expect(projectRecurringBills(bills, '2025-06')).toHaveLength(0);
  });

  it('ignores non-recurring bills and months before the reference month', () => {
    const bills = [
      makeBill({ id: 'a', is_recurring: false, reference_month: '2025-01', due_date: '2025-01-10' }),
      makeBill({ id: 'b', is_recurring: true, reference_month: '2025-06', due_date: '2025-06-10' }),
    ];

    expect(projectRecurringBills([bills[0]], '2025-07')).toHaveLength(0);
    expect(projectRecurringBills([bills[1]], '2025-05')).toHaveLength(0);
  });

  it('rewrites id, reference month and status, clamping day 31 to the month length', () => {
    const bills = [
      makeBill({ id: 'a', is_recurring: true, due_date: '2025-01-31', reference_month: '2025-01' }),
    ];

    const [projected] = projectRecurringBills(bills, '2025-02');

    expect(projected.id).toBe('recurring-a-2025-02');
    expect(projected.due_date).toBe('2025-02-28');
    expect(projected.reference_month).toBe('2025-02');
    expect(projected.status).toBe('pending');
  });
});

describe('buildDueAlerts', () => {
  it('splits pending bills between overdue and due soon, skipping paid ones', () => {
    const bills = [
      makeBill({ id: 'late', due_date: dayOffset(-1) }),
      makeBill({ id: 'soon', due_date: dayOffset(1) }),
      makeBill({ id: 'paid', status: 'paid', due_date: dayOffset(-1) }),
    ];

    const alerts = buildDueAlerts(bills, []);

    expect(alerts.overdueBills.map(b => b.id)).toEqual(['late']);
    expect(alerts.dueSoonBills.map(b => b.id)).toEqual(['soon']);
  });

  it('alerts only on open invoices, ignoring closed and paid cards', () => {
    const cards = [
      makeCard({ id: 'late', status: 'open', due_date: dayOffset(-1) }),
      makeCard({ id: 'soon', status: 'open', due_date: dayOffset(1) }),
      makeCard({ id: 'closed', status: 'closed', due_date: dayOffset(1) }),
      makeCard({ id: 'paid', status: 'paid', due_date: dayOffset(-1) }),
    ];

    const alerts = buildDueAlerts([], cards);

    expect(alerts.overdueCards.map(c => c.id)).toEqual(['late']);
    expect(alerts.dueSoonCards.map(c => c.id)).toEqual(['soon']);
  });

  it('includes the projection of a recurring bill that has no record in the current month', () => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const todayDay = format(new Date(), 'dd');
    const bills = [
      makeBill({
        id: 'rec',
        is_recurring: true,
        reference_month: '2020-01',
        due_date: `2020-01-${todayDay}`,
      }),
    ];

    const alerts = buildDueAlerts(bills, []);

    // a conta original segue vencida; a projeção entra junto para o mês corrente.
    expect(alerts.overdueBills.map(b => b.id)).toEqual(['rec', `recurring-rec-${currentMonth}`]);
  });

  it('keeps a recurring bill already recorded this month out of the projections', () => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const bills = [
      makeBill({
        id: 'old',
        is_recurring: true,
        reference_month: '2020-01',
        due_date: `2020-01-01`,
      }),
      makeBill({
        id: 'now',
        is_recurring: true,
        reference_month: currentMonth,
        due_date: dayOffset(1),
      }),
    ];

    const alerts = buildDueAlerts(bills, []);

    // 'old' continua vencida; o que não aparece é a projeção duplicada dele.
    expect(alerts.overdueBills.map(b => b.id)).toEqual(['old']);
    expect(alerts.dueSoonBills.map(b => b.id)).toEqual(['now']);
  });
});
