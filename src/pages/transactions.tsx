import { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/use-transactions';
import { useDependents } from '../hooks/use-dependents';
import { PageHeader } from '../components/shared/page-header';
import { EmptyState } from '../components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, type TransactionFormValues } from '../lib/schemas';
import { formatCurrency } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TransactionWithDependent, TransactionType, TransactionStatus, PaymentType } from '../types';
import {
  Plus,
  Trash2,
  Edit,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  FilterX,
} from 'lucide-react';

const TYPE_LABELS: Record<TransactionType, string> = {
  to_pay: 'A Pagar',
  to_receive: 'A Receber',
};

const TYPE_COLORS: Record<TransactionType, string> = {
  to_pay: 'bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.3)]',
  to_receive: 'bg-[rgba(16,185,129,0.15)] text-[#10B981] border-[rgba(16,185,129,0.3)]',
};

const STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
};

const STATUS_COLORS: Record<TransactionStatus, string> = {
  pending: 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]',
  paid: 'bg-[rgba(16,185,129,0.15)] text-[#10B981] border-[rgba(16,185,129,0.3)]',
};

const PAYMENT_LABELS: Record<PaymentType, string> = {
  cash: 'À Vista',
  installment: 'Parcelado',
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  mae: 'Mãe', pai: 'Pai', avo: 'Avô', avoa: 'Avó',
  irmao: 'Irmão', irma: 'Irmã', tio: 'Tio', tia: 'Tia', outro: 'Outro',
};

