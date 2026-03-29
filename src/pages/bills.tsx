import { useState, useMemo } from 'react';
import { useBills } from '../hooks/use-bills';
import { useCategories } from '../hooks/use-categories';
import { useDependents } from '../hooks/use-dependents';
import { PageHeader } from '../components/shared/page-header';
import { EmptyState } from '../components/shared/empty-state';
import { MonthPicker } from '../components/shared/month-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { useForm, Controller } from 'react-hook-form';
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
  FilterX,
  Tag,
  Phone,
  GraduationCap,
  Music
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

const ICON_MAP: Record<string, LucideIcon> = {
  'zap': Zap,
  'droplets': Droplets,
  'wifi': Wifi,
  'tv': Tv,
  'shopping-cart': ShoppingCart,
  'home': Home,
  'heart-pulse': HeartPulse,
  'car': Car,
  'tag': Tag,
  'phone': Phone,
  'graduation-cap': GraduationCap,
  'music': Music,
  'receipt': Receipt
};

const ICON_LABELS: Record<string, string> = {
  'zap': 'Energia', 'droplets': 'Água', 'wifi': 'Internet',
  'tv': 'Streaming', 'shopping-cart': 'Compras',
  'home': 'Casa', 'heart-pulse': 'Saúde', 'car': 'Transporte',
  'tag': 'Outros', 'receipt': 'Geral', 'phone': 'Telefone',
  'graduation-cap': 'Educação', 'music': 'Entretenimento'
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
  pending: 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]',
  paid: 'bg-[rgba(16,185,129,0.15)] text-[#10B981] border-[rgba(16,185,129,0.3)]'
};

