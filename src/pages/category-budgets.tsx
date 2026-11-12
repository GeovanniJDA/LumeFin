import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MonthPicker } from '../components/shared/month-picker';
import { PageHeader } from '../components/shared/page-header';
import { useBills } from '../hooks/use-bills';
import { useCategories } from '../hooks/use-categories';
import { calculateCategoryBudgets } from '../lib/category-budgets';
import { formatCurrency } from '../lib/utils';
import { useCategoryBudgetStore } from '../store/category-budget-store';
import { format } from 'date-fns';

export default function CategoryBudgets() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { bills, loading: billsLoading, error: billsError } = useBills(month);
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const budgets = useCategoryBudgetStore(state => state.records);
  const loading = useCategoryBudgetStore(state => state.loading);
  const error = useCategoryBudgetStore(state => state.error);
  const fetchBudgets = useCategoryBudgetStore(state => state.fetch);
  const saveBudget = useCategoryBudgetStore(state => state.save);
  const removeBudget = useCategoryBudgetStore(state => state.remove);

  useEffect(() => { void fetchBudgets(month); }, [fetchBudgets, month]);

  const rows = useMemo(
    () => calculateCategoryBudgets(budgets.filter(budget => budget.reference_month === month), bills, categories, month),
    [budgets, bills, categories, month],
  );
  const availableCategories = categories.filter(category => !budgets.some(budget => budget.reference_month === month && budget.category_id === category.id));
  const isLoading = loading || billsLoading || categoriesLoading;
  const pageError = error || billsError || categoriesError;

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(limit.replace(',', '.'));
    if (!categoryId || !Number.isFinite(amount) || amount <= 0) {
      toast.error('Selecione uma categoria e informe um limite maior que zero.');
      return;
    }

    setSaving(true);
    try {
      await saveBudget(categoryId, month, amount);
      setCategoryId('');
      setLimit('');
      setEditingBudgetId(null);
      toast.success('Limite mensal salvo.');
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o limite.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeBudget(id);
      if (editingBudgetId === id) {
        setEditingBudgetId(null);
        setCategoryId('');
        setLimit('');
      }
      toast.success('Limite removido.');
    } catch (removeError) {
      toast.error(removeError instanceof Error ? removeError.message : 'Não foi possível remover o limite.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Orçamento por categoria"
        description="Defina limites mensais e acompanhe as contas registradas em cada categoria."
      />

      <div className="mb-5 flex flex-col gap-2 sm:ml-auto sm:max-w-xs">
        <span className="text-sm font-medium">Mês do orçamento</span>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      <form onSubmit={handleSave} className="mb-6 rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Definir limite</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="budget-category">Categoria</label>
            <Select value={categoryId || undefined} disabled={editingBudgetId !== null} onValueChange={value => setCategoryId(value ?? '')}>
              <SelectTrigger id="budget-category" className="w-full">
                <SelectValue placeholder="Selecione uma categoria">
                  {categories.find(category => category.id === categoryId)?.name ?? 'Selecione uma categoria'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="budget-limit">Limite mensal (R$)</label>
            <Input
              id="budget-limit"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={limit}
              onChange={event => setLimit(event.target.value)}
              placeholder="Ex.: 800,00"
              required
            />
          </div>
          <Button type="submit" disabled={saving || !categoryId || !limit}>
            {editingBudgetId ? <Check className="mr-2 h-4 w-4" aria-hidden="true" /> : <Plus className="mr-2 h-4 w-4" aria-hidden="true" />}
            {saving ? 'Salvando…' : editingBudgetId ? 'Salvar limite' : 'Adicionar limite'}
          </Button>
        </div>
        {editingBudgetId && (
          <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => { setEditingBudgetId(null); setCategoryId(''); setLimit(''); }}>
            Cancelar edição
          </Button>
        )}
        {availableCategories.length === 0 && !categoriesLoading && !editingBudgetId && (
          <p className="mt-3 text-sm text-muted-foreground">Todas as categorias já têm limite neste mês.</p>
        )}
      </form>

      {pageError && (
        <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Não foi possível carregar os dados do orçamento: {pageError}
        </p>
      )}

      {isLoading ? (
        <div role="status" className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Carregando orçamentos…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="font-medium">Nenhum limite definido para este mês</p>
          <p className="mt-1 text-sm text-muted-foreground">Adicione limites para acompanhar os gastos por categoria.</p>
        </div>
      ) : (
        <section aria-label="Progresso dos orçamentos" className="grid gap-3 md:grid-cols-2">
          {rows.map(row => {
            const barColor = row.alertLevel === 'exceeded' ? 'bg-destructive' : row.alertLevel === 'near' ? 'bg-amber-500' : 'bg-primary';
            const statusText = row.alertLevel === 'exceeded'
              ? `Limite excedido em ${formatCurrency((row.spentCents - row.limitCents) / 100)}`
              : row.alertLevel === 'near' ? 'Atenção: perto do limite' : 'Dentro do limite';
            return (
              <article key={row.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{row.categoryName}</h3>
                    <p className={`mt-1 flex items-center gap-1.5 text-xs ${row.alertLevel === 'safe' ? 'text-muted-foreground' : row.alertLevel === 'near' ? 'text-amber-700 dark:text-amber-400' : 'text-destructive'}`}>
                      {row.alertLevel === 'safe' ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
                      {statusText}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar limite de ${row.categoryName}`}
                      onClick={() => { setEditingBudgetId(row.id); setCategoryId(row.category_id); setLimit((row.limitCents / 100).toFixed(2)); }}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" aria-label={`Remover limite de ${row.categoryName}`} onClick={() => void handleRemove(row.id)}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-semibold tabular-nums">{formatCurrency(row.spentCents / 100)}</span>
                  <span className="text-muted-foreground">de {formatCurrency(row.limitCents / 100)}</span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`Gasto em ${row.categoryName}`}
                  aria-valuemin={0}
                  aria-valuemax={row.limitCents}
                  aria-valuenow={Math.min(row.spentCents, row.limitCents)}
                  className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(row.percentage, 100)}%` }} />
                </div>
                <p className="mt-2 text-right text-xs text-muted-foreground">{Math.round(row.percentage)}% do limite</p>
              </article>
            );
          })}
        </section>
      )}

      <p className="mt-5 text-xs text-muted-foreground">
        O gasto considera contas do mês pagas ou pendentes e projeta recorrências ainda não lançadas. Compras de cartão não são incluídas porque ainda não têm categoria.
      </p>
    </div>
  );
}
