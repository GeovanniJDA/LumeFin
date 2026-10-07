/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useCardPurchases } from '@/hooks/use-card-purchases';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Edit, Trash2, Loader2, CreditCard as CardIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CardPurchaseDialog } from '@/components/sections/card-purchase-dialog';
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
  const { purchases, loading, error, totalByType, fetchByCard, remove } = useCardPurchases(cardId);
  const [isDialogOpen, setIsDialogOpen] = useState(openOnMount);
  const [editing, setEditing] = useState<CardPurchaseWithDependents | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchByCard(cardId);
  }, [cardId, referenceMonth, fetchByCard]);

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
        <CardPurchaseDialog
          cardId={cardId}
          referenceMonth={referenceMonth}
          dependents={dependents}
          purchase={editing}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSaved={() => {
            onInvoiceUpdated();
            onPurchaseSaved?.();
          }}
          trigger={
            <DialogTrigger render={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(null)}
                className="h-8 text-xs text-primary hover:text-primary hover:bg-amber-400/10"
              >
                <Plus className="w-3 h-3 mr-1" /> Adicionar
              </Button>
            } />
          }
        />
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
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(purchase); setIsDialogOpen(true); }} disabled={loadingId === purchase.id} className="h-6 w-6">
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
