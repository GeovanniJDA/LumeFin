import { useCardPurchaseStore } from '@/store/card-purchase-store'

export function useCardPurchases(cardId: string) {
  const store = useCardPurchaseStore()

  const purchases = store.purchases.filter(p => p.credit_card_id === cardId);

  const totalByType = {
    cash: purchases
      .filter(p => p.type === 'cash')
      .reduce((s, p) => s + p.amount, 0),
    installment: purchases
      .filter(p => p.type === 'installment')
      .reduce((s, p) => s + (p.amount / p.installments), 0),
    recurring: purchases
      .filter(p => p.type === 'recurring')
      .reduce((s, p) => s + p.amount, 0),
  }

  const grandTotal = totalByType.cash + totalByType.installment + totalByType.recurring

  return {
    purchases,
    loading: store.loading,
    error: store.error,
    fetchByCard: store.fetchByCard,
    add: store.add,
    update: store.update,
    remove: store.remove,
    totalByType,
    grandTotal,
  }
}
