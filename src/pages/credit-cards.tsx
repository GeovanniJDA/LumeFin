import { useState } from 'react';
import { useCurrencyInput } from '../hooks/use-currency-input';
import { useCreditCards } from '../hooks/use-credit-cards';
import { useDependents } from '../hooks/use-dependents';
import { PageHeader } from '../components/shared/page-header';
import { EmptyState } from '../components/shared/empty-state';
import { MonthPicker } from '../components/shared/month-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import type { CreditCardWithDependent, CardStatus } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { creditCardSchema, type CreditCardFormValues } from '../lib/schemas';
import { DatePicker } from '@/components/shared/date-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const STATUS_LABELS: Record<CardStatus, string> = {
  open: 'Aberta',
  closed: 'Fechada',
  paid: 'Paga'
};

const STATUS_COLORS: Record<CardStatus, string> = {
  open: 'bg-[rgba(59,130,246,0.15)] text-[#3B82F6] border-[rgba(59,130,246,0.3)]',
  closed: 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]',
  paid: 'bg-[rgba(16,185,129,0.15)] text-[#10B981] border-[rgba(16,185,129,0.3)]'
};

const CARD_COLORS = [
  { label: 'Nubank', value: '#8B5CF6' },
  { label: 'Inter', value: '#F97316' },
  { label: 'Bradesco', value: '#EF4444' },
  { label: 'Itaú', value: '#F59E0B' },
  { label: 'Santander', value: '#DC2626' },
  { label: 'C6 Bank', value: '#1C1C1E' },
  { label: 'XP', value: '#000000' },
  { label: 'Cinza', value: '#6B7280' },
];

