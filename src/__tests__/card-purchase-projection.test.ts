import { describe, it, expect } from 'vitest'
import {
  getPurchaseOccurrenceForMonth,
  getPurchasesForMonth,
  getMonthTotals,
  isInvoiceMonthPaid
} from '@/lib/card-purchase-projection'
import type { CardPurchaseWithDependents } from '@/types'

function purchase(overrides: Partial<CardPurchaseWithDependents>): CardPurchaseWithDependents {
  return {
    id: overrides.id ?? 'p-1',
    user_id: 'user-1',
    credit_card_id: 'card-1',
    description: 'Compra',
    amount: 300,
    purchase_date: '2026-09-05',
    type: 'installment',
    installments: 12,
    current_installment: 1,
    reference_month: '2026-09',
    notes: null,
    created_at: '2026-09-05T12:00:00Z',
    dependents: [],
    ...overrides
  }
}

describe('getPurchaseOccurrenceForMonth', () => {
  it('usa current_installment como base para a parcela vigente (regressão: a projeção antiga ignorava roll-forward)', () => {
    // Compra 12x iniciada em 2026-03, já rolada até a 7ª parcela em 2026-09.
    const rolled = purchase({
      reference_month: '2026-09',
      current_installment: 7
    })

    const occurrence = getPurchaseOccurrenceForMonth(rolled, '2026-09')
    expect(occurrence).not.toBeNull()
    expect(occurrence!.installmentLabel).toBe('7/12')

    // A 1ª parcela ocorreu em 2026-03: target - 6 meses de diferença.
    const first = getPurchaseOccurrenceForMonth(rolled, '2026-03')
    expect(first).not.toBeNull()
    expect(first!.installmentLabel).toBe('1/12')

    // Depois da última parcela (2027-02) não aparece mais.
    expect(getPurchaseOccurrenceForMonth(rolled, '2027-03')).toBeNull()
  })

  it('compra nova ainda na 1ª parcela mantém o comportamento', () => {
    const fresh = purchase({ reference_month: '2026-09', current_installment: 1 })
    expect(getPurchaseOccurrenceForMonth(fresh, '2026-09')!.installmentLabel).toBe('1/12')
    expect(getPurchaseOccurrenceForMonth(fresh, '2026-10')!.installmentLabel).toBe('2/12')
    // Última parcela (12/12) é 11 meses depois: 2027-08. Depois disso, nada.
    expect(getPurchaseOccurrenceForMonth(fresh, '2027-08')!.installmentLabel).toBe('12/12')
    expect(getPurchaseOccurrenceForMonth(fresh, '2027-09')).toBeNull()
    expect(getPurchaseOccurrenceForMonth(fresh, '2028-09')).toBeNull()
  })

  it('compras à vista só aparecem no mês de referência; recorrentes a partir dele', () => {
    const cash = purchase({ type: 'cash', installments: 1, current_installment: 1, amount: 120 })
    expect(getPurchaseOccurrenceForMonth(cash, '2026-09')!.monthlyAmount).toBe(120)
    expect(getPurchaseOccurrenceForMonth(cash, '2026-10')).toBeNull()

    const recurring = purchase({ type: 'recurring', installments: 1, current_installment: 1, amount: 60 })
    expect(getPurchaseOccurrenceForMonth(recurring, '2026-08')).toBeNull()
    expect(getPurchaseOccurrenceForMonth(recurring, '2027-01')!.monthlyAmount).toBe(60)
  })

  it('recorrente criada em julho permanece no histórico dos meses anteriores mesmo após o roll-forward da fatura (regressão: sumia do histórico)', () => {
    // Criada em 15/07/2026; duas faturas pagas desde então, reference_month já avançou para 2026-09.
    const rolled = purchase({
      type: 'recurring',
      installments: 1,
      current_installment: 1,
      amount: 50,
      purchase_date: '2026-07-15',
      reference_month: '2026-09'
    })

    expect(getPurchaseOccurrenceForMonth(rolled, '2026-07')!.monthlyAmount).toBe(50)
    expect(getPurchaseOccurrenceForMonth(rolled, '2026-08')!.monthlyAmount).toBe(50)
    expect(getPurchaseOccurrenceForMonth(rolled, '2026-09')!.monthlyAmount).toBe(50)
    expect(getPurchaseOccurrenceForMonth(rolled, '2026-10')!.monthlyAmount).toBe(50)
    // Antes da criação, nada.
    expect(getPurchaseOccurrenceForMonth(rolled, '2026-06')).toBeNull()
  })

  it('recorrente com mês de referência anterior à data da compra começa no mês de referência', () => {
    const earlyRef = purchase({
      type: 'recurring',
      installments: 1,
      current_installment: 1,
      purchase_date: '2026-10-01',
      reference_month: '2026-09'
    })
    expect(getPurchaseOccurrenceForMonth(earlyRef, '2026-09')!.monthlyAmount).toBe(300)
    expect(getPurchaseOccurrenceForMonth(earlyRef, '2026-08')).toBeNull()
  })

  it('cruzamento de ano com compra parcelada (ex.: 11/12 em novembro)', () => {
    const rolled = purchase({ reference_month: '2026-11', current_installment: 11, installments: 12 })
    expect(getPurchaseOccurrenceForMonth(rolled, '2026-12')!.installmentLabel).toBe('12/12')
    expect(getPurchaseOccurrenceForMonth(rolled, '2027-01')).toBeNull()
  })
})

