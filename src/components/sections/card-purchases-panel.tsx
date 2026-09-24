/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useCardPurchases } from '@/hooks/use-card-purchases';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Edit, Trash2, Loader2, CreditCard as CardIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/shared/date-picker';
import { MonthPicker } from '@/components/shared/month-picker';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cardPurchaseSchema, type CardPurchaseFormValues } from '@/lib/schemas';
import { useCurrencyInput } from '@/hooks/use-currency-input';
import { toast } from 'sonner';
import type { CardPurchaseWithDependents, Dependent, PurchaseType } from '@/types';

interface CardPurchasesPanelProps {
  cardId: string;
  referenceMonth: string;
  dependents: Dependent[];
  openOnMount?: boolean;
  onPurchaseSaved?: () => void;
  onInvoiceUpdated: () => void;
}

export function CardPurchasesPanel({ cardId, referenceMonth, dependents, openOnMount = false, onPurchaseSaved, onInvoiceUpdated }: CardPurchasesPanelProps) {
  const { purchases, loading, error, totalByType, fetchByCard, add, update, remove } = useCardPurchases(cardId);
  const [isDialogOpen, setIsDialogOpen] = useState(openOnMount);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchByCard(cardId);
  }, [cardId, referenceMonth, fetchByCard]);

  const form = useForm<CardPurchaseFormValues>({
    resolver: zodResolver(cardPurchaseSchema) as any,
    defaultValues: {
      description: '',
      amount: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      type: 'cash',
      installments: 1,
      reference_month: referenceMonth,
      dependent_ids: [],
      notes: ''
    }
  });

  const watchType = form.watch('type');
  const watchAmount = form.watch('amount');
  const watchInstallments = form.watch('installments');
  const amountInput = useCurrencyInput(0);

  const handleOpenAdd = () => {
    setEditingId(null);
    form.reset({
      description: '',
      amount: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      type: 'cash',
      installments: 1,
      reference_month: referenceMonth,
      dependent_ids: [],
      notes: ''
    });
    amountInput.reset(0);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (purchase: CardPurchaseWithDependents) => {
    setEditingId(purchase.id);
    form.reset({
      description: purchase.description,
      amount: purchase.type === 'installment' ? purchase.amount / purchase.installments : purchase.amount,
      purchase_date: purchase.purchase_date,
      type: purchase.type,
      installments: purchase.installments,
      reference_month: purchase.reference_month,
      dependent_ids: purchase.dependents.map(dependent => dependent.id),
      notes: purchase.notes || ''
    });
    amountInput.reset(purchase.type === 'installment' ? purchase.amount / purchase.installments : purchase.amount);
    setIsDialogOpen(true);
  };

  const onSubmit: SubmitHandler<CardPurchaseFormValues> = async (formData) => {
    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        amount: formData.type === 'installment'
          ? Math.round(formData.amount * formData.installments * 100) / 100
          : formData.amount,
        notes: formData.notes || null,
        current_installment: formData.current_installment ?? 1
      };
      if (editingId) {
        await update(editingId, data);
        toast.success('Compra atualizada.');
      } else {
        await add(cardId, data);
        toast.success('Compra adicionada.');
      }
      onInvoiceUpdated();
      setIsDialogOpen(false);
      onPurchaseSaved?.();
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoadingId(id);
    try {
      await remove(id);
      toast.success('Compra removida.');
      onInvoiceUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado.');
    } finally {
      setLoadingId(null);
    }
  };

  const typeLabels: Record<PurchaseType, string> = {
    cash: 'À Vista',
    installment: 'Parcelado',
    recurring: 'Recorrente'
  };

  const filteredPurchases = purchases.filter(p => p.reference_month === referenceMonth);

  return (
    <div className="pt-4 border-t border-border space-y-4">
      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/50 rounded-lg p-2 text-center border border-border">
          <p className="text-[10px] text-muted-foreground uppercase">À Vista</p>
          <p className="text-sm font-bold text-foreground">{formatCurrency(totalByType.cash)}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center border border-border">
          <p className="text-[10px] text-muted-foreground uppercase">Parcelado</p>
          <p className="text-sm font-bold text-foreground">{formatCurrency(totalByType.installment)}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 text-center border border-border">
          <p className="text-[10px] text-muted-foreground uppercase">Recorrente</p>
          <p className="text-sm font-bold text-foreground">{formatCurrency(totalByType.recurring)}</p>
        </div>
      </div>

      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground">Compras da Fatura</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button variant="ghost" size="sm" onClick={handleOpenAdd} className="h-8 text-xs text-primary hover:text-primary hover:bg-amber-400/10">
              <Plus className="w-3 h-3 mr-1" /> Adicionar
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Compra' : 'Nova Compra'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 pt-4">
                <FormField
                  control={form.control as any}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Mercado, Uber..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{watchType === 'installment' ? 'Valor da parcela *' : 'Valor *'}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={amountInput.displayValue}
                            onChange={(e) => amountInput.handleChange(e, field.onChange)}
                            placeholder="0,00"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="purchase_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data *</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value ?? null}
                            onChange={field.onChange}
                            placeholder="Data da compra"
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
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select value={field.value} onValueChange={(value) => {
                          if (!value) return;
                          const nextType = value as PurchaseType;
                          const amount = form.getValues('amount');
                          const installments = form.getValues('installments') || 1;
                          if (field.value === 'installment' && nextType !== 'installment') {
                            form.setValue('amount', amount * installments);
                            amountInput.reset(amount * installments);
                          } else if (field.value !== 'installment' && nextType === 'installment') {
                            form.setValue('amount', amount / installments);
                            amountInput.reset(amount / installments);
                          }
                          field.onChange(nextType);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo">
                              {field.value === 'cash' ? 'À Vista'
                                : field.value === 'installment' ? 'Parcelado'
                                : field.value === 'recurring' ? 'Recorrente'
                                : 'Selecione o tipo'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">À Vista</SelectItem>
                            <SelectItem value="installment">Parcelado</SelectItem>
                            <SelectItem value="recurring">Recorrente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="reference_month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mês Ref. *</FormLabel>
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

                {watchType === 'installment' && (
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <FormField
                      control={form.control as any}
                      name="installments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total de Parcelas *</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={field.value === 1 ? '' : String(field.value)}
                              placeholder="Ex: 12"
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '')
                                field.onChange(val === '' ? 1 : parseInt(val, 10))
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <p className="mt-3 text-sm text-muted-foreground">
                      Total da compra: {formatCurrency(Math.round(watchAmount * watchInstallments * 100) / 100)}
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control as any}
                  name="dependent_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dependentes (opcional)</FormLabel>
                      <div className="space-y-2 border rounded-md p-3 max-h-40 overflow-y-auto bg-card">
                        {dependents.length ? dependents.map(dependent => (
                          <div key={dependent.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`purchase-dependent-${dependent.id}`}
                              checked={field.value?.includes(dependent.id) ?? false}
                              onCheckedChange={checked => field.onChange(checked
                                ? [...(field.value ?? []), dependent.id]
                                : (field.value ?? []).filter((id: string) => id !== dependent.id))}
                            />
                            <label htmlFor={`purchase-dependent-${dependent.id}`} className="text-sm">{dependent.name}</label>
                          </div>
                        )) : <span className="text-sm text-muted-foreground">Nenhum dependente cadastrado.</span>}
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
                          placeholder="Detalhes opcionais..."
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
                  <Button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600 text-foreground">
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {editingId ? 'Salvar' : 'Adicionar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* List of Purchases */}
      {error ? (
        <p role="alert" className="text-center py-4 text-sm text-destructive">Falha ao carregar compras: {error}</p>
      ) : loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div className="text-center py-6 bg-muted/50 rounded-lg border border-border border-dashed">
          <CardIcon className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Nenhuma compra lançada nesta fatura.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPurchases.map(purchase => (
            <div key={purchase.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:border-border transition-colors">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-foreground truncate">{purchase.description}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/50 text-muted-foreground whitespace-nowrap">
                    {purchase.type === 'installment' ? `${purchase.current_installment}/${purchase.installments} ${typeLabels.installment}` : typeLabels[purchase.type]}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{format(parseISO(purchase.purchase_date), "dd 'de' MMM", { locale: ptBR })}</span>
                  {purchase.dependents.length > 0 && (
                    <span className="truncate max-w-32">• {purchase.dependents.map(dependent => dependent.name).join(', ')}</span>
                  )}
                  {purchase.type === 'installment' && (
                    <>
                      <span>•</span>
                      <span>Total: {formatCurrency(purchase.amount)}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 gap-1">
                <span className="font-bold text-sm text-foreground">
                  {purchase.type === 'installment' 
                    ? formatCurrency(purchase.amount / purchase.installments)
                    : formatCurrency(purchase.amount)}
                </span>
                
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(purchase)} disabled={loadingId === purchase.id} className="h-6 w-6">
                    <Edit className="w-3 h-3 text-muted-foreground hover:text-primary" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger render={
                      <Button variant="ghost" size="icon" disabled={loadingId === purchase.id} className="h-6 w-6">
                        {loadingId === purchase.id ? <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" /> : <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />}
                      </Button>
                    } />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir compra?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a compra "{purchase.description}"? O valor da fatura será recalculado.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(purchase.id)} className="bg-red-600 hover:bg-red-700 text-foreground">
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
