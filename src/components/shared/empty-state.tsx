import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border rounded-xl border-dashed bg-slate-50/50">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 mb-5 shadow-sm border border-slate-200">
        <Icon className="w-7 h-7 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 font-quicksand">{title}</h3>
      <p className="text-sm text-slate-500 mt-2 mb-6 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
