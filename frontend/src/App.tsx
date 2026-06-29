import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import SettingsAuthPage from './pages/auth/SettingsAuthPage';

// Layouts
import HeaderApp from './components/Header';
import DashboardLayout from './layouts/DashboardLayout';
import { PrivateRoute } from './components/PrivateRoute';
import { AdminRoute }   from './components/AdminRoute';

// Auth (standalone — split-screen)
import RegisterPage    from './pages/auth/RegisterPage';
import LoginPage       from './pages/auth/LoginPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

// Onboarding (com header)
import AddressPage from './pages/onboarding/AddressPage';
import BankPage    from './pages/onboarding/BankPage';

// Dashboard — Economia
import EconomiaPage from './pages/dashboard/economia/EconomiaPage';
import SalarioPage  from './pages/dashboard/economia/SalarioPage';
import PibPage      from './pages/dashboard/economia/PibPage';
import ImpostosPage from './pages/dashboard/economia/ImpostosPage'; // <-- Novo Import

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

// Dashboard — Comércio
import ExportacoesPage from './pages/dashboard/comercio/exportacoes/ExportacoesPage';

// Dashboard — Admin
import AdminUsersPage from './pages/dashboard/admin/AdminUsersPage';

import { AnimatePresence } from 'motion/react';

import './App.css';

// ─── Onboarding layout (header + fundo) ──────────────────────────────────────
function OnboardingLayout() {
  return (
    <div className="min-h-screen w-full bg-app flex flex-col overflow-x-hidden">
      <HeaderApp />
      <div className="flex-1 w-full flex justify-center items-start mt-20 p-4 py-8">
        <Routes>
          <Route path="/dados-endereco"  element={<AddressPage />} />
          <Route path="/dados-bancarios" element={<BankPage />} />
        </Routes>
      </div>
    </div>
  );
}

// ─── Componente de Rotas Animadas ────────────────────────────────────────────
function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* ── Dashboard (requer autenticação) ── */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="economia"         element={<EconomiaPage />} />
            <Route path="economia/salario" element={<SalarioPage />} />
            <Route path="economia/pib"     element={<PibPage />} />
            <Route path="economia/impostos" element={<ImpostosPage />} /> {/* <-- Nova Rota Inserida */}
            <Route path="mercado/acoes"    element={<AcoesPage />} />
            <Route path="mercado/metais"   element={<MetaisPage />} />
            <Route path="moedas/cambio"    element={<CambioPage />} />
            <Route path="moedas/cripto"    element={<CriptoPage />} />
            <Route path="brasil/ibge"      element={<IbgePage />} />
            <Route path="brasil/ipea"      element={<IpeaPage />} />
            <Route path="brasil/bancos"    element={<BancosPage />} />
            <Route path="settings"         element={<SettingsAuthPage />} />
            <Route path="/dashboard/comercio/exportacoes" element={<ExportacoesPage />} />

            <Route element={<AdminRoute />}>
              <Route path="admin/usuarios" element={<AdminUsersPage />} />
            </Route>
          </Route>
        </Route>

        {/* ── Auth — split-screen standalone ── */}
        <Route path="/"                 element={<RegisterPage />} />
        <Route path="/registro-usuario" element={<RegisterPage />} />
        <Route path="/login-usuario"    element={<LoginPage />} />
        <Route path="/verificar-email"  element={<VerifyEmailPage />} />

        {/* ── Onboarding (com header Brasil Panel) ── */}
        <Route path="/*" element={<OnboardingLayout />} />

      </Routes>
    </AnimatePresence>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────
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
      <AppRoutes /> 
    </BrowserRouter>
  );
}