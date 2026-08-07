import { useMemo, useState, useEffect, Suspense } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  TrendingUp, BarChart2, Settings, DollarSign, Map, ChevronDown, ChevronRight,
  Activity, Wallet, Globe, Bitcoin, Coins, Users, Building2, LogOut, LoaderCircle, Info, X,
  ShieldCheck, PanelLeftClose, PanelLeftOpen, Receipt, Ship, Banknote, Landmark
} from 'lucide-react';
import { BrandLogo } from '../components/brand/BrandLogo';
import { clearSession, getTokenEmail, isAdmin } from '../lib/auth/jwt';
import { authService } from '../api/services/Auth';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useResponsiveValue } from '../hooks/UseResponsiveValue';

const NAV = [
  {
    group: 'Economia', icon: TrendingUp,
    items: [
      { label: 'Indicadores',   path: '/dashboard/economia',          icon: Activity  },
      { label: 'Salário Mínimo', path: '/dashboard/economia/salario', icon: Wallet    },
      { label: 'PIB Brasil',     path: '/dashboard/economia/pib',     icon: Globe     },
      { label: 'Impostos',       path: '/dashboard/economia/impostos',icon: Receipt   },
    ],
  },
  {
  group: 'Comércio Exterior', icon: Ship,
  items: [
    { label: 'Exportações',         path: '/dashboard/comercio/exportacoes',         icon: Ship },
    { label: 'Câmbio Contratado',   path: '/dashboard/comercio/cambioComercial',     icon: Banknote },
    { label: 'Balança de Pagamentos', path: '/dashboard/comercio/balancaPagamentos', icon: Landmark },
  ],
},
  {
    group: 'Mercado', icon: BarChart2,
    items: [
      { label: 'Ações',  path: '/dashboard/mercado/acoes',  icon: BarChart2 },
      { label: 'Metais', path: '/dashboard/mercado/metais', icon: Coins     },
    ],
  },
  {
    group: 'Moedas', icon: DollarSign,
    items: [
      { label: 'Câmbio',       path: '/dashboard/moedas/cambio', icon: DollarSign },
      { label: 'Criptomoedas', path: '/dashboard/moedas/cripto', icon: Bitcoin    },
    ],
  },
  {
    group: 'Brasil', icon: Map,
    items: [
      { label: 'IBGE',   path: '/dashboard/brasil/ibge',   icon: Map       },
      { label: 'IPEA',   path: '/dashboard/brasil/ipea',   icon: Users     },
      { label: 'Bancos', path: '/dashboard/brasil/bancos', icon: Building2 },
    ],
  },
] as const;

const ADMIN_NAV = {
  group: 'Admin', icon: ShieldCheck,
  items: [
    { label: 'Usuários', path: '/dashboard/admin/usuarios', icon: Users },
  ],
} as const;

const PAGE_TITLES: Record<string, string> = {
  '/dashboard/economia':           'Indicadores Econômicos',
  '/dashboard/economia/salario':   'Salário Mínimo',
  '/dashboard/economia/pib':       'PIB Brasil',
  '/dashboard/economia/impostos':  'Carga Tributária',
  '/dashboard/comercio/exportacoes': 'Exportações Brasileiras',
  '/dashboard/comercio/cambio-comercial': 'Câmbio Contratado',
  '/dashboard/mercado/acoes':      'Ações',
  '/dashboard/mercado/metais':     'Metais Preciosos',
  '/dashboard/moedas/cambio':      'Câmbio',
  '/dashboard/moedas/cripto':      'Criptomoedas',
  '/dashboard/brasil/ibge':        'IBGE — Municípios',
  '/dashboard/brasil/ipea':        'IPEA — Séries',
  '/dashboard/brasil/bancos':      'Bancos',
  '/dashboard/admin/usuarios':     'Admin — Usuários',
  '/dashboard/settings':           'Configurações',
};

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150',
    // 34px de altura no desktop (densidade preservada) → 44px no toque.
    'coarse:min-h-11',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60',
    isActive
      ? 'bg-yellow-500/10 text-yellow-400 font-medium'
      : 'text-slate-400 hover:text-white hover:bg-slate-800/70',
  ].join(' ');

/**
 * Largura a partir da qual a sidebar deixa de ser overlay e passa a ocupar
 * espaço no fluxo (docked). Alinhado ao breakpoint `lg` do tema.
 *
 * Era 768 (`md`), e essa era a pior quebra do layout: a partir de 768px a
 * sidebar de 280px entrava no fluxo já aberta, e a área de conteúdo caía de
 * 608px (em 640px de janela) para 440px — encolhia justamente ao crescer a
 * janela. Com 1024 sobram 720px e o conteúdo só cresce de um breakpoint para
 * o seguinte.
 */
const DOCKED_MIN_WIDTH = 1024;

