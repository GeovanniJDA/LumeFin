import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, locale = 'pt-BR', currency = 'BRL'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
}

export function isDueSoon(dueDay: number): boolean {
  const today = new Date().getDate();
  return dueDay >= today && dueDay <= today + 5;
}

export function isOverdue(dueDay: number): boolean {
  const today = new Date().getDate();
  return dueDay < today;
}

export function calculateNetBalance(transactions: { type: 'to_pay' | 'to_receive', amount: number }[]): number {
  return transactions.reduce((acc, t) => t.type === 'to_receive' ? acc + t.amount : acc - t.amount, 0);
}
