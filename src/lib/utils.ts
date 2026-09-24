import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parseISO, differenceInDays, isPast } from 'date-fns';
import type { DependentTransaction, TransactionPayment } from '@/types';

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

type TransactionWithPayments = Pick<DependentTransaction, 'amount' | 'status' | 'payment_type' | 'installments' | 'manual_paid_installments'> & {
  transaction_payments?: Pick<TransactionPayment, 'amount'>[];
}

export function getTransactionPaidCents(transaction: TransactionWithPayments): number {
  const amountCents = Math.round(transaction.amount * 100);
  if (transaction.status === 'paid') return amountCents;

  const paymentCents = (transaction.transaction_payments ?? [])
    .reduce((sum, payment) => sum + Math.round(payment.amount * 100), 0);
  const manualInstallmentCents = transaction.payment_type === 'installment'
    ? Math.round(amountCents * (transaction.manual_paid_installments || 0) / Math.max(transaction.installments || 1, 1))
    : 0;

  return Math.min(paymentCents + manualInstallmentCents, amountCents);
}

export function getTransactionRemainingCents(transaction: TransactionWithPayments): number {
  return Math.max(Math.round(transaction.amount * 100) - getTransactionPaidCents(transaction), 0);
}
