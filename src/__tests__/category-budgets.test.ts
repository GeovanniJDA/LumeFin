import { describe, expect, it } from 'vitest';
import type { Bill, BillCategory, CategoryBudget } from '../types';
import { calculateCategoryBudgets } from '../lib/category-budgets';

const category: BillCategory = { id: 'food', user_id: null, name: 'Mercado', icon: null, is_system: true, created_at: '' };
const budget: CategoryBudget = {
  id: 'budget', user_id: 'user', category_id: 'food', reference_month: '2026-04', limit_amount: 100, created_at: '',
};
const bill = (id: string, month: string, amount: number, status: Bill['status'] = 'pending'): Bill => ({
  id, user_id: 'user', category_id: 'food', amount, due_date: `${month}-10`, status,
  paid_date: null, reference_month: month, notes: null, created_at: '', is_recurring: false,
});

describe('calculateCategoryBudgets', () => {
  it('sums paid and pending bills for the selected month and flags near/exceeded limits', () => {
    const result = calculateCategoryBudgets(
      [budget], [bill('paid', '2026-04', 45, 'paid'), bill('pending', '2026-04', 35), bill('other', '2026-03', 100)], [category], '2026-04',
    );

    expect(result[0]).toMatchObject({ spentCents: 8000, limitCents: 10000, percentage: 80, alertLevel: 'near' });
  });

  it('marks overspending and returns safe for unused budget', () => {
    const results = calculateCategoryBudgets(
      [budget, { ...budget, id: 'transport', category_id: 'transport' }],
      [bill('over', '2026-04', 120)], [category], '2026-04',
    );

    expect(results.map(item => item.alertLevel)).toEqual(['exceeded', 'safe']);
    expect(results[1].categoryName).toBe('Categoria removida');
  });

  it('includes an unrecorded recurring bill in the selected month', () => {
    const recurring = { ...bill('recurring', '2026-03', 25), is_recurring: true };
    const result = calculateCategoryBudgets([budget], [recurring], [category], '2026-04');

    expect(result[0]).toMatchObject({ spentCents: 2500, percentage: 25, alertLevel: 'safe' });
  });
});
