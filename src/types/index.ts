export type Relationship = 
  'mae'|'pai'|'avo'|'avoa'|'irmao'|'irma'|'tio'|'tia'|'outro'

export type BillStatus = 'pending' | 'paid'
export type CardStatus = 'open' | 'closed' | 'paid'
export type TransactionType = 'to_pay' | 'to_receive'
export type PaymentType = 'cash' | 'installment'
export type TransactionStatus = 'pending' | 'paid'

export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  updated_at: string
}

export interface Dependent {
  id: string
  user_id: string
  name: string
  relationship: Relationship
  notes: string | null
  created_at: string
}

export interface BillCategory {
  id: string
  user_id: string | null
  name: string
  icon: string | null
  is_system: boolean
  created_at: string
}

export interface Bill {
  id: string
  user_id: string
  category_id: string
  amount: number
  due_date: string
  status: BillStatus
  paid_date: string | null
  reference_month: string
  notes: string | null
  created_at: string
}

export interface BillDependent {
  bill_id: string
  dependent_id: string
}

export interface CreditCard {
  id: string
  user_id: string
  dependent_id: string | null
  name: string
  due_date: string
  closing_day: number
  invoice_amount: number
  status: CardStatus
  paid_date: string | null
  reference_month: string
  color: string | null
  notes: string | null
  created_at: string
  _purchaseCount?: number
}

export type PurchaseType = 'cash' | 'installment' | 'recurring'

export interface CardPurchase {
  id: string
  user_id: string
  credit_card_id: string
  description: string
  amount: number
  purchase_date: string
  type: PurchaseType
  installments: number
  current_installment: number
  reference_month: string
  notes: string | null
  created_at: string
}

export interface DependentTransaction {
  id: string
  user_id: string
  dependent_id: string
  transaction_date: string
  description: string
  amount: number
  type: TransactionType
  payment_type: PaymentType
  installments: number
  paid_installments: number
  status: TransactionStatus
  settled_date: string | null
  notes: string | null
  created_at: string
}

// Joined types for UI (fetched with relations)
export interface BillWithRelations extends Bill {
  bill_categories: BillCategory
  dependents: Dependent[]
}

export interface CreditCardWithDependent extends CreditCard {
  dependents: Dependent | null
}

export interface TransactionWithDependent extends DependentTransaction {
  dependents: Dependent
}
