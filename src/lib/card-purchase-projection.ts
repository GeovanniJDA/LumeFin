import type { CardPurchaseWithDependents, PurchaseType } from '@/types'

/**
 * Projeção mensal de compras do cartão.
 *
 * Modelo de dados: cada compra tem `reference_month` = mês da parcela/atualização
 * atual e `current_installment` = número da parcela vigente. O roll-forward
 * (`rollForwardCardPurchases`) avança ambos a cada fatura paga.
 *
 * Portanto a parcela de número N cai no mês `reference_month + (N - current_installment)`.
 * Este módulo é a fonte única dessa conta — a página de detalhe, o gráfico e o
 * total do mês usam as mesmas funções.
 */

export interface MonthlyPurchaseProjection extends CardPurchaseWithDependents {
  /** Número da parcela exibida no mês (apenas para compras parceladas). */
  installmentNumber?: number
  /** Rótulo "n/total" da parcela exibida no mês (apenas para compras parceladas). */
  installmentLabel?: string
  /** Valor que a compra adiciona à fatura do mês. */
  monthlyAmount: number
}

function monthIndex(month: string): number {
  const [year, monthNumber] = month.split('-').map(Number)
  return year * 12 + (monthNumber - 1)
}

function monthFromIndex(index: number): string {
  const year = Math.floor(index / 12)
  const monthNumber = (index % 12) + 1
  return `${year}-${String(monthNumber).padStart(2, '0')}`
}

const TYPE_ORDER: Record<PurchaseType, number> = {
  cash: 0,
  recurring: 1,
  installment: 2
}

/**
 * Ordem determinística da lista mensal:
 * 1. À vista, depois recorrentes, depois parceladas (grupos fixos);
 * 2. parceladas em ordem crescente de número da parcela (1/12 antes de 3/12);
 * 3. empate resolvido pela data da compra mais recente.
 */
function compareMonthlyPurchases(
  a: MonthlyPurchaseProjection,
  b: MonthlyPurchaseProjection
): number {
  const byType = TYPE_ORDER[a.type] - TYPE_ORDER[b.type]
  if (byType !== 0) return byType

  if (a.type === 'installment' && b.type === 'installment') {
    const byInstallment = (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0)
    if (byInstallment !== 0) return byInstallment
  }

  return b.purchase_date.localeCompare(a.purchase_date)
}

/**
 * Retorna a ocorrência da compra no mês alvo, ou `null` quando a compra
 * não pertence àquele mês (ex.: parcela fora do intervalo 1..installments).
 */
export function getPurchaseOccurrenceForMonth(
  purchase: CardPurchaseWithDependents,
  targetMonth: string
): MonthlyPurchaseProjection | null {
  const monthDiff = monthIndex(targetMonth) - monthIndex(purchase.reference_month)

  if (purchase.type === 'cash') {
    return monthDiff === 0 ? { ...purchase, monthlyAmount: purchase.amount } : null
  }

  if (purchase.type === 'recurring') {
    // A recorrência vale desde a criação da compra — não desde o mês de
    // referência corrente, que avança a cada fatura paga (roll-forward).
    // Usar o menor entre o mês da compra e o mês de referência cobre também
    // compras cujo mês de referência foi definido antes da data da compra.
    const purchaseMonth = purchase.purchase_date?.slice(0, 7)
    const anchor =
      purchaseMonth && purchaseMonth < purchase.reference_month
        ? purchaseMonth
        : purchase.reference_month
    return targetMonth >= anchor ? { ...purchase, monthlyAmount: purchase.amount } : null
  }

  if (purchase.type === 'installment') {
    const installmentNumber = (purchase.current_installment || 1) + monthDiff
    if (installmentNumber < 1 || installmentNumber > purchase.installments) return null
    return {
      ...purchase,
      installmentNumber,
      installmentLabel: `${installmentNumber}/${purchase.installments}`,
      monthlyAmount: purchase.amount / purchase.installments
    }
  }

  return null
}

/** Compras que caem no mês alvo, na ordem determinística de exibição. */
export function getPurchasesForMonth(
  purchases: CardPurchaseWithDependents[],
  targetMonth: string
): MonthlyPurchaseProjection[] {
  return purchases
    .map(p => getPurchaseOccurrenceForMonth(p, targetMonth))
    .filter((p): p is MonthlyPurchaseProjection => p !== null)
    .sort(compareMonthlyPurchases)
}

/**
 * Fatura do mês já foi paga?
 *
 * Deriva do próprio cartão: pagar a fatura avança `reference_month`
 * (fluxo "Marcar como paga"), então todo mês anterior ao mês de referência
 * atual já está quitado. Não depende de histórico externo.
 */
export function isInvoiceMonthPaid(
  card: { reference_month?: string | null },
  month: string
): boolean {
  if (!card.reference_month) return false
  return month < card.reference_month
}

/**
 * Chave de uma ocorrência quitada: uma compra em um mês específico.
 * Espelha a chave única (card_purchase_id, reference_month) usada no banco.
 */
export function settlementKey(purchaseId: string, month: string): string {
  return `${purchaseId}:${month}`
}

/**
 * Meses das parcelas ainda não quitadas de uma compra parcelada, a partir de
 * `fromMonth` (inclusive) até a última parcela. Serve para "antecipar as
 * parcelas restantes": quitar de uma vez o mês atual e os seguintes.
 * Compras à vista/recorrentes não têm parcelas restantes.
 */
export function remainingInstallmentMonths(
  purchase: CardPurchaseWithDependents,
  fromMonth: string
): string[] {
  if (purchase.type !== 'installment') return []

  const currentInstallment = purchase.current_installment || 1
  const referenceIndex = monthIndex(purchase.reference_month)
  const firstRemaining = Math.max(
    currentInstallment + (monthIndex(fromMonth) - referenceIndex),
    1
  )

  const months: string[] = []
  for (let n = firstRemaining; n <= purchase.installments; n++) {
    months.push(monthFromIndex(referenceIndex + (n - currentInstallment)))
  }
  return months
}

/** Total projetado de cada mês, na ordem dos meses informados (para o gráfico). */
export function getMonthTotals(
  purchases: CardPurchaseWithDependents[],
  months: string[]
): Array<{ month: string; total: number }> {
  return months.map(month => ({
    month,
    total: getPurchasesForMonth(purchases, month).reduce((sum, p) => sum + p.monthlyAmount, 0)
  }))
}
