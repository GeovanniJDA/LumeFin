import { useState } from 'react';
import { useTransactions } from '../hooks/use-transactions';
import { useDependents } from '../hooks/use-dependents';
import { DataTable } from '../components/shared/data-table';
import { PageHeader } from '../components/shared/page-header';
import { formatCurrency } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit } from 'lucide-react';
import type { DependentTransaction } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function Transactions() {
  const { transactions, loading, removeTransaction } = useTransactions();
  const { dependents } = useDependents();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const columns = [
    {
      header: 'Date',
      accessor: (row: DependentTransaction) => <span className="text-muted-foreground text-sm font-quicksand">{new Date(row.transaction_date).toLocaleDateString()}</span>
    },
    {
      header: 'Description',
      accessor: (row: DependentTransaction) => <span className="font-semibold text-foreground font-quicksand">{row.description}</span>
    },
    {
      header: 'Dependent',
      accessor: (row: DependentTransaction) => {
        const dep = dependents.find(d => d.id === row.dependent_id);
        return <span className="text-muted-foreground">{dep?.name || 'Unknown'}</span>;
      }
    },
    {
      header: 'Amount',
      accessor: (row: DependentTransaction) => (
        <span className={`font-semibold ${row.type === 'to_receive' ? 'text-green-600' : 'text-foreground'}`}>
          {row.type === 'to_receive' ? '+' : '-'}{formatCurrency(row.amount)}
        </span>
      )
    },
    {
      header: 'Type',
      accessor: (row: DependentTransaction) => (
        <Badge variant="outline" className={row.type === 'to_receive' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
          {row.type === 'to_receive' ? 'Receive' : 'Pay'}
        </Badge>
      )
    },
    {
      header: 'Installments',
      accessor: (row: DependentTransaction) => (
        <span className="text-muted-foreground text-sm">
          {row.payment_type === 'installment' ? `${row.paid_installments || 0}/${row.installments || 1}` : 'N/A'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: DependentTransaction) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => {}}><Edit className="w-4 h-4 text-muted-foreground hover:text-blue-500" /></Button>
          <Button variant="ghost" size="icon" onClick={() => removeTransaction(row.id)}><Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" /></Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Transactions" 
        description="Track dependent expenses and incoming funds." 
        action={
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger
              render={
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-quicksand font-bold">
                  <Plus className="w-4 h-4" /> Add Transaction
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
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
        <DataTable data={transactions} columns={columns} keyExtractor={(row) => row.id} emptyMessage="No transactions found." />
      )}
    </div>
  );
}
