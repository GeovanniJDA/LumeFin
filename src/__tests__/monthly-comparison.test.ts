import { describe, expect, it } from 'vitest';
import type { Bill } from '../types';
import { compareMonthlyBills } from '../lib/monthly-comparison';

const bill = (id: string, reference_month: string, category_id: string, amount: number): Bill => ({
  id, user_id: 'user', category_id, amount, due_date: `${reference_month}-10`, status: 'pending',
  paid_date: null, reference_month, notes: null, created_at: `${reference_month}-01T00:00:00Z`, is_recurring: false,
});

describe('compareMonthlyBills', () => {
  it('compares current and previous months by category, excluding other months', () => {
    const result = compareMonthlyBills([
      bill('old', '2025-12', 'food', 900),
      bill('current', '2026-01', 'food', 1000),
      bill('new-category', '2026-01', 'travel', 250),
      bill('future', '2026-02', 'food', 5000),
    ], '2026-01');

    expect(result.previousMonth).toBe('2025-12');
    expect(result.currentCents).toBe(125000);
    expect(result.previousCents).toBe(90000);
    expect(result.variationCents).toBe(35000);
    expect(result.increasedCategories).toEqual([
      { categoryId: 'travel', currentCents: 25000, previousCents: 0, increaseCents: 25000 },
      { categoryId: 'food', currentCents: 100000, previousCents: 90000, increaseCents: 10000 },
    ]);
  });

  it('handles year boundaries and categories that decreased', () => {
    const result = compareMonthlyBills([
      bill('previous', '2025-12', 'home', 100),
      bill('current', '2026-01', 'home', 50),
    ], '2026-01');

    expect(result.previousMonth).toBe('2025-12');
    expect(result.increasedCategories).toEqual([]);
    expect(result.variationCents).toBe(-5000);
  });
});
