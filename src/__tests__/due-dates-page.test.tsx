import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { format } from 'date-fns';
import DueDates from '../pages/due-dates';
import type { Bill, CreditCard } from '../types';

const currentMonth = format(new Date(), 'yyyy-MM');
const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

const bills: Bill[] = [{
  id: 'b1',
  user_id: 'u1',
  category_id: 'cat-1',
  amount: 123.45,
  due_date: yesterday,
  status: 'pending',
  paid_date: null,
  reference_month: currentMonth,
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
  is_recurring: false,
}];

const creditCards: CreditCard[] = [{
  id: 'c1',
  user_id: 'u1',
  dependent_id: null,
  name: 'Nubank',
  due_date: yesterday,
  closing_day: 5,
  invoice_amount: 500,
  status: 'open',
  paid_date: null,
  reference_month: currentMonth,
  color: null,
  notes: null,
  created_at: '2026-01-01T00:00:00Z',
}];

vi.mock('../hooks/use-bills', () => ({
  useBills: () => ({ bills, loading: false, error: null }),
}));
vi.mock('../hooks/use-credit-cards', () => ({
  useCreditCards: () => ({ creditCards, loading: false, error: null }),
}));
vi.mock('../hooks/use-categories', () => ({
  useCategories: () => ({
    categories: [{ id: 'cat-1', user_id: null, name: 'Energia', icon: 'zap', is_system: true, created_at: '' }],
  }),
}));

describe('DueDates page', () => {
  it('renders the calendar, the alerts and the month list', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/app/due-dates']}>
        <DueDates />
      </MemoryRouter>
    );

    expect(html).toContain('Vencimentos');
    expect(html).toContain('Alertas');
    expect(html).toContain('Vencidos (2)');
    expect(html).toContain('Energia');
    expect(html).toContain('Cartão: Nubank');
    expect(html).toContain('123,45');
    // célula de hoje com a data no rótulo acessível
    expect(html).toContain(`aria-label="${format(new Date(), 'dd/MM/yyyy')}`);
  });
});
