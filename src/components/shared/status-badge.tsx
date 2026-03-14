import { Badge } from '@/components/ui/badge';

interface Props {
  status: 'pending' | 'paid' | 'open' | 'closed';
}

export function StatusBadge({ status }: Props) {
  const variants = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    open: 'bg-blue-100 text-blue-800 border-blue-200',
    closed: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  return (
    <Badge variant="outline" className={variants[status] || ''}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
