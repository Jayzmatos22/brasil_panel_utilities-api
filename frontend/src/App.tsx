import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import HeaderApp from './components/Header';
import DashboardLayout from './layouts/DashboardLayout';
import { PrivateRoute } from './components/PrivateRoute';
import { AdminRoute }   from './components/AdminRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PublicOnly }    from './components/PublicOnly';

// Auth (standalone — split-screen)
import RegisterPage    from './pages/auth/RegisterPage';
import LoginPage       from './pages/auth/LoginPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

// Onboarding (com header)
import PerfilPage from './pages/onboarding/PerfilPage';

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

// Institucional — pública, fora do DashboardLayout
const AboutPage = lazy(() => import('./pages/About'));

// 404 — lazy pelo mesmo motivo das demais: a arte e o lockup animado não
// precisam entrar no bundle que serve quem digitou o endereço certo.
const NotFoundPage = lazy(() => import('./pages/errors/NotFoundPage'));

// Elemento único servido por "/" e "/sobre". O par ErrorBoundary+Suspense é
// local porque o único boundary do app vive dentro do DashboardLayout, e
// estas rotas são lazy sem passar por ele.
const aboutElement = (
  <ErrorBoundary>
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <AboutPage />
    </Suspense>
  </ErrorBoundary>
);

import { AnimatePresence, MotionConfig } from 'motion/react';

import './App.css';

// ─── Onboarding layout (header + fundo) ──────────────────────────────────────
function OnboardingLayout() {
  return (
    // bg-smoke-abyss, e não `bg-app`: esta rota chamava uma classe que não
    // existe mais em lugar nenhum do CSS — o nome ficou, a regra sumiu, e a
    // tela passou a mostrar o branco do documento. `.bg-smoke-abyss` (App.css)
    // é o mesmo fundo do DashboardLayout e da landing.
    //
    // overflow-x-clip no lugar de -hidden por dois motivos: `hidden` força o
    // outro eixo a `auto` e criaria um contexto de rolagem extra, e `clip` não
    // arrisca decepar o ::before fixo do fundo.
    //
    // pt-16 reserva a altura do HeaderApp, que é `absolute` e portanto não
    // ocupa espaço no fluxo. Antes isso era um `mt-20` no filho — 80px para um
    // header de 64px, com o respiro embutido no mesmo número.
    <div className="min-h-screen w-full bg-smoke-abyss flex flex-col overflow-x-clip pt-16">
      <HeaderApp />
      <div className="flex-1 w-full flex justify-center items-start px-gutter py-section">
        {/* Suspense porque o 404 passou a ser lazy. Sem ele o React lança ao
            suspender — a PerfilPage é import estático e nunca precisou de um.
            O ErrorBoundary vem por fora pelo mesmo motivo do DashboardLayout:
            se o chunk falhar ao baixar, o Suspense sozinho não captura nada e
            a pessoa veria uma tela branca no lugar do erro. */}
        <ErrorBoundary>
          <Suspense fallback={<div className="min-h-64" />}>
            <Routes>
              <Route path="/dados-perfil" element={<PerfilPage />} />
              {/* Fora do onboarding, qualquer caminho desconhecido é um 404 de
                  verdade. Antes o catch-all abaixo renderizava este layout
                  vazio para qualquer URL inexistente. */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
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

            {/* Curinga do painel. Sem ele, /dashboard/qualquer-coisa casava com
                a rota pai e renderizava o DashboardLayout com o <Outlet> vazio:
                sidebar e header montados, área de conteúdo em branco. O
                catch-all lá embaixo nunca era alcançado, porque este ramo já
                tinha casado.

                Dentro do painel, e não redirecionando para fora: quem errou o
                endereço continua com a sidebar ao lado para se achar. */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>

        {/* ── Auth — split-screen standalone ── */}
        {/* A raiz é a landing institucional, não mais o cadastro: o visitante
            frio precisa saber o que é o Brasil Panel antes de ver formulário.
            PublicOnly manda quem já tem sessão direto para o painel. */}
        <Route path="/" element={<PublicOnly>{aboutElement}</PublicOnly>} />

        {/* Sob PublicOnly: quem já tem sessão (inclusive aberta em outra aba)
            não deve cair num formulário de cadastro ou login. O guard usa
            retrato da montagem, então não atrapalha o próprio LoginPage
            depois que ele grava a sessão. */}
        <Route
          path="/registro-usuario"
          element={<PublicOnly><RegisterPage /></PublicOnly>}
        />
        <Route
          path="/login-usuario"
          element={<PublicOnly><LoginPage /></PublicOnly>}
        />

        {/* /verificar-email fica FORA do guard: o usuário chega nela já com
            cadastro feito e precisa concluir a verificação. */}
        <Route path="/verificar-email"  element={<VerifyEmailPage />} />

        {/* ── Institucional ──
            /sobre NÃO passa pelo PublicOnly: é o destino do link "Sobre" da
            sidebar e precisa continuar acessível a quem está logado. Só a
            raiz manda quem já tem sessão para o painel.

            Ambas precisam vir ANTES do catch-all abaixo, senão caem no
            OnboardingLayout. */}
        <Route path="/sobre" element={aboutElement} />

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