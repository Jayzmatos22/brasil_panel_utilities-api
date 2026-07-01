import { useMemo, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  TrendingUp, BarChart2, Settings, DollarSign, Map, ChevronDown, ChevronRight,
  Activity, Wallet, Globe, Bitcoin, Coins, Users, Building2, LogOut,
  ShieldCheck, PanelLeftClose, PanelLeftOpen, Receipt, Ship, Banknote
} from 'lucide-react';
import { BrandLogo } from '../components/brand/BrandLogo';
import { getTokenEmail, isAdmin } from '../lib/auth/jwt';

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
      { label: 'Exportações', path: '/dashboard/comercio/exportacoes', icon: Ship },
      { label: 'Câmbio',       path: '/dashboard/moedas/cambioComercial',       icon: Banknote },
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
    Admin: true, Economia: true, 'Comércio Exterior': true, Mercado: true, Moedas: true, Brasil: true,
  });

  // FIX: Travar o scroll do body quando a sidebar mobile estiver aberta
  useEffect(() => {
    if (isMobile() && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [sidebarOpen]);

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
                         flex items-center justify-between px-5 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="text-slate-400 hover:text-yellow-400 transition-colors cursor-pointer"
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <BrandLogo variant="sidebar" />
        </div>

        <span className="hidden md:block text-slate-500 text-xs font-medium tracking-wide">
          {pageTitle}
        </span>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-white text-xs font-medium leading-tight">{userEmail.split('@')[0]}</span>
            <span className="text-slate-500 text-[10px] leading-tight">{userEmail}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 text-xs font-bold shrink-0">
            {initials}
          </div>
          <button onClick={() => navigate('/dashboard/settings')} className="text-slate-500 hover:text-amber-400 transition-colors"><Settings size={15} /></button>
          <button onClick={handleLogout} className="text-slate-500 hover:text-rose-400 transition-colors"><LogOut size={15} /></button>
        </div>
      </header>

      {/* ── Corpo ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Backdrop mobile - Z-45 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-45 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Z-50 e Largura Mobile 280px */}
        <aside
          className={[
            'flex flex-col overflow-y-auto overflow-x-hidden aside-bg',
            'transition-all duration-300 ease-in-out',
            'border-r border-slate-800',
            'fixed md:relative top-0 md:top-0 bottom-0 z-50',
            sidebarOpen ? 'w-[280px]' : 'w-0 border-r-0',
          ].join(' ')}
        >
          <div className={`w-[280px] transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            <nav className="flex-1 p-3 flex flex-col gap-0.5 pt-4">
              {/* Seção Admin */}
              {admin && (
                <div className="mb-1">
                  <button onClick={() => toggle(ADMIN_NAV.group)} className="w-full flex items-center gap-2 px-3 py-2 text-amber-400 text-xs font-semibold uppercase tracking-wider cursor-pointer">
                    <ADMIN_NAV.icon size={13} />
                    <span className="flex-1 text-left">{ADMIN_NAV.group}</span>
                    {open[ADMIN_NAV.group] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                  {open[ADMIN_NAV.group] && (
                    <div className="ml-3 pl-3 border-l border-amber-500/20">
                      {ADMIN_NAV.items.map((item) => (
                        <NavLink key={item.path} to={item.path} end className={linkClass} onClick={closeSidebarOnMobile}>
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
                  <button onClick={() => toggle(group)} className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 text-xs font-semibold uppercase tracking-wider cursor-pointer">
                    <GroupIcon size={13} className="text-amber-400" />
                    <span className="flex-1 text-left">{group}</span>
                    {open[group] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                  {open[group] && (
                    <div className="ml-3 pl-3 border-l border-slate-800">
                      {items.map((item) => (
                        <NavLink key={item.path} to={item.path} end className={linkClass} onClick={closeSidebarOnMobile}>
                          <item.icon size={13} /> {item.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Conteúdo principal - overflow-y-auto garante scroll independente */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full relative z-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}