import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
});

export const dependentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
});

export const billCategorySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  name: z.string().min(1, 'Name is required'),
  icon: z.string(),
  is_system: z.boolean(),
  created_at: z.string(),
});

export const statusSchema = z.enum(['pending', 'paid', 'open', 'closed']);

export const billSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  category_id: z.string().uuid(),
  amount: z.number().nonnegative('Amount must be positive'),
  due_day: z.number().min(1).max(31),
  status: statusSchema,
  paid_date: z.string().nullable().optional(),
  reference_month: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format'),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
});

export const billDependentSchema = z.object({
  bill_id: z.string().uuid(),
  dependent_id: z.string().uuid(),
});

export const creditCardSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  dependent_id: z.string().uuid().nullable(),
  name: z.string().min(1, 'Name is required'),
  due_day: z.number().min(1).max(31),
  closing_day: z.number().min(1).max(31),
  invoice_amount: z.number().nonnegative(),
  status: statusSchema,
  paid_date: z.string().nullable().optional(),
  reference_month: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format'),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
});

export const transactionTypeSchema = z.enum(['to_pay', 'to_receive']);
export const paymentTypeSchema = z.enum(['cash', 'installment']);
export const transactionStatusSchema = z.enum(['pending', 'paid']);

export const dependentTransactionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  dependent_id: z.string().uuid(),
  transaction_date: z.string(),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().nonnegative(),
  type: transactionTypeSchema,
  payment_type: paymentTypeSchema,
  installments: z.number().int().min(1).nullable().optional(),
  paid_installments: z.number().int().min(0).nullable().optional(),
  status: transactionStatusSchema,
  settled_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
});
