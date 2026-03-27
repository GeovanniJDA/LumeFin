import { describe, it, expect } from 'vitest';
import { formatCurrency, isDueSoon, isOverdue, calculateNetBalance } from '../lib/utils';

describe('Utils Functions', () => {
  describe('formatCurrency', () => {
    it('should format a number as BRL currency', () => {
      expect(formatCurrency(1000)).toBe('R$ 1.000,00');
      expect(formatCurrency(0)).toBe('R$ 0,00');
      expect(formatCurrency(-500)).toBe('-R$ 500,00');
    });

    it('should format a number as USD currency', () => {
      expect(formatCurrency(1000, 'en-US', 'USD')).toBe('$1,000.00');
      expect(formatCurrency(0, 'en-US', 'USD')).toBe('$0.00');
      expect(formatCurrency(-500, 'en-US', 'USD')).toBe('-$500.00');
    });
  });

  describe('isDueSoon', () => {
    it('should return true if due date is within threshold days', () => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + 2); // 2 days from now

      expect(isDueSoon(dueDate.toISOString(), 3)).toBe(true);
    });

    it('should return false if due date is beyond threshold days', () => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + 5); // 5 days from now

      expect(isDueSoon(dueDate.toISOString(), 3)).toBe(false);
    });

    it('should return false if due date is in the past', () => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() - 1); // 1 day ago

      expect(isDueSoon(dueDate.toISOString(), 3)).toBe(false);
    });
  });

  describe('isOverdue', () => {
    it('should return true if due date is in the past', () => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() - 1); // 1 day ago

      expect(isOverdue(dueDate.toISOString())).toBe(true);
    });

    it('should return true if due date is today but time has passed', () => {
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setHours(today.getHours() - 1); // 1 hour ago

      expect(isOverdue(dueDate.toISOString())).toBe(true);
    });

    it('should return false if due date is in the future', () => {
      const today = new Date();
      const dueDateFuture = new Date(today);
      dueDateFuture.setDate(today.getDate() + 1); // 1 day from now

      expect(isOverdue(dueDateFuture.toISOString())).toBe(false);
    });
  });

  describe('calculateNetBalance', () => {
    it('should calculate net balance correctly with mixed transactions', () => {
      const transactions = [
        { type: 'to_receive' as const, amount: 100 },
        { type: 'to_pay' as const, amount: 50 },
        { type: 'to_receive' as const, amount: 25 },
        { type: 'to_pay' as const, amount: 75 }
      ];

      expect(calculateNetBalance(transactions)).toBe(0);
    });

    it('should calculate net balance correctly with only to_receive transactions', () => {
      const transactions = [
        { type: 'to_receive' as const, amount: 100 },
        { type: 'to_receive' as const, amount: 50 }
      ];

      expect(calculateNetBalance(transactions)).toBe(150);
    });

    it('should calculate net balance correctly with only to_pay transactions', () => {
      const transactions = [
        { type: 'to_pay' as const, amount: 100 },
        { type: 'to_pay' as const, amount: 50 }
      ];

      expect(calculateNetBalance(transactions)).toBe(-150);
    });

    it('should return 0 for empty transactions array', () => {
      expect(calculateNetBalance([])).toBe(0);
    });
  });
});