/** Leitura pontual da janela. Para uso reativo, ver `isDocked` no componente. */
const isDockedViewport = () => window.innerWidth >= DOCKED_MIN_WIDTH;

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Reativo ao resize: antes o layout lia window.innerWidth só no evento, e
  // redimensionar a janela com a sidebar aberta deixava a trava de scroll do
  // body presa (o efeito abaixo não reexecutava). Agora `isDocked` muda com a
  // janela e reavalia tudo que depende do modo.
  const isDocked = useResponsiveValue(isDockedViewport);

  const [sidebarOpen, setSidebarOpen] = useState(isDockedViewport);
  const [open, setOpen] = useState<Record<string, boolean>>({
    Admin: true, Economia: true, 'Comércio Exterior': true, Mercado: true, Moedas: true, Brasil: true,
  });

  // Trava o scroll do body enquanto a sidebar estiver aberta em modo overlay.
  // O cleanup destrava ao desmontar — sem ele, sair do dashboard com o drawer
  // aberto deixaria a página inteira sem scroll.
  useEffect(() => {
    const shouldLockScroll = !isDocked && sidebarOpen;
    document.body.style.overflow = shouldLockScroll ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen, isDocked]);

  const toggle = (group: string) =>
    setOpen(prev => ({ ...prev, [group]: !prev[group] }));

  const userEmail = useMemo(() => getTokenEmail(), []);
  const admin     = useMemo(() => isAdmin(), []);
  const initials  = userEmail[0]?.toUpperCase() ?? 'U';
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Brasil Panel';

  const handleLogout = async () => {
    // O cookie é httpOnly: só o backend consegue apagá-lo. Se a chamada falhar
    // (rede fora, sessão já expirada), limpamos o hint local mesmo assim.
    try {
      await authService.logout();
    } catch {
      // ignorado de propósito — o logout local não pode depender da rede
    }
    clearSession();
    navigate('/login-usuario');
  };

  // Renomeado de `closeSidebarOnMobile`: o gatilho passou a ser "está em modo
  // overlay?", que agora inclui tablets até 1023px — o nome antigo descreveria
  // errado o comportamento.
  const closeSidebarOnOverlay = () => {
    if (!isDocked) setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-dashboard">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      {/* px-gutter (era px-5) alinha o padding do header ao do <main>, de modo
          que a logo passa a ficar na mesma coluna do conteúdo. */}
      <header className="h-14 shrink-0 header-dashboard border-b border-slate-800
                         flex items-center justify-between gap-2 px-gutter z-40 lg:z-60 backdrop-blur-sm sticky top-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden">
          {/* `p-2 -m-2` amplia a área de clique de 18px para 34px com
              deslocamento de layout ZERO — a margem negativa cancela o
              crescimento da caixa. `coarse:` leva a 44px só em telas de toque,
              preservando a densidade do desktop. */}
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label={sidebarOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
            aria-expanded={sidebarOpen}
            aria-controls="sidebar-nav"
            className="inline-flex items-center justify-center p-2 -m-2 rounded-control
                       text-slate-400 hover:text-yellow-400 transition-colors cursor-pointer
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60
                       coarse:min-h-11 coarse:min-w-11"
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <BrandLogo variant="sidebar" />
        </div>

        <span className="hidden md:block text-slate-500 text-xs font-medium tracking-wide">
          {pageTitle}
        </span>

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-white text-xs font-medium leading-tight">{userEmail.split('@')[0]}</span>
            <span className="text-slate-500 text-[10px] leading-tight">{userEmail}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 text-xs font-bold shrink-0">
            {initials}
          </div>
          <button
            onClick={() => navigate('/dashboard/settings')}
            aria-label="Configurações da conta"
            className="inline-flex items-center justify-center p-2 -m-2 rounded-control
                       text-slate-500 hover:text-amber-400 transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60
                       coarse:min-h-11 coarse:min-w-11"
          >
            <Settings size={15} />
          </button>
          <button
            onClick={handleLogout}
            aria-label="Sair da conta"
            className="inline-flex items-center justify-center p-2 -m-2 rounded-control
                       text-slate-500 hover:text-rose-400 transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60
                       coarse:min-h-11 coarse:min-w-11"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* ── Corpo ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Backdrop do modo overlay — agora até lg (era md), acompanhando a
            sidebar. Z-45 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-45 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — overlay até 1023px, docked a partir de lg (1024px).

            `top-0`, e não `top-14`. O offset existia para não cobrir o botão
            do header que fecha o drawer, mas essa proteção nunca funcionou: o
            backdrop é z-45 e o header é z-40, então o backdrop já intercepta
            o clique naquele ponto. Verificado com elementFromPoint sobre a
            posição do botão — quem responde é o backdrop, não o botão.

            O offset custava 56px de altura útil (de 702 disponíveis, a lista
            de 775px ficava com 646) sem entregar o acesso que o justificava.
            Com top-0 o drawer ocupa a tela inteira, como se espera de um
            drawer modal, e a saída passa a morar dentro dele. */}
        <aside
          id="sidebar-nav"
          inert={!sidebarOpen}
          aria-hidden={!sidebarOpen}
          className={[
            'flex flex-col overflow-y-auto overflow-x-hidden aside-bg',
            'transition-all duration-300 ease-in-out',
            'border-r border-slate-800',
            'fixed lg:relative top-0 bottom-0 z-50',
            sidebarOpen ? 'w-[280px]' : 'w-0 border-r-0',
          ].join(' ')}
        >
          <div className={`w-[280px] transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>

            {/* Fechar — só no modo overlay. Em altura cheia o drawer cobre o
                botão do header, então ele carrega a própria saída. Antes o
                único jeito de fechar era tocar no backdrop, o que não é
                descoberto por quem navega por teclado nem anunciado por
                leitor de tela. Em lg a sidebar é fixa e não fecha. */}
            <div className="lg:hidden flex justify-end px-3 pt-3">
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label="Fechar menu lateral"
                className="inline-flex items-center justify-center p-2 rounded-control
                           text-slate-400 hover:text-yellow-400 transition-colors cursor-pointer
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60
                           coarse:min-h-11 coarse:min-w-11"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 p-3 flex flex-col gap-0.5 pt-4">
              {/* Seção Admin */}
              {admin && (
                <div className="mb-1">
                  <button
                    onClick={() => toggle(ADMIN_NAV.group)}
                    aria-expanded={open[ADMIN_NAV.group]}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-control text-amber-400 text-xs font-semibold uppercase tracking-wider cursor-pointer
                               coarse:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
                  >
                    <ADMIN_NAV.icon size={13} />
                    <span className="flex-1 text-left">{ADMIN_NAV.group}</span>
                    {open[ADMIN_NAV.group] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                  {open[ADMIN_NAV.group] && (
                    <div className="ml-3 pl-3 border-l border-amber-500/20">
                      {ADMIN_NAV.items.map((item) => (
                        <NavLink key={item.path} to={item.path} end className={linkClass} onClick={closeSidebarOnOverlay}>
                          <item.icon size={13} /> {item.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Grupos de Navegação */}
              {NAV.map(({ group, icon: GroupIcon, items }) => (
                <div key={group} className="mb-1">
                  <button
                    onClick={() => toggle(group)}
                    aria-expanded={open[group]}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-control text-slate-300 text-xs font-semibold uppercase tracking-wider cursor-pointer
                               coarse:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
                  >
                    <GroupIcon size={13} className="text-amber-400" />
                    <span className="flex-1 text-left">{group}</span>
                    {open[group] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                  {open[group] && (
                    <div className="ml-3 pl-3 border-l border-slate-800">
                      {items.map((item) => (
                        <NavLink key={item.path} to={item.path} end className={linkClass} onClick={closeSidebarOnOverlay}>
                          <item.icon size={13} /> {item.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Institucional — item solto, separado dos grupos por uma
                  linha: não é uma seção de dados, é sobre o próprio site.
                  Aponta para /sobre e não para "/", porque a raiz devolve
                  quem está logado ao painel (PublicOnly). */}
              <div className="mt-2 pt-2 border-t border-slate-800">
                <NavLink to="/sobre" end className={linkClass} onClick={closeSidebarOnOverlay}>
                  <Info size={13} /> Sobre
                </NavLink>
              </div>
            </nav>
          </div>
        </aside>

        {/* Conteúdo principal — overflow-y-auto garante scroll independente.
            `min-w-0` é a peça central contra o overflow horizontal: sem ele um
            filho de flex se recusa a encolher abaixo da largura do próprio
            conteúdo, e o excesso vazava para ser cortado pelo overflow-hidden
            da linha acima (transbordo invisível, sem scrollbar).
            `@container/main` publica a largura real do conteúdo para que os
            componentes respondam ao espaço que ocupam, e não ao viewport — que
            aqui mente em 280px por causa da sidebar. */}
        <main className="flex-1 min-w-0 p-gutter overflow-y-auto w-full relative z-0 @container/main">
          {/* As páginas são carregadas sob demanda (lazy). O Suspense fica aqui,
              e não acima do layout, para que a sidebar e o header permaneçam na
              tela enquanto o chunk da página é baixado.

              O ErrorBoundary vem por fora: se o chunk falhar ao baixar, ou se a
              página quebrar no render, o Suspense sozinho não captura nada e o
              usuário veria uma tela em branco. */}
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-24 text-slate-500">
                  <LoaderCircle className="animate-spin" size={28} />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}