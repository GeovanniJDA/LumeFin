import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LayoutDashboard, Receipt, CreditCard, ArrowRightLeft, Users, LogOut, Loader2, UserCircle, ChevronsUpDown } from 'lucide-react';
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

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Contas', href: '/bills', icon: Receipt },
  { name: 'Cartões', href: '/credit-cards', icon: CreditCard },
  { name: 'Transações', href: '/transactions', icon: ArrowRightLeft },
  { name: 'Dependentes', href: '/dependents', icon: Users },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { profile, fetch: fetchProfile } = useProfileStore();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user.email ?? null);
      if (session?.user.id) {
        fetchProfile(session.user.id);
      }
    });
  }, []);

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
        toast.success('Sessão encerrada.');
        navigate('/auth');
      }
    } catch (err: any) {
      toast.error('Erro ao encerrar sessão.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-black font-quicksand pb-16 md:pb-0 md:flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 z-10 glass border-r border-[rgba(255,255,255,0.06)] overflow-visible" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="p-6">
          <h1 className="text-3xl font-extrabold text-blue-500">Finfolk</h1>
        </div>

        <div className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
                  ${isActive
                    ? 'bg-[rgba(255,255,255,0.08)] text-white border-l-2 border-blue-500'
                    : 'text-[rgba(255,255,255,0.5)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgba(255,255,255,0.8)]'}`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-500' : 'text-[rgba(255,255,255,0.4)]'}`} />
                {item.name}
              </NavLink>
            );
          })}
        </div>

        <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div
                className="w-full flex items-center gap-3 p-3 rounded-xl
                  border border-white/8 bg-white/4
                  hover:bg-white/8 hover:border-white/12
                  backdrop-blur-sm transition-all duration-200
                  group cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="avatar"
                      className="w-9 h-9 rounded-full object-cover
                        ring-2 ring-white/10 group-hover:ring-white/20
                        transition-all duration-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600/20
                      border border-blue-500/30 flex items-center justify-center
                      ring-2 ring-white/10 group-hover:ring-white/20
                      transition-all duration-200">
                      <span className="text-blue-400 text-sm font-bold">
                        {(profile?.username || userEmail || '?')
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Online indicator */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5
                    bg-green-500 rounded-full border-2 border-black" />
                </div>

                {/* Name + email */}
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm font-semibold text-white/90 truncate
                    group-hover:text-white transition-colors">
                    {profile?.username || 'Utilizador'}
                  </p>
                  <p className="text-xs text-white/40 truncate
                    group-hover:text-white/60 transition-colors">
                    {userEmail}
                  </p>
                </div>

                {/* Chevron */}
                <ChevronsUpDown className="w-4 h-4 text-white/30
                  group-hover:text-white/60 transition-colors shrink-0" />
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align="start"
              sideOffset={8}
              // @ts-ignore
              avoidCollisions={true}
              // @ts-ignore
              collisionPadding={16}
              className="w-56 bg-zinc-900/95 border border-white/10
                backdrop-blur-xl shadow-2xl shadow-black/50 rounded-xl p-1 z-50"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="text-sm font-semibold text-white/90">
                    {profile?.username || 'Utilizador'}
                  </p>
                  <p className="text-xs text-white/40 truncate">{userEmail}</p>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-white/8 my-1" />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg
                    text-white/70 hover:text-white hover:bg-white/8
                    cursor-pointer transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-white/8 my-1" />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg
                    text-red-400 hover:text-red-300 hover:bg-red-500/10
                    cursor-pointer transition-colors"
                >
                  {isSigningOut
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <LogOut className="w-4 h-4" />
                  }
                  <span>{isSigningOut ? 'Saindo...' : 'Sair'}</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-64">
        <div className="p-4 md:p-8 max-w-7xl mx-auto h-full space-y-6">
          {children}
        </div>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full flex justify-around p-2 z-50 rounded-t-xl glass" style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)' }}>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-[64px] transition-all
                ${isActive
                  ? 'text-blue-500'
                  : 'text-[rgba(255,255,255,0.4)] hover:text-[rgba(255,255,255,0.6)]'}`}
            >
              <item.icon className="h-5 w-5 mb-1" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
