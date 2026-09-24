import { Badge } from '@/components/ui/badge';

interface Props {
  status: 'pending' | 'paid' | 'open' | 'closed';
}

export function StatusBadge({ status }: Props) {
  const variants = {
    pending: 'bg-primary/10 text-primary border-primary/20',
    paid: 'bg-success/10 text-success border-success/20',
    open: 'bg-primary/10 text-primary border-primary/20',
    closed: 'bg-muted text-muted-foreground border-border',
  };
  const labels = { pending: 'Pendente', paid: 'Pago', open: 'Em aberto', closed: 'Fechado' };

  return (
    <Badge variant="outline" className={variants[status] || ''}>
      {labels[status]}
    </Badge>
  );
}
