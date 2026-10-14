import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';

const Landing = lazy(() => import('./pages/landing'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const Bills = lazy(() => import('./pages/bills'));
const Dependents = lazy(() => import('./pages/dependents'));
const CreditCards = lazy(() => import('./pages/credit-cards'));
const CreditCardDetail = lazy(() => import('./pages/credit-card-detail'));
const Transactions = lazy(() => import('./pages/transactions'));
const CashFlow = lazy(() => import('./pages/cash-flow'));
const DueDates = lazy(() => import('./pages/due-dates'));
const EmergencyFund = lazy(() => import('./pages/emergency-fund'));
const Auth = lazy(() => import('./pages/auth'));
const Profile = lazy(() => import('./pages/profile'));
const ForgotPassword = lazy(() => import('./pages/forgot-password'));
const ResetPassword = lazy(() => import('./pages/reset-password'));
// Fora do caminho crítico das rotas públicas: só carregam ao entrar em /app.
// ponytail: se outra rota privada passar a existir fora de /app, reavaliar.
const AuthGuard = lazy(() =>
  import('./components/shared/auth-guard').then((module) => ({ default: module.AuthGuard })),
);
const AppLayout = lazy(() =>
  import('./components/shared/app-layout').then((module) => ({ default: module.AppLayout })),
);
const Toaster = lazy(() =>
  import('@/components/ui/sonner').then((module) => ({ default: module.Toaster })),
);
import { ThemeProvider } from 'next-themes';

// Sonner guarda os toasts ativos e os reemite quando o Toaster assina, então ele
// pode montar depois do `load` sem perder avisos disparados antes disso.
function AfterLoad({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(() => document.readyState === 'complete');

  useEffect(() => {
    if (ready) return;
    const onLoad = () => setReady(true);
    window.addEventListener('load', onLoad, { once: true });
    return () => window.removeEventListener('load', onLoad);
  }, [ready]);

  return ready ? <>{children}</> : null;
}

// Sessão (auth, inactividade, avatar) fica fora do bundle inicial: nada disso é
// necessário para a primeira pintura, então o Supabase e os stores entram na
// primeira interação, ao voltar de um link de recuperação/confirmação
// (`#access_token`) ou, no mais tardar, 5 s depois do `load`. Um visitante que só
// lê a rota pública não baixa o stack de auth enquanto o LCP acontece.
const SESSION_FALLBACK_MS = 5000;

function hasAuthCallback() {
  return /access_token=|error_description=|type=(recovery|signup|magiclink|invite)/.test(
    window.location.hash,
  );
}

function SessionTasks() {
  const navigate = useNavigate();

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let fallbackId: number | undefined;
    let cancelled = false;
    let started = false;

    const start = () => {
      if (started || cancelled) return;
      started = true;
      removeTriggers();
      if (fallbackId !== undefined) window.clearTimeout(fallbackId);
      void import('./lib/app-session').then(({ startSessionTasks }) => {
        if (cancelled) return;
        cleanup = startSessionTasks(navigate);
      });
    };

    const triggers: [string, EventListener][] = [
      ['pointerdown', start],
      ['keydown', start],
      ['touchstart', start],
    ];
    const removeTriggers = () =>
      triggers.forEach(([event, handler]) => window.removeEventListener(event, handler));
    triggers.forEach(([event, handler]) => window.addEventListener(event, handler, { passive: true }));

    if (hasAuthCallback()) start();
    else fallbackId = window.setTimeout(start, SESSION_FALLBACK_MS);

    return () => {
      cancelled = true;
      removeTriggers();
      if (fallbackId !== undefined) window.clearTimeout(fallbackId);
      cleanup?.();
    };
  }, [navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <SessionTasks />
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <Suspense fallback={
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

          <Route path="/app" element={<AuthGuard><AppLayout><Dashboard /></AppLayout></AuthGuard>} />
          <Route path="/app/bills" element={<AuthGuard><AppLayout><Bills /></AppLayout></AuthGuard>} />
          <Route path="/app/dependents" element={<AuthGuard><AppLayout><Dependents /></AppLayout></AuthGuard>} />
          <Route path="/app/credit-cards" element={<AuthGuard><AppLayout><CreditCards /></AppLayout></AuthGuard>} />
          <Route path="/app/credit-cards/:id" element={<AuthGuard><AppLayout><CreditCardDetail /></AppLayout></AuthGuard>} />
          <Route path="/app/transactions" element={<AuthGuard><AppLayout><Transactions /></AppLayout></AuthGuard>} />
          <Route path="/app/cash-flow" element={<AuthGuard><AppLayout><CashFlow /></AppLayout></AuthGuard>} />
          <Route path="/app/due-dates" element={<AuthGuard><AppLayout><DueDates /></AppLayout></AuthGuard>} />
          <Route path="/app/emergency-fund" element={<AuthGuard><AppLayout><EmergencyFund /></AppLayout></AuthGuard>} />
          <Route path="/app/profile" element={<AuthGuard><AppLayout><Profile /></AppLayout></AuthGuard>} />
        </Routes>
      </Suspense>
      <AfterLoad>
        <Suspense fallback={null}>
          <Toaster position="bottom-right" richColors />
        </Suspense>
      </AfterLoad>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
