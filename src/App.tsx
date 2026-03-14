import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/dashboard';
import Bills from './pages/bills';
import Dependents from './pages/dependents';
import CreditCards from './pages/credit-cards';
import Transactions from './pages/transactions';
import Auth from './pages/auth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/dependents" element={<Dependents />} />
        <Route path="/credit-cards" element={<CreditCards />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
