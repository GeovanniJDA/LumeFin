/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, type ReactNode } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useCardPurchaseStore } from '@/store/card-purchase-store';
import { toast } from 'sonner';
import type { CardPurchaseWithDependents, Dependent, PurchaseType } from '@/types';

interface CardPurchaseDialogProps {
  cardId: string;
  referenceMonth: string;
  dependents: Dependent[];
  /** Compra a editar; `null` abre o formulário de nova compra. */
  purchase?: CardPurchaseWithDependents | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  /** Elemento que abre o diálogo (ex.: um botão "Adicionar"). */
  trigger?: ReactNode;
}

/**
 * Formulário de compra do cartão compartilhado entre a lista de cartões
 * (Cartões → Compras) e a fatura detalhada (Cartões → Ver fatura detalhada).
 */
export function CardPurchaseDialog({
  cardId,
  referenceMonth,
  dependents,
  purchase,
  open,
  onOpenChange,
  onSaved,
  trigger
}: CardPurchaseDialogProps) {
  const add = useCardPurchaseStore(s => s.add);
  const update = useCardPurchaseStore(s => s.update);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    if (!open) return;
    if (purchase) {
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
    } else {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, purchase?.id, referenceMonth]);

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
      if (purchase) {
        await update(purchase.id, data);
        toast.success('Compra atualizada.');
      } else {
        await add(cardId, data);
        toast.success('Compra adicionada.');
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger}
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{purchase ? 'Editar Compra' : 'Nova Compra'}</DialogTitle>
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600 text-foreground">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {purchase ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
