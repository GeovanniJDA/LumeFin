import { z } from 'zod';

export const relationshipSchema = z.enum(['mae', 'pai', 'avo', 'avoa', 'irmao', 'irma', 'tio', 'tia', 'outro']);
export const billStatusSchema = z.enum(['pending', 'paid']);
export const cardStatusSchema = z.enum(['open', 'closed', 'paid']);
export const transactionTypeSchema = z.enum(['to_pay', 'to_receive']);
export const paymentTypeSchema = z.enum(['cash', 'installment']);
export const transactionStatusSchema = z.enum(['pending', 'paid']);

export const dependentSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
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
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  status: billStatusSchema,
  paid_date: z.string().nullable().optional(),
  reference_month: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format'),
  notes: z.string().nullable().optional(),
  dependent_ids: z.array(z.string().uuid()).optional(),
});
export type BillFormValues = z.infer<typeof billSchema>;

export const creditCardSchema = z.object({
  dependent_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1, 'Name is required'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  closing_day: z.number().min(1).max(31),
  invoice_amount: z.number().nonnegative(),
  status: cardStatusSchema,
  paid_date: z.string().nullable().optional(),
  reference_month: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM format'),
  color: z.string(),
  notes: z.string().nullable().optional(),
});
export type CreditCardFormValues = z.infer<typeof creditCardSchema>;

export const transactionSchema = z.object({
  dependent_id: z.string().uuid(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  description: z.string().min(2, 'Descrição deve ter pelo menos 2 caracteres'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  type: transactionTypeSchema,
  payment_type: paymentTypeSchema,
  installments: z.number().int().min(1),
  paid_installments: z.number().int().min(0),
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

export const usernameSchema = z.object({
  username: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres')
});
export type UsernameFormValues = z.infer<typeof usernameSchema>;

export const emailSchema = z.object({
  email: z.string().email('Email inválido'),
  confirmEmail: z.string().email('Email inválido')
}).refine(d => d.email === d.confirmEmail, {
  message: 'Os emails não coincidem.',
  path: ['confirmEmail']
});
export type EmailFormValues = z.infer<typeof emailSchema>;

export const passwordSchema = z.object({
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres')
}).refine(d => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword']
});
export type PasswordFormValues = z.infer<typeof passwordSchema>;
