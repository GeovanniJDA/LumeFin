import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import Dashboard from './pages/dashboard';
import Bills from './pages/bills';
import Dependents from './pages/dependents';
import CreditCards from './pages/credit-cards';
import Transactions from './pages/transactions';
import Auth from './pages/auth';
import { AuthGuard } from './components/shared/auth-guard';
import { AppLayout } from './components/shared/app-layout';
import { Toaster } from '@/components/ui/sonner';

function AuthListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      } else if (event === 'SIGNED_IN') {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthListener />
      <Routes>
        <Route path="/auth" element={<Auth />} />

        <Route path="/" element={<AuthGuard><AppLayout><Dashboard /></AppLayout></AuthGuard>} />
        <Route path="/bills" element={<AuthGuard><AppLayout><Bills /></AppLayout></AuthGuard>} />
        <Route path="/dependents" element={<AuthGuard><AppLayout><Dependents /></AppLayout></AuthGuard>} />
        <Route path="/credit-cards" element={<AuthGuard><AppLayout><CreditCards /></AppLayout></AuthGuard>} />
        <Route path="/transactions" element={<AuthGuard><AppLayout><Transactions /></AppLayout></AuthGuard>} />
      </Routes>
      <Toaster position="bottom-right" richColors theme="dark" />
    </BrowserRouter>
  );
}

export default App;
