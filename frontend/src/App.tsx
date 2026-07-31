import { lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

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

// ─── Páginas do dashboard — carregadas sob demanda ───────────────────────────
// Importadas com lazy() para não entrarem no bundle inicial: juntas passam de
// 200 KB de código-fonte, e o visitante que abre a tela de login não precisa de
// nenhuma delas. Cada rota vira um chunk separado, baixado ao ser acessada.

// Economia
const EconomiaPage = lazy(() => import('./pages/dashboard/economia/EconomiaPage'));
const SalarioPage  = lazy(() => import('./pages/dashboard/economia/SalarioPage'));
const PibPage      = lazy(() => import('./pages/dashboard/economia/PibPage'));
const ImpostosPage = lazy(() => import('./pages/dashboard/economia/ImpostosPage'));

// Mercado
const AcoesPage  = lazy(() => import('./pages/dashboard/mercado/AcoesPage'));
const MetaisPage = lazy(() => import('./pages/dashboard/mercado/MetaisPage'));

// Moedas
const CambioPage = lazy(() => import('./pages/dashboard/moedas/CambioPage'));
const CriptoPage = lazy(() => import('./pages/dashboard/moedas/CriptoPage'));

// Brasil
const IbgePage   = lazy(() => import('./pages/dashboard/brasil/IbgePage'));
const IpeaPage   = lazy(() => import('./pages/dashboard/brasil/IpeaPage'));
const BancosPage = lazy(() => import('./pages/dashboard/brasil/BancosPage'));

// Comércio
const ExportacoesPage = lazy(() => import('./pages/dashboard/comercio/exportacoes/ExportacoesPage'));
const CambioContratadoComercialPage = lazy(() => import('./pages/dashboard/comercio/cambioComercial/CambioComercialPage'));
const BalancaPage = lazy(() => import('./pages/dashboard/comercio/balancaPagamentos/BalancaPage'));

// Conta e Admin
const SettingsAuthPage = lazy(() => import('./pages/auth/SettingsAuthPage'));
const AdminUsersPage   = lazy(() => import('./pages/dashboard/admin/AdminUsersPage'));

import { AnimatePresence, MotionConfig } from 'motion/react';

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
            <Route path="economia/impostos" element={<ImpostosPage />} />
            <Route path="mercado/acoes"    element={<AcoesPage />} />
            <Route path="mercado/metais"   element={<MetaisPage />} />
            <Route path="moedas/cambio"    element={<CambioPage />} />
            <Route path="moedas/cripto"    element={<CriptoPage />} />
            <Route path="brasil/ibge"      element={<IbgePage />} />
            <Route path="brasil/ipea"      element={<IpeaPage />} />
            <Route path="brasil/bancos"    element={<BancosPage />} />
            <Route path="settings"         element={<SettingsAuthPage />} />
            <Route path="/dashboard/comercio/exportacoes" element={<ExportacoesPage />} />
            <Route path="/dashboard/comercio/cambioComercial" element={<CambioContratadoComercialPage />} />
            <Route path="/dashboard/comercio/balancaPagamentos" element={<BalancaPage />} />

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
  // reducedMotion="user" faz toda animação de `motion/react` respeitar a
  // preferência do sistema. As animações em CSS puro ficam atrás de um
  // @media em App.css — os dois mecanismos são independentes e ambos
  // precisam existir.
  return (
    <MotionConfig reducedMotion="user">
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
    </MotionConfig>
  );
}