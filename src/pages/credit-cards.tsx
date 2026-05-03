import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrencyInput } from '../hooks/use-currency-input';
import { useCreditCards } from '../hooks/use-credit-cards';
import { useDependents } from '../hooks/use-dependents';
import { PageHeader } from '../components/shared/page-header';
import { EmptyState } from '../components/shared/empty-state';
import { MonthPicker } from '../components/shared/month-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, Trash2, Edit, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { CardPurchasesPanel } from '@/components/sections/card-purchases-panel';
import { useCardPurchaseStore } from '@/store/card-purchase-store';
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
  open: 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]',
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
  const { creditCards, loading, error, addCreditCard, updateCreditCard, removeCreditCard, refreshCreditCards } = useCreditCards();
  const { dependents } = useDependents();
  const navigate = useNavigate();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const purchases = useCardPurchaseStore(s => s.purchases);

  useEffect(() => {
    if (expandedCardId) {
      useCardPurchaseStore.getState().fetchByCard(expandedCardId);
    }
  }, [expandedCardId]);

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
              <Button onClick={handleOpenAdd} className="bg-amber-500 hover:bg-amber-600 text-white gap-2 shadow-sm font-quicksand font-bold">
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
                          <p className="text-[11px] text-amber-500/80 mt-1 leading-tight">
                            O valor da fatura é calculado automaticamente pelas compras
                          </p>
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
                    <Button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600 text-white">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {creditCards.map(card => (
            <div
              key={card.id}
              className="relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between gap-4 border border-white/8 hover:border-white/14 transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
                borderLeftWidth: 3,
                borderLeftColor: card.color ?? '#6B7280'
              }}
            >
              {/* Subtle colored glow */}
              <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${card.color ?? '#6B7280'}28 0%, transparent 70%)`,
                  transform: 'translate(30%, -30%)'
                }}
              />

              {/* Top: name + color dot + actions */}
              <div className="relative flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: card.color ?? '#6B7280' }} />
                    <h3 className="font-bold text-white text-lg leading-tight truncate">{card.name}</h3>
                  </div>
                  {card.dependents && (
                    <p className="text-xs text-white/40">{card.dependents.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(card)} disabled={loadingId === card.id} className="h-8 w-8">
                    <Edit className="w-4 h-4 text-white/40 hover:text-amber-300" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger render={
                      <Button variant="ghost" size="icon" disabled={loadingId === card.id} className="h-8 w-8">
                        {loadingId === card.id ? <Loader2 className="w-4 h-4 text-white/40 animate-spin" /> : <Trash2 className="w-4 h-4 text-white/40 hover:text-red-400" />}
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

              {/* Invoice amount — prominent */}
              <div className="relative">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Valor da Fatura</p>
                <p className="text-3xl font-black text-white">{formatCurrency(card.invoice_amount)}</p>
              </div>

              {/* Meta row */}
              <div className="relative flex items-center justify-between pt-3 border-t border-white/6">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md border text-xs font-semibold ${STATUS_COLORS[card.status]}`}>
                    {STATUS_LABELS[card.status]}
                  </span>
                  <span className="text-xs text-white/30">{card.reference_month}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/40">Vence {format(parseISO(card.due_date), 'dd/MM', { locale: ptBR })}</p>
                </div>
              </div>

              {/* Action button */}
              <div className="relative">
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
                
                {/* Expand Purchases Button */}
                <button
                  onClick={() => setExpandedCardId(
                    expandedCardId === card.id ? null : card.id
                  )}
                  className="w-full flex items-center justify-between
                    pt-3 mt-2 border-t border-white/6 text-xs
                    text-white/40 hover:text-white/70 transition-colors"
                >
                  <span>
                    Compras
                    {expandedCardId === card.id && purchases.filter(p => p.credit_card_id === card.id).length > 0
                      ? ` (${purchases.filter(p => p.credit_card_id === card.id).length})`
                      : ''}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200
                    ${expandedCardId === card.id ? 'rotate-180' : ''}`} />
                </button>

                {expandedCardId === card.id && (
                  <CardPurchasesPanel
                    cardId={card.id}
                    referenceMonth={card.reference_month}
                    onInvoiceUpdated={() => {
                      refreshCreditCards()
                    }}
                  />
                )}
              </div>

              {/* Ver detalhes button */}
              <button
                onClick={() => navigate(`/app/credit-cards/${card.id}`)}
                className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold
                  border border-amber-400/30 text-amber-400
                  hover:bg-amber-400/10 hover:border-amber-400/60
                  transition-all duration-200 flex items-center
                  justify-center gap-2 group"
              >
                <span>Ver fatura detalhada</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5
                  transition-transform duration-200" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
