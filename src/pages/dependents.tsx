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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dependentSchema, type DependentFormValues } from '../lib/schemas';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

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
  mae: 'bg-[rgba(236,72,153,0.15)] text-pink-400 border-[rgba(236,72,153,0.3)]',
  pai: 'bg-[rgba(59,130,246,0.15)] text-blue-400 border-[rgba(59,130,246,0.3)]',
  avo: 'bg-[rgba(16,185,129,0.15)] text-emerald-400 border-[rgba(16,185,129,0.3)]',
  avoa: 'bg-[rgba(20,184,166,0.15)] text-teal-400 border-[rgba(20,184,166,0.3)]',
  irmao: 'bg-[rgba(99,102,241,0.15)] text-indigo-400 border-[rgba(99,102,241,0.3)]',
  irma: 'bg-[rgba(168,85,247,0.15)] text-purple-400 border-[rgba(168,85,247,0.3)]',
  tio: 'bg-[rgba(245,158,11,0.15)] text-amber-400 border-[rgba(245,158,11,0.3)]',
  tia: 'bg-[rgba(249,115,22,0.15)] text-orange-400 border-[rgba(249,115,22,0.3)]',
  outro: 'bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.6)] border-[rgba(255,255,255,0.15)]'
};

export default function Dependents() {
  const { dependents, loading, error, addDependent, updateDependent, removeDependent } = useDependents();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

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
    form.reset({ name: '', relationship: 'outro', notes: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (dependent: Dependent) => {
    setEditingId(dependent.id);
    form.reset({
      name: dependent.name,
      relationship: dependent.relationship,
      notes: dependent.notes || ''
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: any) => {
    const formData = data as DependentFormValues;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDependent(editingId, formData);
        toast.success('Dependente actualizado.');
      } else {
        await addDependent(formData);
        toast.success('Dependente adicionado.');
      }
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
      await removeDependent(id);
      toast.success('Dependente removido.');
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Dependentes"
        description="Gerencie seus familiares e dependentes financeiros."
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={
              <Button onClick={handleOpenAdd} className="bg-amber-500 hover:bg-amber-600 text-white gap-2 shadow-sm font-quicksand font-bold">
                <Plus className="w-4 h-4" /> Adicionar Dependente
              </Button>
            } />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Dependente' : 'Adicionar Dependente'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4 pt-4">

                  <FormField
                    control={form.control as any}
                    name="name"
                    render={({ field }) => (
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
                    control={form.control as any}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parentesco</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o parentesco">
                                {field.value
                                  ? RELATIONSHIP_LABELS[field.value as Relationship] ?? field.value
                                  : 'Selecione o parentesco'}
                              </SelectValue>
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
                    control={form.control as any}
                    name="notes"
                    render={({ field }) => (
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
                    <Button type="submit" disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600 text-white">
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
        <div className="p-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-red-400 rounded-lg">
          Falha ao carregar dependentes: {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : dependents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum dependente cadastrado"
          description="Você ainda não adicionou nenhum dependente. Clique no botão acima para começar."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {dependents.map(dep => (
            <div key={dep.id}
              className="glass rounded-2xl p-5 flex flex-col gap-4
                hover:border-white/12 transition-all duration-200
                border border-white/6">

              {/* Top row: avatar + name + relationship + actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Avatar with initials */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg font-black border-2 ${RELATIONSHIP_COLORS[dep.relationship]}`}
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    {dep.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">{dep.name}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${RELATIONSHIP_COLORS[dep.relationship]}`}>
                      {RELATIONSHIP_LABELS[dep.relationship]}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(dep)} disabled={loadingId === dep.id}>
                    <Edit className="w-4 h-4 text-white/40 hover:text-amber-400" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger render={
                      <Button variant="ghost" size="icon" disabled={loadingId === dep.id}>
                        {loadingId === dep.id ? <Loader2 className="w-4 h-4 text-white/40 animate-spin" /> : <Trash2 className="w-4 h-4 text-white/40 hover:text-red-400" />}
                      </Button>
                    } />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso removerá o dependente {dep.name} permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(dep.id)} className="bg-red-600 hover:bg-red-700 text-white">
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Notes if present */}
              {dep.notes && (
                <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">
                  {dep.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
