import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CircleDollarSign } from 'lucide-react';

// Layouts
import HeaderApp from './components/Header';
import DashboardLayout from './layouts/DashboardLayout';

// Auth & Onboarding
import RegisterPage  from './pages/auth/RegisterPage';
import LoginPage     from './pages/auth/LoginPage';
import AddressPage   from './pages/onboarding/AddressPage';
import BankPage      from './pages/onboarding/BankPage';

// Dashboard — Economia
import EconomiaPage from './pages/dashboard/economia/EconomiaPage';
import SalarioPage  from './pages/dashboard/economia/SalarioPage';
import PibPage      from './pages/dashboard/economia/PibPage';

// Dashboard — Mercado
import AcoesPage  from './pages/dashboard/mercado/AcoesPage';
import MetaisPage from './pages/dashboard/mercado/MetaisPage';

// Dashboard — Moedas
import CambioPage from './pages/dashboard/moedas/CambioPage';
import CriptoPage from './pages/dashboard/moedas/CriptoPage';

// Dashboard — Brasil
import IbgePage   from './pages/dashboard/brasil/IbgePage';
import IpeaPage   from './pages/dashboard/brasil/IpeaPage';
import BancosPage from './pages/dashboard/brasil/BancosPage';

import './App.css';

// ─── Layout para rotas de auth / onboarding ──────────────────────────────────

function AuthLayout() {
  const location = useLocation();
  const showMoneyIcon =
    location.pathname === '/' ||
    location.pathname === '/registro-usuario';

  return (
    <div className="min-h-screen w-full bg-app flex flex-col overflow-x-hidden">
      <HeaderApp />

      {showMoneyIcon && (
        <CircleDollarSign
          size={120}
          className="money-icon-bg fixed filter drop-shadow-lg money-animated
                     left-3/4 top-1/2 -translate-x-1/2 -translate-y-1/5"
        />
      )}

      <div className="flex-1 w-full flex justify-center items-start mt-20 p-4 py-8">
        <Routes>
          <Route path="/"                  element={<RegisterPage />} />
          <Route path="/registro-usuario"  element={<RegisterPage />} />
          <Route path="/dados-endereco"    element={<AddressPage />} />
          <Route path="/dados-bancarios"   element={<BankPage />} />
        </Routes>
      </div>
    </div>
  );
}

// ─── App root ────────────────────────────────────────────────────────────────

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

      <Routes>

        {/* ── Dashboard (com sidebar) ── */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route path="economia"         element={<EconomiaPage />} />
          <Route path="economia/salario" element={<SalarioPage />} />
          <Route path="economia/pib"     element={<PibPage />} />
          <Route path="mercado/acoes"    element={<AcoesPage />} />
          <Route path="mercado/metais"   element={<MetaisPage />} />
          <Route path="moedas/cambio"    element={<CambioPage />} />
          <Route path="moedas/cripto"    element={<CriptoPage />} />
          <Route path="brasil/ibge"      element={<IbgePage />} />
          <Route path="brasil/ipea"      element={<IpeaPage />} />
          <Route path="brasil/bancos"    element={<BancosPage />} />
        </Route>

        {/* ── Login — layout próprio (split screen) ── */}
        <Route path="/login-usuario" element={<LoginPage />} />

        {/* ── Onboarding (header + fundo) ── */}
        <Route path="/*" element={<AuthLayout />} />

      </Routes>
    </BrowserRouter>
  );
}
