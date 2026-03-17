import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LayoutDashboard, Receipt, CreditCard, ArrowRightLeft, Users, LogOut } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Contas', href: '/bills', icon: Receipt },
  { name: 'Cartões', href: '/credit-cards', icon: CreditCard },
  { name: 'Transações', href: '/transactions', icon: ArrowRightLeft },
  { name: 'Dependentes', href: '/dependents', icon: Users },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user.email ?? null);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-[#000000] font-quicksand pb-16 md:pb-0 md:flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 z-10 glass border-r border-[rgba(255,255,255,0.06)]" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }}>
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
          {userEmail && (
            <div className="mb-4 px-2">
              <p className="text-xs font-semibold text-[rgba(255,255,255,0.4)] uppercase tracking-wider mb-1">Conectado como</p>
              <p className="text-sm font-medium text-[rgba(255,255,255,0.8)] truncate" title={userEmail}>
                {userEmail}
              </p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-[rgba(239,68,68,0.1)] rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
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
