import type { Bill } from '../types';

export interface MonthlyCategoryIncrease {
  categoryId: string;
  currentCents: number;
  previousCents: number;
  increaseCents: number;
}

export function compareMonthlyBills(
  bills: Pick<Bill, 'reference_month' | 'category_id' | 'amount'>[],
  currentMonth: string,
) {
  const [year, month] = currentMonth.split('-').map(Number);
  const previousMonthDate = new Date(year, month - 2, 1);
  const previousMonth = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const currentByCategory = new Map<string, number>();
  const previousByCategory = new Map<string, number>();

  for (const bill of bills) {
    const totals = bill.reference_month === currentMonth
      ? currentByCategory
      : bill.reference_month === previousMonth
        ? previousByCategory
        : null;
    if (totals) totals.set(bill.category_id, (totals.get(bill.category_id) ?? 0) + Math.round(bill.amount * 100));
  }

  const currentCents = [...currentByCategory.values()].reduce((sum, cents) => sum + cents, 0);
  const previousCents = [...previousByCategory.values()].reduce((sum, cents) => sum + cents, 0);
  const increasedCategories = [...currentByCategory.entries()]
    .map(([categoryId, current]) => {
      const previous = previousByCategory.get(categoryId) ?? 0;
      return { categoryId, currentCents: current, previousCents: previous, increaseCents: current - previous };
    })
    .filter(category => category.increaseCents > 0)
    .sort((a, b) => b.increaseCents - a.increaseCents);

  return { currentMonth, previousMonth, currentCents, previousCents, variationCents: currentCents - previousCents, increasedCategories };
}
