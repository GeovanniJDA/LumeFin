interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold font-caveat text-slate-900">{title}</h1>
        {description && <p className="text-sm font-quicksand text-slate-500 mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
