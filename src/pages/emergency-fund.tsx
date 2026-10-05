import { useMemo, useState } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  PiggyBank,
  Plus,
  Pencil,
  Trash2,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar as CalendarIcon,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '../components/shared/page-header';
import { SummaryCard } from '../components/shared/summary-card';
import { DatePicker } from '../components/shared/date-picker';
import { EmptyState } from '../components/shared/empty-state';
import { useEmergencyFund } from '../hooks/use-emergency-fund';
import { useCurrencyInput } from '../hooks/use-currency-input';
import { useBills } from '../hooks/use-bills';
import { useCreditCards } from '../hooks/use-credit-cards';
import { formatCurrency } from '../lib/utils';
import type { EmergencyFundContribution, EmergencyFundContributionType } from '../types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

const localDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function EmergencyFund() {
  const {
    goal,
    contributions,
    summary,
    milestone,
    loading,
    error,
    saveGoal,
    addContribution,
    updateContribution,
    removeContribution,
  } = useEmergencyFund();

  // For smart suggestions:
  const currentMonth = useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const { bills } = useBills(currentMonth);
  const { creditCards } = useCreditCards();

  // Dialogs state
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [contribModalOpen, setContribModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingContribId, setEditingContribId] = useState<string | null>(null);

  // Filter state for contributions
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal'>('all');

  // Goal Form State
  const [goalName, setGoalName] = useState('Reserva de Emergência');
  const [goalTargetDate, setGoalTargetDate] = useState<string | null>(null);
  const [goalNotes, setGoalNotes] = useState('');
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const targetAmountInput = useCurrencyInput(5000);

  // Contribution Form State
  const [contribType, setContribType] = useState<EmergencyFundContributionType>('deposit');
  const [contribDate, setContribDate] = useState(localDate(new Date()));
  const [contribNotes, setContribNotes] = useState('');
  const [isSavingContrib, setIsSavingContrib] = useState(false);
  const contribAmountInput = useCurrencyInput(50);

  // Calculate monthly essential expenses for suggestions
  const monthlyExpenses = useMemo(() => {
    const monthlyBillsCents = bills
      .filter((b) => b.reference_month === currentMonth)
      .reduce((sum, b) => sum + Math.round(b.amount * 100), 0);
    const monthlyCardsCents = creditCards
      .filter((c) => c.reference_month === currentMonth)
      .reduce((sum, c) => sum + Math.round(c.invoice_amount * 100), 0);
    return (monthlyBillsCents + monthlyCardsCents) / 100;
  }, [bills, creditCards, currentMonth]);

  const handleOpenGoalModal = () => {
    if (goal) {
      setGoalName(goal.name);
      targetAmountInput.reset(goal.target_amount);
      setGoalTargetDate(goal.target_date);
      setGoalNotes(goal.notes || '');
    } else {
      setGoalName('Reserva de Emergência');
      targetAmountInput.reset(5000);
      setGoalTargetDate(null);
      setGoalNotes('');
    }
    setGoalModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = targetAmountInput.cents / 100;
    if (val <= 0) {
      toast.error('Informe um valor-alvo válido para a reserva.');
      return;
    }

    setIsSavingGoal(true);
    try {
      await saveGoal({
        name: goalName,
        target_amount: val,
        target_date: goalTargetDate,
        notes: goalNotes,
      });
      toast.success('Meta da reserva atualizada com sucesso!');
      setGoalModalOpen(false);
    } catch {
      toast.error('Erro ao salvar meta.');
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleOpenNewContrib = (initialAmount = 50, type: EmergencyFundContributionType = 'deposit') => {
    setEditingContribId(null);
    setContribType(type);
    contribAmountInput.reset(initialAmount);
    setContribDate(localDate(new Date()));
    setContribNotes('');
    setContribModalOpen(true);
  };

  const handleOpenEditContrib = (c: EmergencyFundContribution) => {
    setEditingContribId(c.id);
    setContribType(c.type);
    contribAmountInput.reset(c.amount);
    setContribDate(c.contribution_date);
    setContribNotes(c.notes || '');
    setContribModalOpen(true);
  };

  const handleSaveContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = contribAmountInput.cents / 100;
    if (val <= 0) {
      toast.error('Informe um valor maior que zero.');
      return;
    }
    if (!contribDate) {
      toast.error('Selecione a data da movimentação.');
      return;
    }

    setIsSavingContrib(true);
    try {
      if (editingContribId) {
        await updateContribution(editingContribId, {
          amount: val,
          type: contribType,
          contribution_date: contribDate,
          notes: contribNotes,
        });
        toast.success('Movimentação atualizada com sucesso!');
      } else {
        await addContribution({
          amount: val,
          type: contribType,
          contribution_date: contribDate,
          notes: contribNotes,
        });
        toast.success(
          contribType === 'deposit'
            ? `Aporte de ${formatCurrency(val)} guardado com sucesso!`
            : `Resgate de ${formatCurrency(val)} registrado!`
        );
      }
      setContribModalOpen(false);
    } catch {
      toast.error('Erro ao registrar movimentação.');
    } finally {
      setIsSavingContrib(false);
    }
  };

  const handleDeleteContribution = async () => {
    if (!deleteConfirmId) return;
    try {
      await removeContribution(deleteConfirmId);
      toast.success('Movimentação removida.');
    } catch {
      toast.error('Erro ao remover movimentação.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const quickAmounts = [10, 20, 50, 100, 200];

  const filteredContributions = useMemo(() => {
    if (filterType === 'all') return contributions;
    return contributions.filter((c) => c.type === filterType);
  }, [contributions, filterType]);

  const daysToTargetDate = useMemo(() => {
    if (!goal?.target_date) return null;
    const diff = differenceInDays(parseISO(goal.target_date), new Date());
    return diff;
  }, [goal]);

  if (loading && !goal && contributions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reserva de Emergência" description="Carregando dados da sua meta..." />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={goal?.name || 'Reserva de Emergência'}
          description="Acompanhe sua meta e fortaleça sua segurança financeira com pequenos aportes recorrentes."
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleOpenGoalModal}
            className="gap-2 shrink-0 border-border bg-card hover:bg-accent"
          >
            <Target className="h-4 w-4 text-primary" />
            Configurar Meta
          </Button>
          <Button
            onClick={() => handleOpenNewContrib(50, 'deposit')}
            className="gap-2 shrink-0 bg-primary font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Novo Aporte
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Hero Progress Card */}
      <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <PiggyBank className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Acumulado
              </span>
              {summary.progressPercentage >= 100 && (
                <Badge variant="default" className="bg-emerald-600 text-white gap-1 hover:bg-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Meta Atingida
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-quicksand text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                {formatCurrency(summary.currentAmount)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                de {formatCurrency(summary.targetAmount || 5000)}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1 text-sm">
              <span className={`font-semibold ${milestone.color}`}>{milestone.title}</span>
              <span className="text-muted-foreground">• {milestone.description}</span>
            </div>
          </div>

          {/* Quick stats on right side of hero */}
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-2 sm:gap-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
            <div>
              <span className="text-xs text-muted-foreground">Falta para a meta</span>
              <p className="font-quicksand text-lg font-bold text-foreground">
                {summary.remainingAmount > 0 ? formatCurrency(summary.remainingAmount) : 'Meta Concluída!'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Prazo estipulado</span>
              <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                {goal?.target_date ? (
                  <>
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{format(parseISO(goal.target_date), 'dd/MM/yyyy')}</span>
                    {daysToTargetDate !== null && (
                      <span className="text-xs text-muted-foreground">
                        ({daysToTargetDate > 0 ? `${daysToTargetDate} dias` : 'Prazo vencido'})
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground">Sem prazo fixado</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-bold text-primary">{summary.progressPercentage}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-secondary/80">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                summary.progressPercentage >= 100
                  ? 'bg-emerald-500'
                  : 'bg-primary'
              }`}
              style={{ width: `${Math.min(summary.progressPercentage, 100)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Quick Micro-Contributions Section */}
      <Card className="border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Aporte rápido de pequenas quantias</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Economizou um troco ou sobrou um dinheiro hoje? Guarde agora com um clique:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {quickAmounts.map((amt) => (
              <Button
                key={amt}
                size="sm"
                variant="outline"
                onClick={() => handleOpenNewContrib(amt, 'deposit')}
                className="h-8 border-border bg-secondary/50 font-medium hover:border-primary hover:bg-primary/10 hover:text-primary transition-all"
              >
                + R$ {amt}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenNewContrib(50, 'withdrawal')}
              className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <ArrowDownLeft className="mr-1 h-3.5 w-3.5" />
              Resgatar
            </Button>
          </div>
        </div>
      </Card>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <SummaryCard
          title="Guardado no mês"
          value={formatCurrency(summary.monthTotal)}
          icon={ArrowUpRight}
          trend={summary.monthTotal > 0 ? '+ no mês corrente' : 'Nenhum aporte no mês'}
          trendUp={summary.monthTotal > 0}
        />
        <SummaryCard
          title="Total de Aportes"
          value={`${summary.depositsCount} ${summary.depositsCount === 1 ? 'aporte' : 'aportes'}`}
          icon={PiggyBank}
          trend="Contribuições realizadas"
          trendUp
        />
        <SummaryCard
          title="Média por aporte"
          value={formatCurrency(summary.averageDeposit)}
          icon={Target}
          trend="Constância importa mais"
          trendUp
        />
        <SummaryCard
          title="Resgates de emergência"
          value={`${summary.withdrawalsCount} ${summary.withdrawalsCount === 1 ? 'resgate' : 'resgates'}`}
          icon={ShieldCheck}
          trend="Usos em emergência"
          trendUp={summary.withdrawalsCount === 0}
        />
      </div>

      {/* Contributions History */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Histórico de Movimentações</CardTitle>
            <CardDescription className="text-xs">
              Registros de aportes e retiradas na sua reserva
            </CardDescription>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 p-1">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos ({contributions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('deposit')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filterType === 'deposit'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Aportes ({summary.depositsCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('withdrawal')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filterType === 'withdrawal'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Resgates ({summary.withdrawalsCount})
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {filteredContributions.length === 0 ? (
            <div className="py-10">
              <EmptyState
                icon={PiggyBank}
                title={filterType === 'all' ? 'Nenhuma movimentação registrada' : 'Nenhum registro nesta categoria'}
                description={
                  filterType === 'all'
                    ? 'Comece agora guardando uma pequena quantia. Use os botões de aporte rápido acima!'
                    : 'Não encontramos movimentações para o filtro selecionado.'
                }
                action={
                  filterType === 'all' ? (
                    <Button onClick={() => handleOpenNewContrib(20, 'deposit')} className="mt-4 gap-2">
                      <Plus className="h-4 w-4" /> Fazer Primeiro Aporte
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredContributions.map((item) => {
                const isDeposit = item.type === 'deposit';
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 hover:bg-muted/30 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          isDeposit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {isDeposit ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {item.notes || (isDeposit ? 'Aporte na reserva' : 'Resgate emergencial')}
                          </span>
                          <Badge
                            variant={isDeposit ? 'default' : 'destructive'}
                            className={`text-[10px] px-1.5 py-0 font-medium ${
                              isDeposit ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-0' : ''
                            }`}
                          >
                            {isDeposit ? 'Aporte' : 'Resgate'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(parseISO(item.contribution_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center">
                      <span
                        className={`font-quicksand text-base font-bold ${
                          isDeposit ? 'text-emerald-500' : 'text-destructive'
                        }`}
                      >
                        {isDeposit ? '+' : '-'} {formatCurrency(item.amount)}
                      </span>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditContrib(item)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Configuration Dialog */}
      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Configurar Meta da Reserva
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveGoal} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="goal-name">Nome do objetivo</Label>
              <Input
                id="goal-name"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="Ex: Reserva de Emergência, Colchão de Segurança"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-amount">Valor-alvo desejado (R$)</Label>
              <Input
                id="goal-amount"
                value={targetAmountInput.displayValue}
                onChange={(e) => targetAmountInput.handleChange(e, () => {})}
                placeholder="0,00"
                className="font-quicksand text-lg font-bold"
                required
              />
              <p className="text-xs text-muted-foreground">
                O valor total que você planeja ter guardado para cobrir imprevistos.
              </p>
            </div>

            {/* Smart Suggestions Helper */}
            <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Sugestões rápidas de valor-alvo:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => targetAmountInput.reset(3000)}
                >
                  R$ 3.000
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => targetAmountInput.reset(5000)}
                >
                  R$ 5.000
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => targetAmountInput.reset(10000)}
                >
                  R$ 10.000
                </Button>
                {monthlyExpenses > 0 && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-primary/40 text-primary"
                      onClick={() => targetAmountInput.reset(Math.round(monthlyExpenses * 3))}
                    >
                      3 meses ({formatCurrency(Math.round(monthlyExpenses * 3))})
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-primary/40 text-primary"
                      onClick={() => targetAmountInput.reset(Math.round(monthlyExpenses * 6))}
                    >
                      6 meses ({formatCurrency(Math.round(monthlyExpenses * 6))})
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Data alvo para alcançar a meta (opcional)</Label>
              <DatePicker
                value={goalTargetDate}
                onChange={setGoalTargetDate}
                placeholder="Selecione um prazo opcional"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-notes">Notas / Motivação (opcional)</Label>
              <Textarea
                id="goal-notes"
                value={goalNotes}
                onChange={(e) => setGoalNotes(e.target.value)}
                placeholder="Ex: Equivalente a 6 meses de despesas básicas para estabilidade familiar."
                rows={2}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setGoalModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingGoal} className="bg-primary text-primary-foreground">
                {isSavingGoal ? 'Salvando...' : 'Salvar Meta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contribution (Deposit / Withdrawal) Dialog */}
      <Dialog open={contribModalOpen} onOpenChange={setContribModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {contribType === 'deposit' ? (
                <>
                  <PiggyBank className="h-5 w-5 text-emerald-500" />
                  {editingContribId ? 'Editar Aporte' : 'Novo Aporte na Reserva'}
                </>
              ) : (
                <>
                  <ArrowDownLeft className="h-5 w-5 text-destructive" />
                  {editingContribId ? 'Editar Resgate' : 'Registrar Resgate de Emergência'}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveContribution} className="space-y-4 pt-2">
            {/* Type selector toggle */}
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-secondary/30 p-1">
              <button
                type="button"
                onClick={() => setContribType('deposit')}
                className={`flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all ${
                  contribType === 'deposit'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Aporte (+)
              </button>
              <button
                type="button"
                onClick={() => setContribType('withdrawal')}
                className={`flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all ${
                  contribType === 'withdrawal'
                    ? 'bg-destructive text-destructive-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                Resgate (-)
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contrib-amount">Valor (R$)</Label>
              <Input
                id="contrib-amount"
                value={contribAmountInput.displayValue}
                onChange={(e) => contribAmountInput.handleChange(e, () => {})}
                placeholder="0,00"
                className="font-quicksand text-xl font-bold"
                required
              />
            </div>

            {/* Quick chips inside modal */}
            {contribType === 'deposit' && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[10, 20, 50, 100, 200, 500].map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-border bg-card"
                    onClick={() => contribAmountInput.reset(amt)}
                  >
                    R$ {amt}
                  </Button>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Data</Label>
              <DatePicker
                value={contribDate}
                onChange={(val) => setContribDate(val)}
                placeholder="Selecione a data"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contrib-notes">Descrição ou anotação (opcional)</Label>
              <Input
                id="contrib-notes"
                value={contribNotes}
                onChange={(e) => setContribNotes(e.target.value)}
                placeholder={
                  contribType === 'deposit'
                    ? 'Ex: Troco da padaria, freela, economia da semana'
                    : 'Ex: Remédio urgente, conserto do carro'
                }
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setContribModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSavingContrib}
                className={contribType === 'deposit' ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'}
              >
                {isSavingContrib ? 'Salvando...' : editingContribId ? 'Atualizar' : 'Confirmar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir movimentação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente o registro desta movimentação e atualizará o saldo acumulado da sua reserva.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContribution} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