describe('getPurchasesForMonth (ordem da lista)', () => {
  it('ordena parcelas do mesmo mês em ordem crescente de número da parcela (regressão: a ordem antiga vinha do banco)', () => {
    // Duas parcelas em 2026-09: a 5ª de uma compra de 2026-05 e a 1ª de outra.
    const older = purchase({
      id: 'p-a',
      description: 'Notebook',
      amount: 500,
      purchase_date: '2026-05-02',
      installments: 10,
      current_installment: 5,
      reference_month: '2026-09'
    })
    const newer = purchase({
      id: 'p-b',
      description: 'Sofá',
      amount: 200,
      purchase_date: '2026-09-01',
      installments: 4,
      current_installment: 1,
      reference_month: '2026-09'
    })

    const list = getPurchasesForMonth([newer, older], '2026-09')
    expect(list.map(p => p.id)).toEqual(['p-b', 'p-a']) // 1/4 antes de 5/10
    expect(list.map(p => p.installmentLabel)).toEqual(['1/4', '5/10'])
  })

  it('à vista antes de recorrente antes de parcelado; empate pela data mais recente', () => {
    const installment = purchase({ id: 'p-i', type: 'installment', purchase_date: '2026-09-01' })
    const recurring = purchase({ id: 'p-r', type: 'recurring', installments: 1, current_installment: 1, purchase_date: '2026-09-01' })
    const cash = purchase({ id: 'p-c', type: 'cash', installments: 1, current_installment: 1, purchase_date: '2026-09-01' })
    const cashOlder = purchase({ id: 'p-c2', type: 'cash', purchase_date: '2026-09-02', installments: 1, current_installment: 1 })

    const list = getPurchasesForMonth([installment, recurring, cash, cashOlder], '2026-09')
    expect(list.map(p => p.id)).toEqual(['p-c2', 'p-c', 'p-r', 'p-i'])
  })

  it('exclui parcelas concluídas e compras fora do mês', () => {
    const done = purchase({ id: 'p-done', reference_month: '2026-09', current_installment: 13, installments: 12 })
    const future = purchase({ id: 'p-future', reference_month: '2026-12', current_installment: 1, installments: 3 })
    const active = purchase({ id: 'p-active', reference_month: '2026-09', current_installment: 1, installments: 3 })

    const list = getPurchasesForMonth([done, future, active], '2026-09')
    expect(list.map(p => p.id)).toEqual(['p-active'])
  })
})

describe('getMonthTotals (gráfico de 12 meses)', () => {
  it('soma a parcela correta em cada mês após o roll-forward (regressão: o gráfico antigo deslocava as parcelas)', () => {
    // Compra 10x de R$ 1000 (parcela de R$ 100), começou em 2026-04 e já
    // avançou até a 6ª parcela em 2026-09. De 2026-04 a 2027-01, R$ 100/mês.
    const rolled = purchase({
      amount: 1000,
      installments: 10,
      current_installment: 6,
      reference_month: '2026-09'
    })
    // À vista de R$ 50 só em 2026-09.
    const cash = purchase({ type: 'cash', installments: 1, current_installment: 1, amount: 50, reference_month: '2026-09' })

    const months = ['2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03']
    const totals = getMonthTotals([rolled, cash], months)

    expect(totals[0].total).toBeCloseTo(150) // 100 + 50
    expect(totals[1].total).toBeCloseTo(100)
    expect(totals[2].total).toBeCloseTo(100)
    expect(totals[3].total).toBeCloseTo(100)
    expect(totals[4].total).toBeCloseTo(100) // 10ª e última parcela (2027-01)
    expect(totals[5].total).toBeCloseTo(0)   // concluída
    expect(totals[6].total).toBeCloseTo(0)
  })

  it('mantém a ordem dos meses informados', () => {
    const months = ['2026-10', '2026-09']
    const totals = getMonthTotals([], months)
    expect(totals.map(t => t.month)).toEqual(months)
    expect(totals.every(t => t.total === 0)).toBe(true)
  })
})

describe('isInvoiceMonthPaid', () => {
  it('mês anterior ao reference_month do cartão está pago', () => {
    const card = { reference_month: '2026-09' }
    expect(isInvoiceMonthPaid(card, '2026-08')).toBe(true)
    expect(isInvoiceMonthPaid(card, '2026-03')).toBe(true)
    expect(isInvoiceMonthPaid(card, '2025-12')).toBe(true)
  })

  it('mês de referência atual e futuros não estão pagos', () => {
    const card = { reference_month: '2026-09' }
    expect(isInvoiceMonthPaid(card, '2026-09')).toBe(false)
    expect(isInvoiceMonthPaid(card, '2026-10')).toBe(false)
    expect(isInvoiceMonthPaid(card, '2027-01')).toBe(false)
  })

  it('cartão sem reference_month não marca nada como pago', () => {
    expect(isInvoiceMonthPaid({}, '2026-09')).toBe(false)
    expect(isInvoiceMonthPaid({ reference_month: null }, '2026-09')).toBe(false)
  })

  it('cruzamento de ano: dezembro pago quando o cartão já está em janeiro', () => {
    const card = { reference_month: '2027-01' }
    expect(isInvoiceMonthPaid(card, '2026-12')).toBe(true)
    expect(isInvoiceMonthPaid(card, '2026-11')).toBe(true)
    expect(isInvoiceMonthPaid(card, '2027-01')).toBe(false)
  })
})
