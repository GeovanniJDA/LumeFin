import { useState } from 'react';
import { useDependents } from '../hooks/use-dependents';
import { DataTable } from '../components/shared/data-table';
import { PageHeader } from '../components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit } from 'lucide-react';
import type { Dependent } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Dependents() {
  const { dependents, loading, removeDependent } = useDependents();
  // const { bills } = useBills(); // For counting bills
  const [isFormOpen, setIsFormOpen] = useState(false);

  const columns = [
    {
      header: 'Name',
      accessor: (row: Dependent) => <span className="font-semibold text-foreground font-quicksand">{row.name}</span>
    },
    {
      header: 'Relationship',
      accessor: (row: Dependent) => (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {row.relationship}
        </span>
      )
    },
    {
      header: 'Notes',
      accessor: (row: Dependent) => <span className="text-muted-foreground font-quicksand truncate max-w-xs block">{row.notes || '-'}</span>
    },
    {
      header: 'Actions',
      accessor: (row: Dependent) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => {}}><Edit className="w-4 h-4 text-muted-foreground hover:text-blue-500" /></Button>
          <Button variant="ghost" size="icon" onClick={() => removeDependent(row.id)}><Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" /></Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Dependents" 
        description="Manage family members and their finances." 
        action={
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-quicksand font-bold">
                <Plus className="w-4 h-4" /> Add Dependent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Dependent</DialogTitle></DialogHeader>
              <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
                Form implementation pending (needs Shadcn elements)
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-border border-t-blue-600"></div></div>
      ) : (
        <DataTable data={dependents} columns={columns} keyExtractor={(row) => row.id} emptyMessage="No dependents found." />
      )}
    </div>
  );
}
