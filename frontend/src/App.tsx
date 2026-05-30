import HeaderApp from "./components/Header";
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CircleDollarSign } from 'lucide-react';
import ExchangeInterface from "./components/Exchange";
import CriptosInterface from "./components/Criptos";
import Dashboard from "./components/Dashboard";
import RegisterPage from "./pages/auth/RegisterPage";
import LoginPage from "./pages/auth/LoginPage";
import AddressPage from "./pages/onboarding/AddressPage";
import BankPage from "./pages/onboarding/BankPage";

// bg-app
import './App.css'


function AppLayout() {
  const location = useLocation();
  const showMoneyIcon =
    location.pathname === '/registro-usuario' ||
    location.pathname === '/login-usuario' ||
    location.pathname === '/';

  return (
    <div className="min-h-screen w-full bg-app flex flex-col overflow-x-hidden">
      <HeaderApp />
      
      {showMoneyIcon && (
        <CircleDollarSign size={120} className="money-icon-bg fixed filter drop-shadow-lg money-animated
               left-3/4 top-1/2 -translate-x-1/2 -translate-y-1/5" />
      )}

      <div className="flex-1 w-full flex justify-center items-start mt-20 p-4 py-8">
        <Routes>
          <Route path="/"                   element={<RegisterPage />} />
          <Route path="/registro-usuario"  element={<RegisterPage />} />
          <Route path="/login-usuario"     element={<LoginPage />} />
          <Route path="/dados-endereco"    element={<AddressPage />} />
          <Route path="/dados-bancarios"   element={<BankPage />} />
          <Route path="/cotacao-criptomoedas" element={<CriptosInterface />} />
          <Route path="/cotacao-moedas"    element={<ExchangeInterface />} />
          <Route path="/dashboard"         element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="bottom-right" 
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            zIndex: 99999,
          },
          success: { duration: 4000 },
        }} 
      />
      <AppLayout />
    </BrowserRouter>
  );
}
