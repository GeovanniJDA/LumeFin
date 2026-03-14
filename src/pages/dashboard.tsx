import { useBills } from '../hooks/use-bills';
import { useCreditCards } from '../hooks/use-credit-cards';
import { useTransactions } from '../hooks/use-transactions';
import { useDependents } from '../hooks/use-dependents';
import { SummaryCard } from '../components/shared/summary-card';
import { PageHeader } from '../components/shared/page-header';
import { formatCurrency } from '../lib/utils';
import { AlertCircle, CreditCard, Receipt, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { bills, getOverdueBills, getDueSoonBills } = useBills();
  const { creditCards, getOverdueCards, getDueSoonCards } = useCreditCards();
  const { dependents } = useDependents();
  const { getNetBalance } = useTransactions();

  const totalPendingBills = bills.filter(b => b.status === 'pending').reduce((acc, b) => acc + b.amount, 0);
  const totalInvoices = creditCards.filter(c => c.status === 'open').reduce((acc, c) => acc + c.invoice_amount, 0);

  const overdueBills = getOverdueBills();
  const dueSoonBills = getDueSoonBills();
  const overdueCards = getOverdueCards();
  const dueSoonCards = getDueSoonCards();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <PageHeader title="Dashboard" description="Financial overview and alerts." />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Pending Bills" 
          value={formatCurrency(totalPendingBills)} 
          icon={Receipt} 
        />
        <SummaryCard 
          title="Open Invoices" 
          value={formatCurrency(totalInvoices)} 
          icon={CreditCard} 
        />
      </div>

      {dependents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-caveat text-slate-800 border-b pb-2">Dependent Balances</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {dependents.map(dep => {
              const balance = getNetBalance(dep.id);
              return (
                <SummaryCard 
                  key={dep.id}
                  title={`${dep.name} Balance`} 
                  value={formatCurrency(Math.abs(balance))} 
                  icon={Wallet} 
                  trend={balance === 0 ? undefined : balance > 0 ? 'To Receive' : 'To Pay'}
                  trendUp={balance > 0}
                />
              );
            })}
          </div>
        </div>
      )}

      {(overdueBills.length > 0 || overdueCards.length > 0 || dueSoonBills.length > 0 || dueSoonCards.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-caveat text-slate-800 flex items-center gap-2 border-b pb-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Alerts
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            
            {/* Overdue Items */}
            {(overdueBills.length > 0 || overdueCards.length > 0) && (
              <Card className="border-red-200 bg-red-50/50 shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-red-700 text-sm font-semibold flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Overdue ({overdueBills.length + overdueCards.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 font-quicksand">
                    {overdueBills.slice(0, 3).map(b => (
                      <li key={b.id} className="flex justify-between border-b border-red-100 pb-1">
                        <span className="text-slate-700">Bill (Due day {b.due_day})</span>
                        <span className="font-semibold text-red-700">{formatCurrency(b.amount)}</span>
                      </li>
                    ))}
                    {overdueCards.slice(0, 3).map(c => (
                      <li key={c.id} className="flex justify-between border-b border-red-100 pb-1">
                        <span className="text-slate-700">Card: {c.name}</span>
                        <span className="font-semibold text-red-700">{formatCurrency(c.invoice_amount)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            {/* Due Soon Items */}
            {(dueSoonBills.length > 0 || dueSoonCards.length > 0) && (
              <Card className="border-yellow-200 bg-yellow-50/50 shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-yellow-700 text-sm font-semibold">Due Soon ({dueSoonBills.length + dueSoonCards.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 font-quicksand">
                    {dueSoonBills.slice(0, 3).map(b => (
                      <li key={b.id} className="flex justify-between border-b border-yellow-100 pb-1">
                        <span className="text-slate-700">Bill (Due day {b.due_day})</span>
                        <span className="font-semibold text-yellow-700">{formatCurrency(b.amount)}</span>
                      </li>
                    ))}
                    {dueSoonCards.slice(0, 3).map(c => (
                      <li key={c.id} className="flex justify-between border-b border-yellow-100 pb-1">
                        <span className="text-slate-700">Card: {c.name} (Due day {c.due_day})</span>
                        <span className="font-semibold text-yellow-700">{formatCurrency(c.invoice_amount)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
