import { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  TrendingUp, BarChart2, Settings, DollarSign, Map, ChevronDown, ChevronRight,
  Activity, Wallet, Globe, Bitcoin, Coins, Users, Building2, LogOut,
  ShieldCheck, PanelLeftClose, PanelLeftOpen, Receipt, // <-- Importado o Receipt aqui
} from 'lucide-react';
import { BrandLogo } from '../components/brand/BrandLogo';
import { getTokenEmail, isAdmin } from '../lib/auth/jwt';

const NAV = [
  {
    group: 'Economia', icon: TrendingUp,
    items: [
      { label: 'Indicadores',  path: '/dashboard/economia',          icon: Activity  },
      { label: 'Salário Mínimo', path: '/dashboard/economia/salario', icon: Wallet    },
      { label: 'PIB Brasil',     path: '/dashboard/economia/pib',     icon: Globe     },
      { label: 'Impostos',       path: '/dashboard/economia/impostos',icon: Receipt   }, // <-- Rota nova adicionada
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
  '/dashboard/economia':          'Indicadores Econômicos',
  '/dashboard/economia/salario': 'Salário Mínimo',
  '/dashboard/economia/pib':      'PIB Brasil',
  '/dashboard/economia/impostos': 'Carga Tributária', // <-- Título da nova página
  '/dashboard/mercado/acoes':     'Ações',
  '/dashboard/mercado/metais':   'Metais Preciosos',
  '/dashboard/moedas/cambio':    'Câmbio',
  '/dashboard/moedas/cripto':    'Criptomoedas',
  '/dashboard/brasil/ibge':      'IBGE — Municípios',
  '/dashboard/brasil/ipea':      'IPEA — Séries',
  '/dashboard/brasil/bancos':    'Bancos',
  '/dashboard/admin/usuarios':   'Admin — Usuários',
  '/dashboard/settings':         'Configurações',
};

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150',
    isActive
      ? 'bg-yellow-500/10 text-yellow-400 font-medium'
      : 'text-slate-400 hover:text-white hover:bg-slate-800/70',
  ].join(' ');

const isMobile = () => window.innerWidth < 768;

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobile());
  const [open, setOpen] = useState<Record<string, boolean>>({
    Admin: true, Economia: true, Mercado: true, Moedas: true, Brasil: true,
  });

  const toggle = (group: string) =>
    setOpen(prev => ({ ...prev, [group]: !prev[group] }));

  const userEmail = useMemo(getTokenEmail, []);
  const admin     = useMemo(isAdmin, []);
  const initials  = userEmail[0]?.toUpperCase() ?? 'U';
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Brasil Panel';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login-usuario');
  };

  const closeSidebarOnMobile = () => {
    if (isMobile()) setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="h-14 shrink-0 bg-slate-900 border-b border-slate-800
                         flex items-center justify-between px-5 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            title={sidebarOpen ? 'Ocultar menu' : 'Mostrar menu'}
            className="text-slate-400 hover:text-yellow-400 transition-colors cursor-pointer"
          >
            {sidebarOpen
              ? <PanelLeftClose size={18} />
              : <PanelLeftOpen  size={18} />
            }
          </button>
          <BrandLogo variant="sidebar" />
        </div>

        <span className="hidden md:block text-slate-500 text-xs font-medium tracking-wide">
          {pageTitle}
        </span>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-white text-xs font-medium leading-tight">
              {userEmail.split('@')[0]}
            </span>
            <span className="text-slate-500 text-[10px] leading-tight">{userEmail}</span>
          </div>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center
                          text-slate-950 text-xs font-bold shrink-0">
            {initials}
          </div>

          {/* Settings */}
          <button
            onClick={() => navigate('/dashboard/settings')}
            title="Configurações"
            className={`flex items-center gap-1.5 transition-colors text-xs cursor-pointer
              ${location.pathname === '/dashboard/settings'
                ? 'text-amber-400'
                : 'text-slate-500 hover:text-amber-400'
              }`}
          >
            <Settings size={15} />
            <span className="hidden sm:inline">Config</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Sair"
            className="flex items-center gap-1.5 text-slate-500 hover:text-rose-400
                       transition-colors text-xs cursor-pointer"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* ── Corpo ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Backdrop mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={[
            'flex flex-col overflow-y-auto overflow-x-hidden',
            'transition-all duration-300 ease-in-out',
            'layout-dashboard-aside border-r border-slate-800',
            'fixed md:relative top-[56px] md:top-0 bottom-0 z-20',
            sidebarOpen ? 'w-60' : 'w-0 border-r-0',
          ].join(' ')}
        >
          <div className={`transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            <nav className="flex-1 p-3 flex flex-col gap-0.5 pt-4 w-60">

              {/* Admin */}
              {admin && (
                <div className="mb-1">
                  <button
                    onClick={() => toggle(ADMIN_NAV.group)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                               text-amber-400 hover:bg-amber-500/10 transition-all
                               text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  >
                    <ADMIN_NAV.icon size={13} className="shrink-0" />
                    <span className="flex-1 text-left">{ADMIN_NAV.group}</span>
                    {open[ADMIN_NAV.group]
                      ? <ChevronDown  size={13} className="text-amber-600" />
                      : <ChevronRight size={13} className="text-amber-600" />
                    }
                  </button>
                  {open[ADMIN_NAV.group] && (
                    <div className="ml-3 mt-0.5 pl-3 border-l border-amber-500/20 flex flex-col gap-0.5">
                      {ADMIN_NAV.items.map(({ label, path, icon: ItemIcon }) => (
                        <NavLink
                          key={path} to={path} end className={linkClass}
                          onClick={closeSidebarOnMobile}
                        >
                          <ItemIcon size={13} className="shrink-0" />
                          {label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Grupos */}
              {NAV.map(({ group, icon: GroupIcon, items }) => (
                <div key={group} className="mb-1">
                  <button
                    onClick={() => toggle(group)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                               text-slate-300 hover:bg-slate-800/70 transition-all
                               text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  >
                    <GroupIcon size={13} className="text-amber-400 shrink-0" />
                    <span className="flex-1 text-left">{group}</span>
                    {open[group]
                      ? <ChevronDown  size={13} className="text-slate-600" />
                      : <ChevronRight size={13} className="text-slate-600" />
                    }
                  </button>
                  {open[group] && (
                    <div className="ml-3 mt-0.5 pl-3 border-l border-slate-800 flex flex-col gap-0.5">
                      {items.map(({ label, path, icon: ItemIcon }) => (
                        <NavLink
                          key={path} to={path} end className={linkClass}
                          onClick={closeSidebarOnMobile}
                        >
                          <ItemIcon size={13} className="shrink-0" />
                          {label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="px-4 py-3 border-t border-slate-800 text-[10px] text-slate-700 w-60">
              Brasil Panel © {new Date().getFullYear()}
            </div>
          </div>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 p-6 overflow-y-auto w-full">
          <Outlet />
        </main>

      </div>
    </div>
  );
}