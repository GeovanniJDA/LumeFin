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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/shared/date-picker';
import { MonthPicker } from '@/components/shared/month-picker';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cardPurchaseSchema, type CardPurchaseFormValues } from '@/lib/schemas';
import { useCurrencyInput } from '@/hooks/use-currency-input';
import { toast } from 'sonner';
import type { CardPurchase, PurchaseType } from '@/types';

interface CardPurchasesPanelProps {
  cardId: string;
  referenceMonth: string;
  onInvoiceUpdated: () => void;
}

export function CardPurchasesPanel({ cardId, referenceMonth, onInvoiceUpdated }: CardPurchasesPanelProps) {
  const { purchases, loading, totalByType, fetchByCard, add, update, remove } = useCardPurchases(cardId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchByCard(cardId);
  }, [cardId, fetchByCard]);

  const form = useForm<CardPurchaseFormValues>({
    resolver: zodResolver(cardPurchaseSchema) as any,
    defaultValues: {
      description: '',
      amount: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      type: 'cash',
      installments: 1,
      reference_month: referenceMonth,
      notes: ''
    }
  });

  const watchType = form.watch('type');
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
      notes: ''
    });
    amountInput.reset(0);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (purchase: CardPurchase) => {
    setEditingId(purchase.id);
    form.reset({
      description: purchase.description,
      amount: purchase.amount,
      purchase_date: purchase.purchase_date,
      type: purchase.type,
      installments: purchase.installments,
      reference_month: purchase.reference_month,
      notes: purchase.notes || ''
    });
    amountInput.reset(purchase.amount);
    setIsDialogOpen(true);
  };

  const onSubmit: SubmitHandler<CardPurchaseFormValues> = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingId) {
        await update(editingId, { ...formData, notes: formData.notes || null, current_installment: formData.current_installment ?? 1 });
        toast.success('Compra atualizada.');
      } else {
        await add(cardId, { ...formData, notes: formData.notes || null, current_installment: formData.current_installment ?? 1 });
        toast.success('Compra adicionada.');
      }
      onInvoiceUpdated();
      setIsDialogOpen(false);
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
    <div className="pt-4 border-t border-white/6 space-y-4">
      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
          <p className="text-[10px] text-white/40 uppercase">À Vista</p>
          <p className="text-sm font-bold text-white">{formatCurrency(totalByType.cash)}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
          <p className="text-[10px] text-white/40 uppercase">Parcelado</p>
          <p className="text-sm font-bold text-white">{formatCurrency(totalByType.installment)}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
          <p className="text-[10px] text-white/40 uppercase">Recorrente</p>
          <p className="text-sm font-bold text-white">{formatCurrency(totalByType.recurring)}</p>
        </div>
      </div>

      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white">Compras da Fatura</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button variant="ghost" size="sm" onClick={handleOpenAdd} className="h-8 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-400/10">
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
                        <FormLabel>Valor *</FormLabel>
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
                        <Select value={field.value} onValueChange={field.onChange}>
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
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
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
                  </div>
                )}

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
                  <Button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600 text-white">
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
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div className="text-center py-6 bg-white/5 rounded-lg border border-white/5 border-dashed">
          <CardIcon className="w-6 h-6 text-white/20 mx-auto mb-2" />
          <p className="text-xs text-white/40">Nenhuma compra lançada nesta fatura.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPurchases.map(purchase => (
            <div key={purchase.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-white truncate">{purchase.description}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10 text-white/60 whitespace-nowrap">
                    {purchase.type === 'installment' ? `${purchase.current_installment}/${purchase.installments} ${typeLabels.installment}` : typeLabels[purchase.type]}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-white/40">
                  <span>{format(parseISO(purchase.purchase_date), "dd 'de' MMM", { locale: ptBR })}</span>
                  {purchase.type === 'installment' && (
                    <>
                      <span>•</span>
                      <span>Total: {formatCurrency(purchase.amount)}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 gap-1">
                <span className="font-bold text-sm text-white">
                  {purchase.type === 'installment' 
                    ? formatCurrency(purchase.amount / purchase.installments)
                    : formatCurrency(purchase.amount)}
                </span>
                
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(purchase)} disabled={loadingId === purchase.id} className="h-6 w-6">
                    <Edit className="w-3 h-3 text-white/40 hover:text-amber-300" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger render={
                      <Button variant="ghost" size="icon" disabled={loadingId === purchase.id} className="h-6 w-6">
                        {loadingId === purchase.id ? <Loader2 className="w-3 h-3 text-white/40 animate-spin" /> : <Trash2 className="w-3 h-3 text-white/40 hover:text-red-400" />}
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
                        <AlertDialogAction onClick={() => handleDelete(purchase.id)} className="bg-red-600 hover:bg-red-700 text-white">
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