export default function Bills() {
  const { bills, loading, error, addBill, updateBill, removeBill, page, totalPages, hasNextPage, hasPrevPage, nextPage, prevPage, resetPage } = useBills();
  const { categories, systemCategories, userCategories, loading: categoriesLoading, addCategory, removeCategory } = useCategories();
  const { dependents } = useDependents();

  // Dialog & Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Category Manager State
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('tag');
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);

  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Filters State
  const currentMonthStr = format(new Date(), 'yyyy-MM');
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
    resetPage();
  };

  const handleOpenAdd = () => {
    setEditingId(null);
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
    if (categoriesLoading || categories.length === 0) return;
    setEditingId(bill.id);
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
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateBill(editingId, data);
        toast.success('Conta actualizada.');
      } else {
        await addBill(data);
        toast.success('Conta adicionada.');
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (id: string, currentStatus: BillStatus) => {
    if (currentStatus !== 'pending') return;
    setLoadingId(id);
    try {
      await updateBill(id, {
        status: 'paid',
        paid_date: new Date().toISOString()
      });
      toast.success('Conta marcada como paga.');
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setLoadingId(id);
    try {
      await removeBill(id);
      toast.success('Conta removida.');
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleAddCategory = async () => {
    if (newCategoryName.length < 2) return;
    setIsCategorySubmitting(true);
    try {
      await addCategory({
        name: newCategoryName,
        icon: newCategoryIcon,
        is_system: false
      });
      toast.success('Categoria adicionada.');
      setNewCategoryName('');
      setNewCategoryIcon('tag');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar categoria.');
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleRemoveCategory = async (id: string) => {
    try {
      await removeCategory(id);
      toast.success('Categoria removida.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover categoria.');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Contas"
        description="Gerencie suas contas e despesas."
        action={
          <div className="flex items-center gap-2">
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger
                render={
                  <Button
                    variant="outline"
                    className="gap-2 shadow-sm font-quicksand font-bold border-white/10"
                  >
                    Gerenciar Categorias
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Gerenciar Categorias</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome (*)"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                    />
                    <Select value={newCategoryIcon} onValueChange={v => v && setNewCategoryIcon(v)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Ícone" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(ICON_MAP).map(iconName => {
                          const IconComp = ICON_MAP[iconName];
                          return (
                            <SelectItem key={iconName} value={iconName}>
                              <div className="flex items-center gap-2">
                                <IconComp className="w-4 h-4" /> 
                                <span className="truncate">{ICON_LABELS[iconName] || iconName}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleAddCategory} 
                      disabled={newCategoryName.length < 2 || isCategorySubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                    >
                      {isCategorySubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {userCategories.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria personalizada.</p>
                    ) : (
                      userCategories.map(cat => {
                        const IconComponent = getCategoryIcon(cat.icon);
                        return (
                          <div key={cat.id} className="flex items-center justify-between p-2 rounded-md border border-white/5 bg-white/5">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-secondary rounded-md">
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-medium">{cat.name}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-8 h-8 text-muted-foreground hover:text-red-500"
                              onClick={() => handleRemoveCategory(cat.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger
                render={
                  <Button
                    onClick={handleOpenAdd}
                    disabled={categoriesLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-quicksand font-bold"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Conta
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Editar Conta' : 'Adicionar Conta'}</DialogTitle>
                </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 pt-4">

                  <FormField
                    control={form.control as any}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select
                          key={`category-${categories.length}`}
                          value={field.value}
                          onValueChange={(value) => {
                            const selected = categories.find(c => c.id === value)
                            if (selected?.name === 'Outros') {
                              setIsNewCategoryDialogOpen(true)
                            } else {
                              field.onChange(value)
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione...">
                              {field.value
                                ? categories.find(c => c.id === field.value)?.name ?? 'Selecione...'
                                : 'Selecione...'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Categorias do Sistema</SelectLabel>
                              {systemCategories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                              ))}
                            </SelectGroup>
                            {userCategories.length > 0 && (
                              <SelectGroup>
                                <SelectLabel>Minhas Categorias</SelectLabel>
                                {userCategories.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                              </SelectGroup>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />

                        <Dialog
                          open={isNewCategoryDialogOpen}
                          onOpenChange={setIsNewCategoryDialogOpen}
                        >
                          <DialogContent className="sm:max-w-[360px]">
                            <DialogHeader>
                              <DialogTitle>Nova Categoria</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                              <div>
                                <label className="text-sm font-medium text-white/80">
                                  Nome da Categoria *
                                </label>
                                <Input
                                  value={newCategoryName}
                                  onChange={e => setNewCategoryName(e.target.value)}
                                  placeholder="Ex: Academia, Pet, Farmácia..."
                                  className="mt-1"
                                  autoFocus
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-white/80">
                                  Ícone
                                </label>
                                <Select value={newCategoryIcon} onValueChange={v => v && setNewCategoryIcon(v)}>
                                  <SelectTrigger className="mt-1">
                                    <SelectValue>
                                      {newCategoryIcon}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="tag">Outros</SelectItem>
                                    <SelectItem value="receipt">Geral</SelectItem>
                                    <SelectItem value="zap">Energia</SelectItem>
                                    <SelectItem value="droplets">Água</SelectItem>
                                    <SelectItem value="wifi">Internet</SelectItem>
                                    <SelectItem value="tv">Streaming</SelectItem>
                                    <SelectItem value="shopping-cart">Compras</SelectItem>
                                    <SelectItem value="home">Casa</SelectItem>
                                    <SelectItem value="heart-pulse">Saúde</SelectItem>
                                    <SelectItem value="car">Transporte</SelectItem>
                                    <SelectItem value="phone">Telefone</SelectItem>
                                    <SelectItem value="graduation-cap">Educação</SelectItem>
                                    <SelectItem value="music">Entretenimento</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end gap-2 pt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setIsNewCategoryDialogOpen(false)
                                    setNewCategoryName('')
                                    setNewCategoryIcon('tag')
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  type="button"
                                  disabled={isSavingCategory || newCategoryName.trim().length < 2}
                                  onClick={async () => {
                                    setIsSavingCategory(true)
                                    try {
                                      const newCat = await addCategory({
                                        name: newCategoryName.trim(),
                                        icon: newCategoryIcon,
                                        is_system: false
                                      })
                                      if (newCat) field.onChange(newCat.id)
                                      setIsNewCategoryDialogOpen(false)
                                      setNewCategoryName('')
                                      setNewCategoryIcon('tag')
                                      toast.success('Categoria criada.')
                                    } catch (err: any) {
                                      toast.error(err.message || 'Erro ao criar categoria.')
                                    } finally {
                                      setIsSavingCategory(false)
                                    }
                                  }}
                                >
                                  {isSavingCategory
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : 'Criar e Selecionar'
                                  }
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
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
                      control={form.control as any}
                      name="due_date"
                      render={({ field }) => (
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
                      control={form.control as any}
                      name="reference_month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mês Ref *</FormLabel>
                          <FormControl>
                            <MonthPicker 
                              value={field.value} 
                              onChange={field.onChange} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="paid">Paga</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch('status') === 'paid' && (
                    <FormField
                      control={form.control as any}
                      name="paid_date"
                      render={({ field }) => (
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
                    control={form.control as any}
                    name="dependent_ids"
                    render={() => (
                      <FormItem>
                        <FormLabel>Dependentes</FormLabel>
                        <div className="space-y-2 border rounded-md p-3 max-h-40 overflow-y-auto bg-card">
                          <Controller
                            control={form.control as any}
                            name="dependent_ids"
                            render={({ field }) => (
                              <>
                                {dependents.map(dep => (
                                  <div key={dep.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`dep-${dep.id}`}
                                      checked={(field.value || []).includes(dep.id)}
                                          onCheckedChange={(checked) => {
                                            const currentValue = (field.value || []) as string[];
                                            if (checked) {
                                              field.onChange([...currentValue, dep.id]);
                                            } else {
                                              field.onChange(currentValue.filter((id: string) => id !== dep.id));
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
          </div>
        }
      />

      {error && !isDialogOpen && (
        <div className="p-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-red-400 rounded-lg">
          Falha ao carregar contas: {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 glass rounded-2xl p-4">
        <div className="w-full md:w-48">
          <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val || 'all'); resetPage(); }}>
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

        <div className="w-full md:w-64 flex items-center gap-2">
          <div className="flex-1">
            <MonthPicker
              value={filterMonth}
              onChange={(val) => { setFilterMonth(val); resetPage(); }}
            />
          </div>
          {filterMonth && (
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 border-dashed text-muted-foreground hover:text-foreground"
              onClick={() => { setFilterMonth(''); resetPage(); }}
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="w-full md:w-48">
          <Select value={filterDependent} onValueChange={(val) => { setFilterDependent(val || 'all'); resetPage(); }}>
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
          <Select value={filterCategory} onValueChange={(val) => { setFilterCategory(val || 'all'); resetPage(); }}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria">
                {filterCategory === 'all'
                  ? 'Todas as Categorias'
                  : categories.find(c => c.id === filterCategory)?.name ?? 'Categoria'}
              </SelectValue>
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
        <div className="rounded-2xl overflow-hidden glass">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase" style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.4)' }}>
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
                                <Badge key={d.id} variant="secondary" className="text-[13px] font-medium py-0 h-5">
                                  {d.name}
                                </Badge>
                              ))}
                              {billDeps.length > 2 && (
                                <Badge variant="outline" className="text-[13px] font-medium py-0 h-5 bg-background">
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
                              disabled={loadingId === bill.id || loading}
                            >
                              {loadingId === bill.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                              Marcar como paga
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(bill)} disabled={loadingId === bill.id} className="h-8 w-8">
                            <Edit className="w-4 h-4 text-muted-foreground hover:text-blue-600" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger render={
                              <Button variant="ghost" size="icon" disabled={loadingId === bill.id} className="h-8 w-8">
                                {loadingId === bill.id ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" /> : <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-600" />}
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
                                <AlertDialogAction onClick={() => handleDelete(bill.id)} className="bg-red-600 hover:bg-red-700 text-white">
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
          {totalPages > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
              <span className="text-sm text-white/40">
                Página {page + 1} de {totalPages || 1}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={!hasPrevPage}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!hasNextPage}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
