import { useState, useMemo } from 'react';
import { useBills } from '../hooks/use-bills';
import { useCategories } from '../hooks/use-categories';
import { useDependents } from '../hooks/use-dependents';
import { PageHeader } from '../components/shared/page-header';
import { EmptyState } from '../components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useForm, Controller, type ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { billSchema, type BillFormValues } from '../lib/schemas';
import { formatCurrency } from '../lib/utils';
import type { BillWithRelations, BillStatus } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Trash2,
  Edit,
  Loader2,
  Receipt,
  Zap,
  Droplets,
  Wifi,
  Tv,
  ShoppingCart,
  Home,
  HeartPulse,
  Car,
  FilterX
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'zap': Zap,
  'droplets': Droplets,
  'wifi': Wifi,
  'tv': Tv,
  'shopping-cart': ShoppingCart,
  'home': Home,
  'heart-pulse': HeartPulse,
  'car': Car,
};

function getCategoryIcon(iconName: string | null) {
  if (!iconName) return Receipt;
  return ICON_MAP[iconName] || Receipt;
}

const STATUS_LABELS: Record<BillStatus, string> = {
  pending: 'Pendente',
  paid: 'Paga'
};

const STATUS_COLORS: Record<BillStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  paid: 'bg-green-100 text-green-700 border-green-200'
};

