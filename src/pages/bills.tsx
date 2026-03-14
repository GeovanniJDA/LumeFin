import { useState } from 'react';
import { useBills } from '../hooks/use-bills';
import { useCategories } from '../hooks/use-categories';
import { DataTable } from '../components/shared/data-table';
import { PageHeader } from '../components/shared/page-header';
import { StatusBadge } from '../components/shared/status-badge';
import { formatCurrency } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit } from 'lucide-react';
import type { Bill } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Bills() {
  const { bills, loading, removeBill } = useBills();
  const { categories } = useCategories();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const columns = [
    {
      header: 'Category',
      accessor: (row: Bill) => {
        const cat = categories.find(c => c.id === row.category_id);
        return <span className="flex items-center gap-2">{cat?.icon || '📄'} {cat?.name || 'Unknown'}</span>;
      }
    },
    {
      header: 'Amount',
      accessor: (row: Bill) => <span className="font-semibold text-foreground">{formatCurrency(row.amount)}</span>
    },
    {
      header: 'Due Day',
      accessor: (row: Bill) => `Day ${row.due_day}`
    },
    {
      header: 'Ref Month',
      accessor: (row: Bill) => row.reference_month
    },
    {
      header: 'Status',
      accessor: (row: Bill) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessor: (row: Bill) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { }}><Edit className="w-4 h-4 text-blue-500" /></Button>
          <Button variant="ghost" size="icon" onClick={() => removeBill(row.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Bills"
        description="Manage your recurring family bills."
        action={
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger
              render={
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <Plus className="w-4 h-4" /> Add Bill
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Bill</DialogTitle>
              </DialogHeader>
              <div className="p-4 text-center text-muted-foreground">
                Form implementation pending (shadcn elements)
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : (
        <DataTable data={bills} columns={columns} keyExtractor={(row) => row.id} emptyMessage="No bills found." />
      )}
    </div>
  );
}
