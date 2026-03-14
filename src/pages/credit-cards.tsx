import { useState } from 'react';
import { useCreditCards } from '../hooks/use-credit-cards';
import { useDependents } from '../hooks/use-dependents';
import { DataTable } from '../components/shared/data-table';
import { PageHeader } from '../components/shared/page-header';
import { StatusBadge } from '../components/shared/status-badge';
import { formatCurrency } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit } from 'lucide-react';
import type { CreditCard } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function CreditCards() {
  const { creditCards, loading, removeCreditCard } = useCreditCards();
  const { dependents } = useDependents();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const columns = [
    {
      header: 'Card Name',
      accessor: (row: CreditCard) => <span className="font-semibold text-foreground font-quicksand">{row.name}</span>
    },
    {
      header: 'Dependent',
      accessor: (row: CreditCard) => {
        const dep = dependents.find(d => d.id === row.dependent_id);
        return <span className="text-muted-foreground">{dep?.name || 'None'}</span>;
      }
    },
    {
      header: 'Invoice Amount',
      accessor: (row: CreditCard) => <span className="font-semibold text-foreground">{formatCurrency(row.invoice_amount)}</span>
    },
    {
      header: 'Due / Closing',
      accessor: (row: CreditCard) => <span className="text-muted-foreground text-sm">Day {row.due_day} / Day {row.closing_day}</span>
    },
    {
      header: 'Status',
      accessor: (row: CreditCard) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessor: (row: CreditCard) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => { }}><Edit className="w-4 h-4 text-muted-foreground hover:text-blue-500" /></Button>
          <Button variant="ghost" size="icon" onClick={() => removeCreditCard(row.id)}><Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" /></Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Credit Cards"
        description="Manage credit cards and ongoing invoices."
        action={
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger
              render={<Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-quicksand font-bold">
                <Plus className="w-4 h-4" /> Add Card
              </Button>}
            />
            <DialogContent>
              <DialogHeader><DialogTitle>Add Credit Card</DialogTitle></DialogHeader>
              <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
                Form implementation pending
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-border border-t-blue-600"></div></div>
      ) : (
        <DataTable data={creditCards} columns={columns} keyExtractor={(row) => row.id} emptyMessage="No credit cards found." />
      )}
    </div>
  );
}
