import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { supabase } from '../../lib/supabase';
import { LayoutDashboard, Receipt, CreditCard, ArrowRightLeft, Users, LogOut, Loader2, UserCircle, ChevronsUpDown, Sun, Moon } from 'lucide-react';
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

const navigation = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Contas', href: '/app/bills', icon: Receipt },
  { name: 'Cartões', href: '/app/credit-cards', icon: CreditCard },
  { name: 'Transações', href: '/app/transactions', icon: ArrowRightLeft },
  { name: 'Dependentes', href: '/app/dependents', icon: Users },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { profile, fetch: fetchProfile } = useProfileStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme !== 'light';

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
        toast.success('Sessão encerrada.');
        navigate('/auth');
      }
    } catch {
      toast.error('Erro ao encerrar sessão.');
    } finally {
      setIsSigningOut(false);
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
        <div className="mx-auto min-h-dvh max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>

      <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 px-1 pb-[env(safe-area-inset-bottom)] md:hidden">
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
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md py-1 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${active ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
