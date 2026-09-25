import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/shared/page-header';
import { MonthPicker } from '../components/shared/month-picker';
import { useBills } from '../hooks/use-bills';
import { useCreditCards } from '../hooks/use-credit-cards';
import { useCurrencyInput } from '../hooks/use-currency-input';
import { formatCurrency } from '../lib/utils';
import { useCashFlowStore, type CashFlowEntryInput } from '../store/cash-flow-store';
import type { CashFlowEntry, CashFlowEntryType } from '../types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
type CashFlowListEntry = CashFlowEntry & { projected?: boolean; sourceId?: string; sourceDate?: string };

export default function CashFlow() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(localDate(new Date()));
  const [type, setType] = useState<CashFlowEntryType>('income');
  const [isRecurring, setIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);
  const amount = useCurrencyInput();
  const entries = useCashFlowStore(state => state.entries);
  const loading = useCashFlowStore(state => state.loading);
  const error = useCashFlowStore(state => state.error);
  const fetchEntries = useCashFlowStore(state => state.fetch);
  const addEntry = useCashFlowStore(state => state.add);
  const updateEntry = useCashFlowStore(state => state.update);
  const removeEntry = useCashFlowStore(state => state.remove);
  const { bills, loading: billsLoading, error: billsError } = useBills(month);
  const { creditCards, loading: cardsLoading, error: cardsError } = useCreditCards();

  useEffect(() => { fetchEntries(month); }, [month, fetchEntries]);

  const monthEntries = useMemo<CashFlowListEntry[]>(() => {
    const actual = entries.filter(entry => entry.entry_date.startsWith(month));
    const [year, monthNumber] = month.split('-').map(Number);
    const finalDay = new Date(year, monthNumber, 0).getDate();
    const projected = entries
      .filter(entry => entry.is_recurring && entry.entry_date.slice(0, 7) < month)
      .map(entry => ({
        ...entry,
        id: `recurring-${entry.id}-${month}`,
        sourceId: entry.id,
        sourceDate: entry.entry_date,
        entry_date: `${month}-${String(Math.min(Number(entry.entry_date.slice(-2)), finalDay)).padStart(2, '0')}`,
        projected: true,
      }));
    return [...actual, ...projected].sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  }, [entries, month]);

  const { billCents, invoiceCents } = useMemo(() => {
    const monthlyBills = bills.filter(bill => bill.reference_month === month);
    const existingRecurring = new Set(monthlyBills.map(bill => `${bill.category_id}-${bill.amount}`));
    const projectedRecurring = new Set<string>();
    const recurringCents = bills
      .filter(bill => bill.is_recurring && bill.reference_month < month)
      .reduce((total, bill) => {
        const key = `${bill.category_id}-${bill.amount}`;
        if (existingRecurring.has(key) || projectedRecurring.has(key)) return total;
        projectedRecurring.add(key);
        return total + Math.round(bill.amount * 100);
      }, 0);
    const actualCents = monthlyBills.reduce((total, bill) => total + Math.round(bill.amount * 100), 0);
    const cardsCents = creditCards
      .filter(card => card.reference_month === month)
      .reduce((total, card) => total + Math.round(card.invoice_amount * 100), 0);
    return { billCents: actualCents + recurringCents, invoiceCents: cardsCents };
  }, [bills, creditCards, month]);

  const totals = monthEntries.reduce((sum, entry) => {
    const cents = Math.round(entry.amount * 100);
    if (entry.type === 'income') sum.income += cents;
    else sum.expenses += cents;
    return sum;
  }, { income: 0, expenses: 0 });
  const commitmentsCents = billCents + invoiceCents;
  const remainderCents = totals.income - totals.expenses - commitmentsCents;
  const hasError = error || billsError || cardsError;
  const isLoading = loading || billsLoading || cardsLoading;

  const openAdd = () => {
    setEditing(null);
    setDescription('');
    setDate(month === format(new Date(), 'yyyy-MM') ? localDate(new Date()) : `${month}-01`);
    setType('income');
    setIsRecurring(false);
    amount.reset(0);
    setDialogOpen(true);
  };

  const openEdit = (entry: CashFlowListEntry) => {
    setEditing(entry.sourceId ?? entry.id);
    setDescription(entry.description);
    setDate(entry.sourceDate ?? entry.entry_date);
    setType(entry.type);
    setIsRecurring(entry.is_recurring);
    amount.reset(entry.amount);
    setDialogOpen(true);
  };

  const saveEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!description.trim() || !date || amount.cents <= 0) {
      toast.error('Informe descrição, data e um valor maior que zero.');
      return;
    }
    const input: CashFlowEntryInput = { description: description.trim(), entry_date: date, type, amount: amount.cents / 100, is_recurring: isRecurring };
    setSaving(true);
    try {
      if (editing) {
        await updateEntry(editing, input);
        toast.success('Lançamento atualizado.');
      } else {
        await addEntry(input);
        toast.success('Lançamento adicionado.');
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar o lançamento.');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await removeEntry(id);
      toast.success('Lançamento removido.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover o lançamento.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fluxo de caixa"
        description="Registre entradas e gastos do dia a dia e veja o resultado estimado do mês."
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button onClick={openAdd}><Plus aria-hidden="true" />Novo lançamento</Button>} />
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[440px]">
              <DialogHeader><DialogTitle>{editing ? isRecurring ? 'Editar série recorrente' : 'Editar lançamento' : 'Novo lançamento'}</DialogTitle></DialogHeader>
              <form onSubmit={saveEntry} className="space-y-4">
                <label className="block space-y-1.5 text-sm font-medium">Tipo
                  <select className="h-9 w-full rounded-lg border border-input bg-field px-3 font-normal" value={type} onChange={event => setType(event.target.value as CashFlowEntryType)}>
                    <option value="income">Entrada</option>
                    <option value="expense">Gasto do dia a dia</option>
                  </select>
                </label>
                <label className="block space-y-1.5 text-sm font-medium">Descrição
                  <Input required maxLength={120} value={description} onChange={event => setDescription(event.target.value)} placeholder="Ex.: salário, mercado, transporte" />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isRecurring} onChange={event => setIsRecurring(event.target.checked)} className="h-4 w-4 accent-primary" />
                  Repetir todos os meses
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1.5 text-sm font-medium">Valor
                    <Input required inputMode="numeric" value={amount.displayValue} onChange={event => amount.handleChange(event, () => {})} aria-label="Valor em reais" />
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium">{isRecurring ? 'Início' : 'Data'}
                    <Input required type="date" value={date} onChange={event => setDate(event.target.value)} />
                  </label>
                </div>
                {isRecurring && <p className="text-xs text-muted-foreground">O lançamento será projetado mensalmente. Alterar ou excluir esta série afeta todos os meses, inclusive o histórico.</p>}
                <p className="text-xs text-muted-foreground">Contas e faturas cadastradas entram automaticamente no resultado. Não as registre novamente como gastos.</p>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
                  <Button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex w-full max-w-xs items-center gap-3">
        <span className="shrink-0 text-sm font-medium">Mês</span>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : hasError ? (
        <p role="alert" className="text-sm text-destructive">Não foi possível carregar o fluxo de caixa: {hasError}</p>
      ) : (
        <>
          <section aria-label="Resumo do mês" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Entradas', totals.income, 'text-success'],
              ['Gastos do dia a dia', totals.expenses, 'text-destructive'],
              ['Contas e faturas', commitmentsCents, 'text-foreground'],
              ['Resultado estimado', remainderCents, remainderCents < 0 ? 'text-destructive' : 'text-success'],
            ].map(([label, cents, color]) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`mt-2 text-xl font-semibold tabular-nums ${color}`}>{formatCurrency(Number(cents) / 100)}</p>
                {label === 'Resultado estimado' && <p className="mt-1 text-xs text-muted-foreground">Entradas menos gastos, contas e faturas.</p>}
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
              <h2 className="text-lg font-semibold">Lançamentos do mês</h2>
              <span className="text-sm text-muted-foreground">{monthEntries.length} {monthEntries.length === 1 ? 'lançamento' : 'lançamentos'}</span>
            </div>
            {monthEntries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <Wallet className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 font-medium">Nenhum lançamento neste mês</p>
                <p className="mt-1 text-sm text-muted-foreground">Adicione uma entrada ou um gasto do dia a dia para começar.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border bg-card px-4">
                {monthEntries.map(entry => (
                  <li key={entry.id} className="flex items-center gap-3 py-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${entry.type === 'income' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {entry.type === 'income' ? <ArrowDownLeft className="h-4 w-4" aria-hidden="true" /> : <ArrowUpRight className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.description}{entry.is_recurring && <span className="ml-2 text-xs font-normal text-muted-foreground">Recorrente</span>}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(entry.entry_date), 'dd/MM/yyyy', { locale: ptBR })} · {entry.type === 'income' ? 'Entrada' : 'Gasto'}</p>
                    </div>
                    <span className={`whitespace-nowrap text-sm font-semibold tabular-nums ${entry.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                      {entry.type === 'income' ? '+' : '−'}{formatCurrency(entry.amount)}
                    </span>
                    <Button type="button" variant="ghost" size="icon" aria-label={`Editar ${entry.description}`} onClick={() => openEdit(entry)}><Pencil aria-hidden="true" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button type="button" variant="ghost" size="icon" aria-label={`Excluir ${entry.description}`}><Trash2 aria-hidden="true" /></Button>} />
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>{entry.is_recurring ? 'Excluir série recorrente?' : 'Excluir lançamento?'}</AlertDialogTitle><AlertDialogDescription>{entry.is_recurring ? `“${entry.description}” será removido de todos os meses, inclusive do histórico.` : `“${entry.description}” será removido do fluxo de caixa.`}</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteEntry(entry.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