export default function Bills() {
  const { bills, loading, error, addBill, updateBill, removeBill } = useBills();
  const { categories } = useCategories();
  const { dependents } = useDependents();

  // Dialog & Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters State
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(currentMonthStr);
  const [filterDependent, setFilterDependent] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      category_id: '',
      amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      reference_month: currentMonthStr,
      status: 'pending',
      paid_date: null,
      dependent_ids: [],
      notes: ''
    }
  });

  // Filter Logic
  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      if (filterStatus !== 'all' && bill.status !== filterStatus) return false;
      if (filterMonth && !bill.reference_month.includes(filterMonth)) return false;
      if (filterCategory !== 'all' && bill.category_id !== filterCategory) return false;
      if (filterDependent !== 'all') {
        const hasDep = bill.dependents?.some(d => d.id === filterDependent);
        if (!hasDep) return false;
      }
      return true;
    });
  }, [bills, filterStatus, filterMonth, filterDependent, filterCategory]);

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterMonth('');
    setFilterDependent('all');
    setFilterCategory('all');
  };

  const systemCategories = categories.filter(c => c.is_system);
  const userCategories = categories.filter(c => !c.is_system);

  const handleOpenAdd = () => {
    setEditingId(null);
    setSubmitError(null);
    form.reset({
      category_id: '',
      amount: 0,
      due_date: new Date().toISOString().split('T')[0],
      reference_month: currentMonthStr,
      status: 'pending',
      paid_date: null,
      dependent_ids: [],
      notes: ''
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (bill: BillWithRelations) => {
    setEditingId(bill.id);
    setSubmitError(null);
    form.reset({
      category_id: bill.category_id,
      amount: bill.amount,
      due_date: bill.due_date,
      reference_month: bill.reference_month,
      status: bill.status,
      paid_date: bill.paid_date || null,
      dependent_ids: bill.dependents?.map(d => d.id) || [],
      notes: bill.notes || ''
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: BillFormValues) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateBill(editingId, data);
      } else {
        await addBill(data);
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao salvar conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (id: string, currentStatus: BillStatus) => {
    if (currentStatus !== 'pending') return;
    try {
      await updateBill(id, {
        status: 'paid',
        paid_date: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Failed to mark as paid:', err);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Contas"
        description="Gerencie suas contas e despesas."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger>
              <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-quicksand font-bold">
                <Plus className="w-4 h-4" /> Adicionar Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Conta' : 'Adicionar Conta'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
                      {submitError}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={() => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Controller
                          control={form.control}
                          name="category_id"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {systemCategories.length > 0 && (
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground w-full">Sistema</div>
                                )}
                                {systemCategories.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                                {userCategories.length > 0 && (
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground w-full mt-2">Personalizadas</div>
                                )}
                                {userCategories.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }: { field: ControllerRenderProps<BillFormValues, 'amount'> }) => (
                        <FormItem>
                          <FormLabel>Valor *</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={field.value === 0 ? '' : String(field.value)}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.,]/g, '')
                                field.onChange(val === '' ? 0 : Number(val.replace(',', '.')))
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="due_date"
                      render={({ field }: { field: ControllerRenderProps<BillFormValues, 'due_date'> }) => (
                        <FormItem>
                          <FormLabel>Data de Vencimento *</FormLabel>
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="reference_month"
                      render={({ field }: { field: ControllerRenderProps<BillFormValues, 'reference_month'> }) => (
                        <FormItem>
                          <FormLabel>Mês Ref (YYYY-MM) *</FormLabel>
                          <FormControl>
                            <Input placeholder="2026-03" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={() => (
                        <FormItem>
                          <FormLabel>Status *</FormLabel>
                          <Controller
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pendente</SelectItem>
                                  <SelectItem value="paid">Paga</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch('status') === 'paid' && (
                    <FormField
                      control={form.control}
                      name="paid_date"
                      render={({ field }: { field: ControllerRenderProps<BillFormValues, 'paid_date'> }) => (
                        <FormItem>
                          <FormLabel>Data de Pagamento</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ? field.value.split('T')[0] : ''}
                              onChange={e => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="dependent_ids"
                    render={() => (
                      <FormItem>
                        <FormLabel>Dependentes</FormLabel>
                        <div className="space-y-2 border rounded-md p-3 max-h-40 overflow-y-auto bg-card">
                          <Controller
                            control={form.control}
                            name="dependent_ids"
                            render={({ field }) => (
                              <>
                                {dependents.map(dep => (
                                  <div key={dep.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`dep-${dep.id}`}
                                      checked={(field.value || []).includes(dep.id)}
                                      onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        if (checked) {
                                          field.onChange([...currentValue, dep.id]);
                                        } else {
                                          field.onChange(currentValue.filter(id => id !== dep.id));
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={`dep-${dep.id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {dep.name}
                                    </label>
                                  </div>
                                ))}
                                {dependents.length === 0 && (
                                  <span className="text-sm text-muted-foreground">Nenhum dependente cadastrado.</span>
                                )}
                              </  >
                            )}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }: { field: ControllerRenderProps<BillFormValues, 'notes'> }) => (
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
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          Falha ao carregar contas: {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-card p-4 rounded-xl border border-border">
        <div className="w-full md:w-48">
          <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Paga</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-32">
          <Input
            placeholder="YYYY-MM"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
        </div>

        <div className="w-full md:w-48">
          <Select value={filterDependent} onValueChange={(val) => setFilterDependent(val || 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Dependente" />
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
          <Select value={filterCategory} onValueChange={(val) => setFilterCategory(val || 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={clearFilters} className="md:ml-auto w-full md:w-auto h-10 gap-2 whitespace-nowrap">
          <FilterX className="w-4 h-4" /> Limpar
        </Button>
      </div>

      {loading && bills.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredBills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nenhuma conta encontrada"
          description="Ajuste os filtros ou adicione uma nova conta clicando no botão acima."
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Categoria</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Dependentes</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Valor</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Vencimento</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Ref</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBills.map(bill => {
                  const cat = categories.find(c => c.id === bill.category_id);
                  const Icon = getCategoryIcon(cat?.icon || null);
                  const billDeps = bill.dependents || [];

                  return (
                    <tr key={bill.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-secondary rounded-lg">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{cat?.name || 'Desconhecida'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {billDeps.length === 0 ? (
                            <span className="text-muted-foreground text-xs italic">Nenhum</span>
                          ) : (
                            <>
                              {billDeps.slice(0, 2).map(d => (
                                <Badge key={d.id} variant="secondary" className="text-[10px] font-medium py-0 h-5">
                                  {d.name}
                                </Badge>
                              ))}
                              {billDeps.length > 2 && (
                                <Badge variant="outline" className="text-[10px] font-medium py-0 h-5 bg-background">
                                  +{billDeps.length - 2} mais
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-foreground">
                        {formatCurrency(bill.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {format(parseISO(bill.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {bill.reference_month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${STATUS_COLORS[bill.status]}`}>
                          {STATUS_LABELS[bill.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {bill.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-semibold text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleMarkAsPaid(bill.id, bill.status)}
                              disabled={loading}
                            >
                              Marcar como paga
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(bill)} className="h-8 w-8">
                            <Edit className="w-4 h-4 text-muted-foreground hover:text-blue-600" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeBill(bill.id)} className="bg-red-600 hover:bg-red-700 text-white">
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
