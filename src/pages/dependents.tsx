import { useState } from 'react';
import { useDependents } from '../hooks/use-dependents';
import { PageHeader } from '../components/shared/page-header';
import { EmptyState } from '../components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, Users, Loader2 } from 'lucide-react';
import type { Dependent, Relationship } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useForm, type ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dependentSchema, type DependentFormValues } from '../lib/schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const RELATIONSHIP_LABELS: Record<Relationship, string> = {
  mae: 'Mãe',
  pai: 'Pai',
  avo: 'Avô',
  avoa: 'Avó',
  irmao: 'Irmão',
  irma: 'Irmã',
  tio: 'Tio',
  tia: 'Tia',
  outro: 'Outro'
};

const RELATIONSHIP_COLORS: Record<Relationship, string> = {
  mae: 'bg-pink-100 text-pink-700 border-pink-200',
  pai: 'bg-blue-100 text-blue-700 border-blue-200',
  avo: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  avoa: 'bg-teal-100 text-teal-700 border-teal-200',
  irmao: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  irma: 'bg-purple-100 text-purple-700 border-purple-200',
  tio: 'bg-amber-100 text-amber-700 border-amber-200',
  tia: 'bg-orange-100 text-orange-700 border-orange-200',
  outro: 'bg-gray-100 text-gray-700 border-gray-200'
};

export default function Dependents() {
  const { dependents, loading, error, addDependent, updateDependent, removeDependent } = useDependents();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DependentFormValues>({
    resolver: zodResolver(dependentSchema),
    defaultValues: {
      name: '',
      relationship: 'outro',
      notes: ''
    }
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setSubmitError(null);
    form.reset({ name: '', relationship: 'outro', notes: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (dependent: Dependent) => {
    setEditingId(dependent.id);
    setSubmitError(null);
    form.reset({
      name: dependent.name,
      relationship: dependent.relationship,
      notes: dependent.notes || ''
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: DependentFormValues) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDependent(editingId, data);
      } else {
        await addDependent(data);
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao salvar dependente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Dependentes"
        description="Gerencie seus familiares e dependentes financeiros."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger>
              <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-quicksand font-bold">
                <Plus className="w-4 h-4" /> Adicionar Dependente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Dependente' : 'Adicionar Dependente'}</DialogTitle>
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
                    render={({ field }: { field: ControllerRenderProps<DependentFormValues, 'name'> }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Maria da Silva" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="relationship"
                    render={({ field }: { field: ControllerRenderProps<DependentFormValues, 'relationship'> }) => (
                      <FormItem>
                        <FormLabel>Parentesco</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o parentesco" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }: { field: ControllerRenderProps<DependentFormValues, 'notes'> }) => (
                      <FormItem>
                        <FormLabel>Observações (Opcional)</FormLabel>
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
          Falha ao carregar dependentes: {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : dependents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum dependente cadastrado"
          description="Você ainda não adicionou nenhum dependente. Clique no botão acima para começar."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dependents.map(dep => (
            <div key={dep.id} className="bg-card border border-border p-5 rounded-xl flex justify-between items-start shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-3 flex-1 overflow-hidden">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg text-foreground font-quicksand truncate">{dep.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${RELATIONSHIP_COLORS[dep.relationship]}`}>
                    {RELATIONSHIP_LABELS[dep.relationship]}
                  </span>
                </div>
                {dep.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2 pr-4">{dep.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-1 ml-4 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(dep)}>
                  <Edit className="w-4 h-4 text-muted-foreground hover:text-blue-600" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-600" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso removerá o dependente {dep.name} permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeDependent(dep.id)} className="bg-red-600 hover:bg-red-700 text-white">
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