export default function Transactions() {
  const { transactions, loading, error, addTransaction, updateTransaction, removeTransaction, netBalanceByDependent } = useTransactions();
  const { dependents } = useDependents();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [filterDependent, setFilterDependent] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      dependent_id: '',
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      type: 'to_pay',
      payment_type: 'cash',
      installments: 1,
      paid_installments: 0,
      status: 'pending',
      settled_date: null,
      notes: '',
    },
  });

  const watchPaymentType = form.watch('payment_type');
  const watchStatus = form.watch('status');

  // Summary — dependents who have transactions
  const dependentsWithTransactions = useMemo(() => {
    const depIds = [...new Set(transactions.map(t => t.dependent_id))];
    return depIds
      .map(id => {
        const dep = dependents.find(d => d.id === id);
        if (!dep) return null;
        return { ...dep, netBalance: netBalanceByDependent(id) };
      })
      .filter(Boolean) as Array<{ id: string; name: string; relationship: string; netBalance: number }>;
  }, [transactions, dependents, netBalanceByDependent]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterDependent !== 'all' && t.dependent_id !== filterDependent) return false;
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      return true;
    });
  }, [transactions, filterDependent, filterType, filterStatus]);

  const clearFilters = () => {
    setFilterDependent('all');
    setFilterType('all');
    setFilterStatus('all');
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setSubmitError(null);
    form.reset({
      dependent_id: '',
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      type: 'to_pay',
      payment_type: 'cash',
      installments: 1,
      paid_installments: 0,
      status: 'pending',
      settled_date: null,
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (tx: TransactionWithDependent) => {
    setEditingId(tx.id);
    setSubmitError(null);
    form.reset({
      dependent_id: tx.dependent_id,
      transaction_date: tx.transaction_date,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      payment_type: tx.payment_type,
      installments: tx.installments || 1,
      paid_installments: tx.paid_installments || 0,
      status: tx.status,
      settled_date: tx.settled_date || null,
      notes: tx.notes || '',
    });
    setIsDialogOpen(true);
  };

  const onSubmit: SubmitHandler<TransactionFormValues> = async (formData) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateTransaction(editingId, formData);
      } else {
        await addTransaction(formData);
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao salvar transação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await updateTransaction(id, {
        status: 'paid',
        settled_date: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Failed to mark as paid:', err);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Transações"
        description="Acompanhe débitos e créditos com dependentes."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={
              <Button
                onClick={handleOpenAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-quicksand font-bold"
              >
                <Plus className="w-4 h-4" /> Adicionar Transação
              </Button>
            } />
            <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Transação' : 'Adicionar Transação'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 pt-4">
                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
                      {submitError}
                    </div>
                  )}

                  {/* Dependent */}
                  <FormField
                    control={form.control as any}
                    name="dependent_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dependente *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione...">
                              {field.value
                                ? dependents.find(d => d.id === field.value)?.name ?? 'Selecione...'
                                : 'Selecione...'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {dependents.map(dep => (
                              <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Transaction Date */}
                    <FormField
                      control={form.control as any}
                      name="transaction_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data *</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Amount */}
                    <FormField
                      control={form.control as any}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor *</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={field.value === 0 ? '' : String(field.value)}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.,]/g, '');
                                field.onChange(val === '' ? 0 : Number(val.replace(',', '.')));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Description */}
                  <FormField
                    control={form.control as any}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Empréstimo, Compra compartilhada..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Type */}
                    <FormField
                      control={form.control as any}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione...">
                                {field.value === 'to_pay' ? 'A Pagar' : 'A Receber'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="to_pay">A Pagar</SelectItem>
                              <SelectItem value="to_receive">A Receber</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Payment Type */}
                    <FormField
                      control={form.control as any}
                      name="payment_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pagamento *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione...">
                                {field.value === 'cash' ? 'À Vista' : 'Parcelado'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">À Vista</SelectItem>
                              <SelectItem value="installment">Parcelado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Installments — only when payment_type === 'installment' */}
                  {watchPaymentType === 'installment' && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control as any}
                        name="installments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total de Parcelas</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={field.value === 0 ? '' : String(field.value)}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  field.onChange(val === '' ? 1 : Number(val));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="paid_installments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parcelas Pagas</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={String(field.value)}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  field.onChange(val === '' ? 0 : Number(val));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Status */}
                  <FormField
                    control={form.control as any}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status">
                              {field.value === 'pending' ? 'Pendente' : 'Pago'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="paid">Pago</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Settled Date — only when status === 'paid' */}
                  {watchStatus === 'paid' && (
                    <FormField
                      control={form.control as any}
                      name="settled_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Liquidação</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              value={field.value ? field.value.split('T')[0] : ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Notes */}
                  <FormField
                    control={form.control as any}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informações adicionais..."
                            className="resize-none"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                      {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {editingId ? 'Salvar' : 'Adicionar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {error && !isDialogOpen && (
        <div className="p-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-red-400 rounded-lg">
          Falha ao carregar transações: {error}
        </div>
      )}

      {/* Summary Cards — net balance per dependent */}
      {dependentsWithTransactions.length > 0 && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {dependentsWithTransactions.map(dep => (
            <div
              key={dep.id}
              className={`glass-strong rounded-2xl p-4 transition-shadow hover:shadow-lg ${
                dep.netBalance >= 0
                  ? 'border-l-2 border-l-[#10B981]'
                  : 'border-l-2 border-l-[#EF4444]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {dep.netBalance >= 0 ? (
                  <ArrowDownLeft className="w-4 h-4 text-[#10B981]" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-[#EF4444]" />
                )}
                <span className="font-semibold text-foreground text-sm truncate">{dep.name}</span>
              </div>
              <span className={`text-xl font-bold ${dep.netBalance >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {formatCurrency(Math.abs(dep.netBalance))}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                {dep.netBalance >= 0 ? 'A receber' : 'A pagar'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 glass rounded-2xl p-4">
        <div className="w-full md:w-48">
          <Select value={filterDependent} onValueChange={(val) => setFilterDependent(val || 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Dependente">
                {filterDependent === 'all'
                  ? 'Todos (Dependentes)'
                  : dependents.find(d => d.id === filterDependent)?.name ?? 'Dependente'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos (Dependentes)</SelectItem>
              {dependents.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-48">
          <Select value={filterType} onValueChange={(val) => setFilterType(val || 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo">
                {filterType === 'all' ? 'Todos os Tipos' : TYPE_LABELS[filterType as TransactionType]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="to_pay">A Pagar</SelectItem>
              <SelectItem value="to_receive">A Receber</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-48">
          <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Status">
                {filterStatus === 'all' ? 'Todos os Status' : STATUS_LABELS[filterStatus as TransactionStatus]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={clearFilters} className="md:ml-auto w-full md:w-auto h-10 gap-2 whitespace-nowrap">
          <FilterX className="w-4 h-4" /> Limpar
        </Button>
      </div>

      {/* Content */}
      {loading && transactions.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nenhuma transação encontrada"
          description="Ajuste os filtros ou adicione uma nova transação clicando no botão acima."
        />
      ) : (
        <div className="rounded-2xl overflow-hidden glass">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.4)' }}>
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Dependente</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Descrição</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Valor</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Tipo</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Pagamento</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.map(tx => {
                  const dep = dependents.find(d => d.id === tx.dependent_id);
                  return (
                    <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{dep?.name || 'Desconhecido'}</span>
                          {dep?.relationship && (
                            <Badge variant="secondary" className="text-[10px] font-medium py-0 h-5">
                              {RELATIONSHIP_LABELS[dep.relationship] || dep.relationship}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{tx.description}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(tx.transaction_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-foreground">
                        <span className={tx.type === 'to_receive' ? 'text-green-600' : 'text-red-600'}>
                          {tx.type === 'to_receive' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${TYPE_COLORS[tx.type]}`}>
                          {TYPE_LABELS[tx.type]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-sm">
                        {tx.payment_type === 'installment'
                          ? `${tx.paid_installments || 0}/${tx.installments || 1} parcelas`
                          : PAYMENT_LABELS[tx.payment_type]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${STATUS_COLORS[tx.status]}`}>
                          {STATUS_LABELS[tx.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {tx.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-semibold text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleMarkAsPaid(tx.id)}
                              disabled={loading}
                            >
                              Marcar como pago
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(tx)} className="h-8 w-8">
                            <Edit className="w-4 h-4 text-muted-foreground hover:text-blue-600" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger render={
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-600" />
                              </Button>
                            } />
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeTransaction(tx.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
