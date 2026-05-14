import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parseISO, differenceInDays, isPast } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, locale = 'pt-BR', currency = 'BRL'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
}
export function isDueSoon(dueDate: string, daysThreshold = 3): boolean {
  const date = parseISO(dueDate);
  const diff = differenceInDays(date, new Date());
  return diff <= daysThreshold && diff >= 0;
}

export function isOverdue(dueDate: string): boolean {
  return isPast(parseISO(dueDate));
}

export function calculateNetBalance(transactions: { type: 'to_pay' | 'to_receive', amount: number }[]): number {
  return transactions.reduce((acc, t) => t.type === 'to_receive' ? acc + t.amount : acc - t.amount, 0);
}
