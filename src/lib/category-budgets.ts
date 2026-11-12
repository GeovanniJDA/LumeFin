import type { Bill, BillCategory, CategoryBudget } from '../types';
import { projectRecurringBills } from './due-dates';

export type BudgetAlertLevel = 'safe' | 'near' | 'exceeded';

export function calculateCategoryBudgets(
  budgets: CategoryBudget[],
  bills: Bill[],
  categories: BillCategory[],
  month: string,
) {
  const spentByCategory = new Map<string, number>();
  const monthBills = [...bills, ...projectRecurringBills(bills, month)];
  for (const bill of monthBills) {
    if (bill.reference_month !== month) continue;
    spentByCategory.set(
      bill.category_id,
      (spentByCategory.get(bill.category_id) ?? 0) + Math.round(bill.amount * 100),
    );
  }

  return budgets.map(budget => {
    const limitCents = Math.round(budget.limit_amount * 100);
    const spentCents = spentByCategory.get(budget.category_id) ?? 0;
    const percentage = limitCents > 0 ? spentCents / limitCents * 100 : 0;
    const alertLevel: BudgetAlertLevel = percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'near' : 'safe';
    return {
      ...budget,
      categoryName: categories.find(category => category.id === budget.category_id)?.name ?? 'Categoria removida',
      limitCents,
      spentCents,
      percentage,
      alertLevel,
    };
  }).sort((a, b) => b.percentage - a.percentage);
}
