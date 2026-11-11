import { zipSync } from 'fflate';
import { format, parseISO } from 'date-fns';
import type { TransactionWithDependent } from '@/types';
import { getTransactionPaidCents, getTransactionRemainingCents } from '@/lib/utils';
import type { FinanceExportData } from '@/lib/finance-export-data';

type Cell = string | number | null;

interface Sheet {
  name: string;
  headers: string[];
  rows: Cell[][];
  widths: number[];
  moneyColumns?: number[];
}

const escapeXml = (text: string) => text.replace(/[<>&"']/g, char => ({
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
  "'": '&apos;',
}[char]!));

const columnName = (index: number) => {
  let name = '';
  for (let number = index + 1; number > 0; number = Math.floor((number - 1) / 26)) {
    name = String.fromCharCode(65 + (number - 1) % 26) + name;
  }
  return name;
};

function worksheetXml(sheet: Sheet) {
  const rowCount = sheet.rows.length + 1;
  const lastColumn = columnName(sheet.headers.length - 1);
  const rowXml = [sheet.headers, ...sheet.rows].map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const reference = `${columnName(columnIndex)}${rowIndex + 1}`;
      const style = rowIndex === 0 ? ' s="1"' : sheet.moneyColumns?.includes(columnIndex) ? ' s="2"' : '';
      if (typeof value === 'number') return `<c r="${reference}"${style}><v>${value}</v></c>`;
      if (value === null || value === '') return `<c r="${reference}"${style}/>`;
      return `<c r="${reference}" t="inlineStr"${style}><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
    }).join('');
    return `<row r="${rowIndex + 1}"${rowIndex === 0 ? ' ht="24" customHeight="1"' : ''}>${cells}</row>`;
  }).join('');
  const columns = sheet.widths.map((width, index) =>
    `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`
  ).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${lastColumn}${rowCount}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols>${columns}</cols><sheetData>${rowXml}</sheetData><autoFilter ref="A1:${lastColumn}${rowCount}"/></worksheet>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;R$&quot; #,##0.00;[Red]-&quot;R$&quot; #,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FF302000"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF59E0B"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFE5E7EB"/></left><right style="thin"><color rgb="FFE5E7EB"/></right><top style="thin"><color rgb="FFE5E7EB"/></top><bottom style="thin"><color rgb="FFE5E7EB"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
}

function sheetForType(name: string, transactions: TransactionWithDependent[]): Sheet {
  return {
    name,
    headers: ['Data', 'Descrição', 'Dependente', 'Pagamento', 'Parcelas', 'Status', 'Valor total', 'Valor pago', 'Valor restante', 'Data de quitação', 'Observações'],
    widths: [14, 34, 24, 16, 12, 14, 18, 18, 18, 18, 36],
    moneyColumns: [6, 7, 8],
    rows: transactions.map(transaction => [
      format(parseISO(transaction.transaction_date), 'dd/MM/yyyy'),
      transaction.description,
      transaction.dependents?.name ?? '',
      transaction.payment_type === 'installment' ? 'Parcelado' : 'À vista',
      transaction.payment_type === 'installment' ? transaction.installments : null,
      transaction.status === 'paid' ? 'Pago' : 'Pendente',
      Math.round(transaction.amount * 100) / 100,
      getTransactionPaidCents(transaction) / 100,
      getTransactionRemainingCents(transaction) / 100,
      transaction.settled_date ? format(parseISO(transaction.settled_date), 'dd/MM/yyyy') : '',
      transaction.notes ?? '',
    ]),
  };
}

const dateValue = (value: string | null) => value ? format(parseISO(value), 'dd/MM/yyyy') : '';
const namesFromLinks = (links: { dependents?: { name: string } | null }[] = []) =>
  links.map(link => link.dependents?.name).filter(Boolean).join(', ');

export function createTransactionWorkbook(
  transactions: TransactionWithDependent[],
  data: FinanceExportData,
) {
  const payable = transactions.filter(transaction => transaction.type === 'to_pay');
  const receivable = transactions.filter(transaction => transaction.type === 'to_receive');
  const sumCents = (items: TransactionWithDependent[], value: (item: TransactionWithDependent) => number) =>
    items.reduce((total, item) => total + value(item), 0);
  const summary: Sheet = {
    name: 'Resumo',
    headers: ['Indicador', 'Quantidade', 'Valor (R$)'],
    widths: [32, 16, 20],
    moneyColumns: [2],
    rows: [
      ['A pagar', payable.length, null],
      ['Valor total a pagar', null, sumCents(payable, item => Math.round(item.amount * 100)) / 100],
      ['Valor pago', null, sumCents(payable, getTransactionPaidCents) / 100],
      ['Valor restante', null, sumCents(payable, getTransactionRemainingCents) / 100],
      ['A receber', receivable.length, null],
      ['Valor total a receber', null, sumCents(receivable, item => Math.round(item.amount * 100)) / 100],
      ['Valor recebido', null, sumCents(receivable, getTransactionPaidCents) / 100],
      ['Valor a receber restante', null, sumCents(receivable, getTransactionRemainingCents) / 100],
    ],
  };
  const bills: Sheet = {
    name: 'Contas',
    headers: ['Categoria', 'Vencimento', 'Mês de referência', 'Recorrente', 'Status', 'Valor', 'Data de pagamento', 'Dependentes', 'Observações'],
    widths: [24, 16, 20, 14, 14, 18, 20, 30, 36],
    moneyColumns: [5],
    rows: data.bills.map(bill => [
      bill.bill_categories?.name ?? '', dateValue(bill.due_date), bill.reference_month,
      bill.is_recurring ? 'Sim' : 'Não', bill.status === 'paid' ? 'Paga' : 'Pendente',
      Number(bill.amount), dateValue(bill.paid_date), namesFromLinks(bill.bill_dependents), bill.notes ?? '',
    ]),
  };
  const cards: Sheet = {
    name: 'Cartões',
    headers: ['Cartão', 'Mês da fatura', 'Vencimento', 'Fechamento (dia)', 'Valor da fatura', 'Status', 'Data de pagamento', 'Dependentes', 'Observações'],
    widths: [24, 20, 16, 20, 20, 14, 20, 30, 36],
    moneyColumns: [4],
    rows: data.cards.map(card => [
      card.name, card.reference_month, dateValue(card.due_date), Number(card.closing_day), Number(card.invoice_amount),
      card.status === 'paid' ? 'Paga' : card.status === 'closed' ? 'Fechada' : 'Aberta',
      dateValue(card.paid_date), namesFromLinks(card.credit_card_dependents), card.notes ?? '',
    ]),
  };
  const purchases: Sheet = {
    name: 'Compras cartão',
    headers: ['Cartão', 'Data da compra', 'Mês da fatura', 'Descrição', 'Tipo', 'Parcela atual', 'Total de parcelas', 'Valor', 'Dependentes', 'Observações'],
    widths: [24, 16, 20, 34, 18, 16, 20, 18, 30, 36],
    moneyColumns: [7],
    rows: data.purchases.map(purchase => [
      purchase.credit_cards?.name ?? '', dateValue(purchase.purchase_date), purchase.reference_month,
      purchase.description, purchase.type === 'installment' ? 'Parcelada' : purchase.type === 'recurring' ? 'Recorrente' : 'À vista',
      purchase.type === 'installment' ? Number(purchase.current_installment) : null,
      purchase.type === 'installment' ? Number(purchase.installments) : null,
      Number(purchase.amount), namesFromLinks(purchase.card_purchase_dependents), purchase.notes ?? '',
    ]),
  };
  const cashFlow: Sheet = {
    name: 'Fluxo de caixa',
    headers: ['Data', 'Descrição', 'Tipo', 'Recorrente', 'Recorrência', 'Valor'],
    widths: [16, 36, 18, 14, 18, 18],
    moneyColumns: [5],
    rows: data.cashFlow.map(entry => [
      dateValue(entry.entry_date), entry.description, entry.type === 'income' ? 'Entrada' : 'Saída',
      entry.is_recurring ? 'Sim' : 'Não', entry.recurrence === 'weekly' ? 'Semanal' : entry.recurrence === 'monthly' ? 'Mensal' : '',
      Number(entry.amount),
    ]),
  };
  const reserveBalance = data.contributions.reduce((total, contribution) =>
    total + (contribution.type === 'deposit' ? Number(contribution.amount) : -Number(contribution.amount)), 0);
  const emergencyFund: Sheet = {
    name: 'Reserva',
    headers: ['Indicador', 'Data', 'Valor', 'Observações'],
    widths: [28, 18, 20, 40],
    moneyColumns: [2],
    rows: data.emergencyGoal ? [
      ['Meta', dateValue(data.emergencyGoal.target_date), Number(data.emergencyGoal.target_amount), data.emergencyGoal.name],
      ['Saldo atual', '', reserveBalance, 'Calculado pelas contribuições e retiradas exportadas'],
      ['Observações da meta', '', null, data.emergencyGoal.notes ?? ''],
    ] : [['Meta não configurada', '', null, '']],
  };
  const contributions: Sheet = {
    name: 'Movimentos reserva',
    headers: ['Data', 'Tipo', 'Valor', 'Observações'],
    widths: [18, 18, 20, 40],
    moneyColumns: [2],
    rows: data.contributions.map(contribution => [
      dateValue(contribution.contribution_date), contribution.type === 'deposit' ? 'Depósito' : 'Retirada',
      Number(contribution.amount), contribution.notes ?? '',
    ]),
  };
  const sheets = [
    summary,
    sheetForType('A pagar', payable),
    sheetForType('A receber', receivable),
    bills,
    cards,
    purchases,
    cashFlow,
    emergencyFund,
    contributions,
  ];
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`),
    '_rels/.rels': new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    'xl/workbook.xml': new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sheet, index) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('')}</sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    'xl/styles.xml': new TextEncoder().encode(stylesXml()),
  };
  sheets.forEach((sheet, index) => {
    files[`xl/worksheets/sheet${index + 1}.xml`] = new TextEncoder().encode(worksheetXml(sheet));
  });
  return zipSync(files, { level: 6 });
}
