import { z } from 'zod';
import {
  userSchema,
  dependentSchema,
  billCategorySchema,
  billSchema,
  billDependentSchema,
  creditCardSchema,
  dependentTransactionSchema,
  statusSchema,
  transactionTypeSchema,
  paymentTypeSchema,
  transactionStatusSchema,
} from '../lib/schemas';

export type User = z.infer<typeof userSchema>;
export type Dependent = z.infer<typeof dependentSchema>;
export type BillCategory = z.infer<typeof billCategorySchema>;
export type Bill = z.infer<typeof billSchema>;
export type BillDependent = z.infer<typeof billDependentSchema>;
export type CreditCard = z.infer<typeof creditCardSchema>;
export type DependentTransaction = z.infer<typeof dependentTransactionSchema>;

export type Status = z.infer<typeof statusSchema>;
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type PaymentType = z.infer<typeof paymentTypeSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
