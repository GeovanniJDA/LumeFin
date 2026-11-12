import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { LayoutDashboard, Receipt, CreditCard, ArrowRightLeft, Users, LogOut, Loader2, UserCircle, ChevronsUpDown, Sun, Moon, Wallet, PiggyBank, CalendarDays, Menu, Download, ChartPie } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useBillStoreRaw } from '../../store/bill-store';
import { useDependentStoreRaw } from '../../store/dependent-store';
import { useCreditCardStoreRaw } from '../../store/credit-card-store';
import { useTransactionStoreRaw } from '../../store/transaction-store';
import { useCategoryStoreRaw } from '../../store/category-store';
import { useProfileStore } from '@/store/profile-store';
import { useCardPurchaseStore } from '@/store/card-purchase-store';
import { useCashFlowStore } from '@/store/cash-flow-store';
import { useEmergencyFundStore } from '@/store/emergency-fund-store';
import { useCategoryBudgetStore } from '@/store/category-budget-store';

const navigation = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Contas', href: '/app/bills', icon: Receipt },
  { name: 'Cartões', href: '/app/credit-cards', icon: CreditCard },
  { name: 'Transações', href: '/app/transactions', icon: ArrowRightLeft },
  { name: 'Fluxo de caixa', href: '/app/cash-flow', icon: Wallet },
  { name: 'Vencimentos', href: '/app/due-dates', icon: CalendarDays },
  { name: 'Reserva', href: '/app/emergency-fund', icon: PiggyBank },
  { name: 'Orçamento', href: '/app/budgets', icon: ChartPie },
  { name: 'Dependentes', href: '/app/dependents', icon: Users },
];

