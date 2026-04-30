import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { supabase, setupAuthListener } from './lib/supabase';

const Landing = lazy(() => import('./pages/landing'));
const Dashboard = lazy(() => import('./pages/dashboard'));
const Bills = lazy(() => import('./pages/bills'));
const Dependents = lazy(() => import('./pages/dependents'));
const CreditCards = lazy(() => import('./pages/credit-cards'));
const Transactions = lazy(() => import('./pages/transactions'));
const Auth = lazy(() => import('./pages/auth'));
const Profile = lazy(() => import('./pages/profile'));
import { AuthGuard } from './components/shared/auth-guard';
import { AppLayout } from './components/shared/app-layout';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useProfileStore } from '@/store/profile-store';

window.addEventListener('focus', async () => {
  const store = useProfileStore.getState()
  if (store.avatarStoragePath && store.profile?.id) {
    await store.refreshAvatarUrl(store.avatarStoragePath)
  }
})

function AuthListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = setupAuthListener(navigate);
    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
}

function InactivityListener() {
  useEffect(() => {
    const INACTIVITY_LIMIT = 30 * 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await supabase.auth.signOut();
        toast.warning('Sessão encerrada por inactividade.');
      }, INACTIVITY_LIMIT);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, []);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthListener />
      <InactivityListener />
      <Suspense fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          <Route path="/app" element={<AuthGuard><AppLayout><Dashboard /></AppLayout></AuthGuard>} />
          <Route path="/app/bills" element={<AuthGuard><AppLayout><Bills /></AppLayout></AuthGuard>} />
          <Route path="/app/dependents" element={<AuthGuard><AppLayout><Dependents /></AppLayout></AuthGuard>} />
          <Route path="/app/credit-cards" element={<AuthGuard><AppLayout><CreditCards /></AppLayout></AuthGuard>} />
          <Route path="/app/transactions" element={<AuthGuard><AppLayout><Transactions /></AppLayout></AuthGuard>} />
          <Route path="/app/profile" element={<AuthGuard><AppLayout><Profile /></AppLayout></AuthGuard>} />
        </Routes>
      </Suspense>
      <Toaster position="bottom-right" richColors theme="dark" />
    </BrowserRouter>
  );
}

export default App;
