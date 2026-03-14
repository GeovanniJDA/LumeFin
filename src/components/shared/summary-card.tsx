import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export function SummaryCard({ title, value, icon: Icon, trend, trendUp }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-quicksand">{value}</div>
        {trend && (
          <p className={cn("text-xs flex items-center mt-1 font-medium", trendUp ? "text-green-600" : "text-red-600")}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