// ponytail: no mobile só 3 abas ficam fixas e o resto vai para um menu — upgrade
// path: lista por prioridade quando outra aba precise aparecer na barra fixa.
const MOBILE_FIXED = ['Dashboard', 'Contas', 'Transações'];
const mobileFixed = navigation.filter((item) => MOBILE_FIXED.includes(item.name));
const mobileMenu = navigation.filter((item) => !MOBILE_FIXED.includes(item.name));

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { profile, fetch: fetchProfile } = useProfileStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme !== 'light';
  const isMenuActive = mobileMenu.some((item) => location.pathname.startsWith(item.href));
  const contentWidth = location.pathname === '/app/transactions' ? 'max-w-[1600px]' : 'max-w-7xl';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user.email ?? null);
      if (session?.user.id) fetchProfile(session.user.id);
    });
  }, [fetchProfile]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error('Erro ao encerrar sessão.');
      } else {
        useBillStoreRaw.getState().reset();
        useDependentStoreRaw.getState().reset();
        useCreditCardStoreRaw.getState().reset();
        useTransactionStoreRaw.getState().reset();
        useCategoryStoreRaw.getState().reset();
        useProfileStore.getState().reset();
        useCardPurchaseStore.getState().reset();
        useCashFlowStore.getState().reset();
        useEmergencyFundStore.getState().reset();
        useCategoryBudgetStore.getState().reset();
        toast.success('Sessão encerrada.');
        navigate('/auth');
      }
    } catch {
      toast.error('Erro ao encerrar sessão.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const [{ createTransactionWorkbook }, { fetchFinanceExportData }] = await Promise.all([
        import('../../lib/transaction-workbook'),
        import('../../lib/finance-export-data'),
      ]);
      const [transactions, exportData] = await Promise.all([
        useTransactionStoreRaw.getState().fetchAll(),
        fetchFinanceExportData(),
      ]);
      const hasFinanceData = Object.entries(exportData).some(([key, value]) =>
        key === 'emergencyGoal' ? Boolean(value) : Array.isArray(value) && value.length > 0
      );
      if (transactions.length === 0 && !hasFinanceData) {
        toast.info('Não há dados financeiros para exportar.');
        return;
      }

      const workbook = createTransactionWorkbook(transactions, exportData);
      const workbookBuffer = workbook.buffer.slice(workbook.byteOffset, workbook.byteOffset + workbook.byteLength) as ArrayBuffer;
      const url = URL.createObjectURL(new Blob([workbookBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `lumefin-financas-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível exportar os dados financeiros.');
    } finally {
      setIsExporting(false);
    }
  };

  const themeToggle = (mobile = false) => (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${mobile ? 'justify-center' : 'w-full'}`}
    >
      {isDark ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
      {!mobile && <span>{isDark ? 'Tema claro' : 'Tema escuro'}</span>}
      {mobile && <span className="sr-only">{isDark ? 'Tema claro' : 'Tema escuro'}</span>}
    </button>
  );

  return (
    <div className="min-h-dvh bg-background text-foreground pb-16 md:pb-0">
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
        <span className="text-lg font-bold tracking-tight text-primary">LumeFin</span>
        <div className="flex items-center gap-2">
          {themeToggle(true)}
          <button
            type="button"
            onClick={() => navigate('/app/profile')}
            aria-label="Abrir meu perfil"
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-secondary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : (
              <span className="text-sm font-semibold">{(profile?.username || userEmail || '?').charAt(0).toUpperCase()}</span>
            )}
          </button>
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <span className="text-xl font-bold tracking-tight text-primary">LumeFin</span>
        </div>

        <nav aria-label="Navegação principal" className="flex-1 space-y-1 px-3 py-5">
          {navigation.map((item) => {
            const active = item.href === '/app'
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/app'}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-3 py-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
          >
            {isExporting ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" /> : <Download className="h-5 w-5 shrink-0" aria-hidden="true" />}
            <span>{isExporting ? 'Exportando...' : 'Exportar Excel'}</span>
          </button>
        </div>

        <div className="space-y-2 border-t border-sidebar-border p-3">
          {themeToggle()}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<button type="button" />}
              aria-label="Abrir menu da conta"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-primary">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : (
                  <span className="text-sm font-semibold">{(profile?.username || userEmail || '?').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{profile?.username || 'Minha conta'}</span>
                <span className="block truncate text-xs text-muted-foreground">{userEmail}</span>
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="text-sm font-medium">{profile?.username || 'Minha conta'}</p>
                  <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/app/profile')} className="cursor-pointer gap-2 rounded-lg px-3 py-2">
                <UserCircle className="h-4 w-4" aria-hidden="true" />Meu perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut} className="cursor-pointer gap-2 rounded-lg px-3 py-2 text-destructive">
                {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
                {isSigningOut ? 'Saindo...' : 'Sair'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="pt-14 md:ml-60 md:pt-0">
        <div className={`mx-auto min-h-dvh ${contentWidth} space-y-6 px-4 py-6 md:px-8 md:py-8`}>
          {children}
        </div>
      </main>

      <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-background/95 px-0.5 pb-[env(safe-area-inset-bottom)] md:hidden">
        {mobileFixed.map((item) => {
          const active = item.href === '/app'
            ? location.pathname === item.href
            : location.pathname.startsWith(item.href);
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/app'}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md py-1 text-[10px] sm:text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${active ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <item.icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" aria-hidden="true" />
              <span className="truncate max-w-full px-0.5">{item.name}</span>
            </NavLink>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<button type="button" />}
            aria-label="Abrir menu de navegação"
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md py-1 text-[10px] sm:text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${isMenuActive ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Menu className="h-4.5 w-4.5 sm:h-5 sm:w-5" aria-hidden="true" />
            <span className="truncate max-w-full px-0.5">Menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-56 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
            {mobileMenu.map((item) => (
              <DropdownMenuItem
                key={item.name}
                onClick={() => navigate(item.href)}
                className="cursor-pointer gap-2 rounded-lg px-3 py-2"
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExport} disabled={isExporting} className="cursor-pointer gap-2 rounded-lg px-3 py-2">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              {isExporting ? 'Exportando...' : 'Exportar Excel'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  );
}
