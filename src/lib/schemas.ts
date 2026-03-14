import { z } from 'zod';

export const relationshipSchema = z.enum(['mae', 'pai', 'avo', 'avoa', 'irmao', 'irma', 'tio', 'tia', 'outro']);
export const billStatusSchema = z.enum(['pending', 'paid']);
export const cardStatusSchema = z.enum(['open', 'closed', 'paid']);
export const transactionTypeSchema = z.enum(['to_pay', 'to_receive']);
export const paymentTypeSchema = z.enum(['cash', 'installment']);
export const transactionStatusSchema = z.enum(['pending', 'paid']);

export const dependentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relationship: relationshipSchema,
  notes: z.string().nullable().optional(),
});
export type DependentFormValues = z.infer<typeof dependentSchema>;

export const billCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().nullable().optional(),
  is_system: z.boolean().default(false),
});
export type BillCategoryFormValues = z.infer<typeof billCategorySchema>;

export const billSchema = z.object({
  category_id: z.string().uuid(),
  amount: z.number().nonnegative('Amount must be positive'),
  due_day: z.number().min(1).max(31),
  status: billStatusSchema,
  paid_date: z.string().nullable().optional(),
  reference_month: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format'),
  notes: z.string().nullable().optional(),
  dependent_ids: z.array(z.string().uuid()).default([]),
});
export type BillFormValues = z.infer<typeof billSchema>;

export const creditCardSchema = z.object({
  dependent_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1, 'Name is required'),
  due_day: z.number().min(1).max(31),
  closing_day: z.number().min(1).max(31),
  invoice_amount: z.number().nonnegative(),
  status: cardStatusSchema,
  paid_date: z.string().nullable().optional(),
  reference_month: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format'),
  notes: z.string().nullable().optional(),
});
export type CreditCardFormValues = z.infer<typeof creditCardSchema>;

export const transactionSchema = z.object({
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
});
export type TransactionFormValues = z.infer<typeof transactionSchema>;

export const authSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type AuthFormValues = z.infer<typeof authSchema>;