export default function CreditCards() {
  const { creditCards, loading, error, addCreditCard, updateCreditCard, removeCreditCard } = useCreditCards();
  const { dependents } = useDependents();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const form = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      name: '',
      dependent_id: null,
      due_date: new Date().toISOString().split('T')[0],
      closing_day: 1,
      invoice_amount: 0,
      status: 'open',
      reference_month: format(new Date(), 'yyyy-MM'),
      color: '#6B7280',
      notes: ''
    }
  });

  const invoiceAmountInput = useCurrencyInput(0);

  const handleOpenAdd = () => {
    setEditingId(null);
    form.reset({
      name: '',
      dependent_id: null,
      due_date: new Date().toISOString().split('T')[0],
      closing_day: 1,
      invoice_amount: 0,
      status: 'open',
      reference_month: format(new Date(), 'yyyy-MM'),
      color: '#6B7280',
      notes: ''
    });
    invoiceAmountInput.reset(0);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (card: CreditCardWithDependent) => {
    setEditingId(card.id);
    form.reset({
      name: card.name,
      dependent_id: card.dependent_id || null,
      due_date: card.due_date,
      closing_day: card.closing_day,
      invoice_amount: card.invoice_amount,
      status: card.status,
      reference_month: card.reference_month,
      color: card.color || '#6B7280',
      notes: card.notes || ''
    });
    invoiceAmountInput.reset(card.invoice_amount ?? 0);
    setIsDialogOpen(true);
  };

  const onSubmit: SubmitHandler<CreditCardFormValues> = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateCreditCard(editingId, formData);
        toast.success('Cartão actualizado.');
      } else {
        await addCreditCard(formData);
        toast.success('Cartão adicionado.');
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseInvoice = async (id: string, currentStatus: CardStatus) => {
    if (currentStatus !== 'open') return;
    setLoadingId(id);
    try {
      await updateCreditCard(id, { status: 'closed' });
      toast.success('Status actualizado.');
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleMarkAsPaid = async (id: string, currentStatus: CardStatus) => {
    if (currentStatus !== 'closed') return;
    setLoadingId(id);
    try {
      await updateCreditCard(id, {
        status: 'paid',
        paid_date: new Date().toISOString()
      });
      toast.success('Status actualizado.');
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setLoadingId(id);
    try {
      await removeCreditCard(id);
      toast.success('Cartão removido.');
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Cartões de Crédito"
        description="Gerencie seus cartões, faturas e vencimentos."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={
              <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-quicksand font-bold">
                <Plus className="w-4 h-4" /> Adicionar Cartão
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Cartão' : 'Adicionar Cartão'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 pt-4">

                  <FormField
                    control={form.control as any}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Cartão *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Nubank, Itaú..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Color Picker */}
                  <FormField
                    control={form.control as any}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor do Cartão</FormLabel>
                        <div className="flex gap-2 flex-wrap">
                          {CARD_COLORS.map(c => (
                            <button
                              key={c.value}
                              type="button"
                              title={c.label}
                              onClick={() => field.onChange(c.value)}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${field.value === c.value
                                ? 'border-white scale-110'
                                : 'border-transparent opacity-70 hover:opacity-100'
                                }`}
                              style={{ backgroundColor: c.value }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="dependent_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DependenNenhumte (Opcional)</FormLabel>
                        <Select
                          value={field.value || "Selecione"}
                          onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione...">
                                {field.value && field.value !== "none"
                                  ? dependents.find(d => d.id === field.value)?.name
                                  : field.value === "none"
                                    ? "Nenhum — cartão próprio"
                                    : undefined}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhum — cartão próprio</SelectItem>
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
                    <FormField
                      control={form.control as any}
                      name="due_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Vencimento *</FormLabel>
                          <FormControl>
                            <DatePicker
                              value={field.value ?? null}
                              onChange={field.onChange}
                              placeholder="Selecione o vencimento"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name="closing_day"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia Fechamento *</FormLabel>
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control as any}
                      name="invoice_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Fatura *</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={invoiceAmountInput.displayValue}
                              onChange={(e) => invoiceAmountInput.handleChange(e, field.onChange)}
                              placeholder="0,00"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                  </div>

                  <FormField
                    control={form.control as any}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status">
                              {field.value === 'open' ? 'Aberta' : field.value === 'closed' ? 'Fechada' : 'Paga'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Aberta</SelectItem>
                            <SelectItem value="closed">Fechada</SelectItem>
                            <SelectItem value="paid">Paga</SelectItem>
                          </SelectContent>
                        </Select>
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
        }
      />

      {error && !isDialogOpen && (
        <div className="p-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-red-400 rounded-lg">
          Falha ao carregar cartões: {error}
        </div>
      )}

      {loading && creditCards.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : creditCards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhum cartão cadastrado"
          description="Você ainda não adicionou nenhum cartão de crédito. Clique no botão acima para começar."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creditCards.map(card => (
            <div
              key={card.id}
              className="glass rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg transition-all"
              style={{ borderLeftWidth: 3, borderLeftColor: card.color ?? '#6B7280' }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: card.color ?? '#6B7280' }}
                    />
                    <h3 className="font-semibold text-lg text-white font-quicksand truncate">{card.name}</h3>
                  </div>
                  {card.dependents && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.6)]">
                      Dependente: {card.dependents.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(card)} disabled={loadingId === card.id} className="h-8 w-8">
                    <Edit className="w-4 h-4 text-[rgba(255,255,255,0.4)] hover:text-blue-400" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger render={
                      <Button variant="ghost" size="icon" disabled={loadingId === card.id} className="h-8 w-8">
                        {loadingId === card.id ? <Loader2 className="w-4 h-4 text-[rgba(255,255,255,0.4)] animate-spin" /> : <Trash2 className="w-4 h-4 text-[rgba(255,255,255,0.4)] hover:text-red-400" />}
                      </Button>
                    } />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso removerá o cartão {card.name} permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(card.id)} className="bg-red-600 hover:bg-red-700 text-white">
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex flex-col">
                  <span className="text-sm text-[rgba(255,255,255,0.4)]">Valor da Fatura</span>
                  <span className="text-2xl font-bold text-white">
                    {formatCurrency(card.invoice_amount)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <span className={`px-2 py-1 rounded-md border font-medium ${STATUS_COLORS[card.status]}`}>
                    {STATUS_LABELS[card.status]}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.5)] text-xs flex items-center">
                    Ref: {card.reference_month}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-[rgba(255,255,255,0.4)] pt-2 border-t border-[rgba(255,255,255,0.06)]">
                  <div>Vence em {format(parseISO(card.due_date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                  <div>Fecha dia {card.closing_day}</div>
                </div>
              </div>

              <div className="pt-4 mt-2">
                {card.status === 'open' && (
                  <Button
                    className="w-full bg-[rgba(245,158,11,0.15)] hover:bg-[rgba(245,158,11,0.25)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)] font-medium"
                    variant="outline"
                    onClick={() => handleCloseInvoice(card.id, card.status)}
                    disabled={loadingId === card.id || loading}
                  >
                    {loadingId === card.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Fechar fatura
                  </Button>
                )}
                {card.status === 'closed' && (
                  <Button
                    className="w-full bg-[rgba(16,185,129,0.15)] hover:bg-[rgba(16,185,129,0.25)] text-[#10B981] border border-[rgba(16,185,129,0.3)] font-medium"
                    variant="outline"
                    onClick={() => handleMarkAsPaid(card.id, card.status)}
                    disabled={loadingId === card.id || loading}
                  >
                    {loadingId === card.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Marcar como paga
                  </Button>
                )}
                {card.status === 'paid' && (
                  <div className="w-full text-center py-2 text-sm text-[#10B981] font-medium bg-[rgba(16,185,129,0.1)] rounded-md border border-[rgba(16,185,129,0.2)]">
                    Fatura Paga
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
