import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import Dashboard from './pages/dashboard';
import Bills from './pages/bills';
import Dependents from './pages/dependents';
import CreditCards from './pages/credit-cards';
import Transactions from './pages/transactions';
import Auth from './pages/auth';
import Profile from './pages/profile';
import { AuthGuard } from './components/shared/auth-guard';
import { AppLayout } from './components/shared/app-layout';
import { Toaster } from '@/components/ui/sonner';
import { useBillStoreRaw } from './store/bill-store';
import { useDependentStoreRaw } from './store/dependent-store';
import { useCreditCardStoreRaw } from './store/credit-card-store';
import { useTransactionStoreRaw } from './store/transaction-store';
import { useCategoryStoreRaw } from './store/category-store';
import { toast } from 'sonner';

function AuthListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        useBillStoreRaw.getState().reset();
        useDependentStoreRaw.getState().reset();
        useCreditCardStoreRaw.getState().reset();
        useTransactionStoreRaw.getState().reset();
        useCategoryStoreRaw.getState().reset();
        navigate('/auth');
      } else if (event === 'SIGNED_IN') {
        navigate('/');
      }
    });

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
      <Routes>
        <Route path="/auth" element={<Auth />} />

        <Route path="/" element={<AuthGuard><AppLayout><Dashboard /></AppLayout></AuthGuard>} />
        <Route path="/bills" element={<AuthGuard><AppLayout><Bills /></AppLayout></AuthGuard>} />
        <Route path="/dependents" element={<AuthGuard><AppLayout><Dependents /></AppLayout></AuthGuard>} />
        <Route path="/credit-cards" element={<AuthGuard><AppLayout><CreditCards /></AppLayout></AuthGuard>} />
        <Route path="/transactions" element={<AuthGuard><AppLayout><Transactions /></AppLayout></AuthGuard>} />
        <Route path="/profile" element={<AuthGuard><AppLayout><Profile /></AppLayout></AuthGuard>} />
      </Routes>
      <Toaster position="bottom-right" richColors theme="dark" />
    </BrowserRouter>
  );
}

export default App;
