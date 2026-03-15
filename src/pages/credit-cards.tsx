import { useState } from 'react';
import { useCreditCards } from '../hooks/use-credit-cards';
import { useDependents } from '../hooks/use-dependents';
import { PageHeader } from '../components/shared/page-header';
import { EmptyState } from '../components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import type { CreditCardWithDependent, CardStatus } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useForm, Controller, type ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { creditCardSchema, type CreditCardFormValues } from '../lib/schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_LABELS: Record<CardStatus, string> = {
  open: 'Aberta',
  closed: 'Fechada',
  paid: 'Paga'
};

const STATUS_COLORS: Record<CardStatus, string> = {
  open: 'bg-blue-100 text-blue-700 border-blue-200',
  closed: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  paid: 'bg-green-100 text-green-700 border-green-200'
};

export default function CreditCards() {
  const { creditCards, loading, error, addCreditCard, updateCreditCard, removeCreditCard } = useCreditCards();
  const { dependents } = useDependents();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      name: '',
      dependent_id: null,
      due_date: new Date().toISOString().split('T')[0],
      closing_day: 1,
      invoice_amount: 0,
      status: 'open',
      reference_month: new Date().toISOString().slice(0, 7),
      notes: ''
    }
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setSubmitError(null);
    form.reset({
      name: '',
      dependent_id: null,
      due_date: new Date().toISOString().split('T')[0],
      closing_day: 1,
      invoice_amount: 0,
      status: 'open',
      reference_month: new Date().toISOString().slice(0, 7),
      notes: ''
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (card: CreditCardWithDependent) => {
    setEditingId(card.id);
    setSubmitError(null);
    form.reset({
      name: card.name,
      dependent_id: card.dependent_id || null,
      due_date: card.due_date,
      closing_day: card.closing_day,
      invoice_amount: card.invoice_amount,
      status: card.status,
      reference_month: card.reference_month,
      notes: card.notes || ''
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: CreditCardFormValues) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateCreditCard(editingId, data);
      } else {
        await addCreditCard(data);
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao salvar cartão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseInvoice = async (id: string, currentStatus: CardStatus) => {
    if (currentStatus !== 'open') return;
    try {
      await updateCreditCard(id, { status: 'closed' });
    } catch (err: any) {
      console.error('Failed to close invoice:', err);
    }
  };

  const handleMarkAsPaid = async (id: string, currentStatus: CardStatus) => {
    if (currentStatus !== 'closed') return;
    try {
      await updateCreditCard(id, {
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
        title="Cartões de Crédito"
        description="Gerencie seus cartões, faturas e vencimentos."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger>
              <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-quicksand font-bold">
                <Plus className="w-4 h-4" /> Adicionar Cartão
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Cartão' : 'Adicionar Cartão'}</DialogTitle>
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
                    name="name"
                    render={({ field }: { field: ControllerRenderProps<CreditCardFormValues, 'name'> }) => (
                      <FormItem>
                        <FormLabel>Nome do Cartão *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Nubank, Itaú..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dependent_id"
                    render={() => (
                      <FormItem>
                        <FormLabel>Dependente (Opcional)</FormLabel>
                        <Controller
                          control={form.control}
                          name="dependent_id"
                          render={({ field }) => (
                            <Select
                              value={field.value || "none"}
                              onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione...">
                                  {field.value && field.value !== "none"
                                    ? dependents.find(d => d.id === field.value)?.name
                                    : field.value === "none"
                                      ? "Nenhum — cartão próprio"
                                      : undefined}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nenhum — cartão próprio</SelectItem>
                                {dependents.map(dep => (
                                  <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>
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
                      name="due_date"
                      render={({ field }: { field: ControllerRenderProps<CreditCardFormValues, 'due_date'> }) => (
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

                    <FormField
                      control={form.control}
                      name="closing_day"
                      render={({ field }: { field: ControllerRenderProps<CreditCardFormValues, 'closing_day'> }) => (
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
                      control={form.control}
                      name="invoice_amount"
                      render={({ field }: { field: ControllerRenderProps<CreditCardFormValues, 'invoice_amount'> }) => (
                        <FormItem>
                          <FormLabel>Valor Fatura *</FormLabel>
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
                      name="reference_month"
                      render={({ field }: { field: ControllerRenderProps<CreditCardFormValues, 'reference_month'> }) => (
                        <FormItem>
                          <FormLabel>Mês Ref (YYYY-MM) *</FormLabel>
                          <FormControl>
                            <Input placeholder="2026-03" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                                <SelectItem value="open">Aberta</SelectItem>
                                <SelectItem value="closed">Fechada</SelectItem>
                                <SelectItem value="paid">Paga</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }: { field: ControllerRenderProps<CreditCardFormValues, 'notes'> }) => (
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
          Falha ao carregar cartões: {error}
        </div>
      )}

      {loading && creditCards.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
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
            <div key={card.id} className="bg-card border border-border p-5 rounded-xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg text-foreground font-quicksand truncate">{card.name}</h3>
                  {card.dependents && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground">
                      Dependente: {card.dependents.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(card)} className="h-8 w-8">
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
                          Esta ação não pode ser desfeita. Isso removerá o cartão {card.name} permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeCreditCard(card.id)} className="bg-red-600 hover:bg-red-700 text-white">
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Valor da Fatura</span>
                  <span className="text-2xl font-bold text-foreground">
                    {formatCurrency(card.invoice_amount)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <span className={`px-2 py-1 rounded-md border font-medium ${STATUS_COLORS[card.status]}`}>
                    {STATUS_LABELS[card.status]}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs flex items-center">
                    Ref: {card.reference_month}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground pt-2 border-t">
                  <div>Vence em {format(parseISO(card.due_date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                  <div>Fecha dia {card.closing_day}</div>
                </div>
              </div>

              <div className="pt-4 mt-2">
                {card.status === 'open' && (
                  <Button 
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium"
                    onClick={() => handleCloseInvoice(card.id, card.status)}
                    disabled={loading}
                  >
                    Fechar fatura
                  </Button>
                )}
                {card.status === 'closed' && (
                  <Button 
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-medium"
                    onClick={() => handleMarkAsPaid(card.id, card.status)}
                    disabled={loading}
                  >
                    Marcar como paga
                  </Button>
                )}
                {card.status === 'paid' && (
                  <div className="w-full text-center py-2 text-sm text-green-600 font-medium bg-green-50 rounded-md border border-green-100">
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
