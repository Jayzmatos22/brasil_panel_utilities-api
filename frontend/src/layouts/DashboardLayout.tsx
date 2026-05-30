import { useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  TrendingUp,
  BarChart2,
  DollarSign,
  Map,
  ChevronDown,
  ChevronRight,
  Activity,
  Wallet,
  Globe,
  Bitcoin,
  Coins,
  Users,
  Building2,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { BrandLogo } from '../components/brand/BrandLogo';

// ─── Navegação ────────────────────────────────────────────────────────────────

const NAV = [
  {
    group: 'Economia',
    icon: TrendingUp,
    items: [
      { label: 'Indicadores',    path: '/dashboard/economia',         icon: Activity  },
      { label: 'Salário Mínimo', path: '/dashboard/economia/salario', icon: Wallet    },
      { label: 'PIB Brasil',     path: '/dashboard/economia/pib',     icon: Globe     },
    ],
  },
  {
    group: 'Mercado',
    icon: BarChart2,
    items: [
      { label: 'Ações',  path: '/dashboard/mercado/acoes',  icon: BarChart2 },
      { label: 'Metais', path: '/dashboard/mercado/metais', icon: Coins     },
    ],
  },
  {
    group: 'Moedas',
    icon: DollarSign,
    items: [
      { label: 'Câmbio',        path: '/dashboard/moedas/cambio', icon: DollarSign },
      { label: 'Criptomoedas',  path: '/dashboard/moedas/cripto', icon: Bitcoin    },
    ],
  },
  {
    group: 'Brasil',
    icon: Map,
    items: [
      { label: 'IBGE',   path: '/dashboard/brasil/ibge',   icon: Map       },
      { label: 'IPEA',   path: '/dashboard/brasil/ipea',   icon: Users     },
      { label: 'Bancos', path: '/dashboard/brasil/bancos', icon: Building2 },
    ],
  },
] as const;

// Mapeia path → título legível para o header
const PAGE_TITLES: Record<string, string> = {
  '/dashboard/economia':         'Indicadores Econômicos',
  '/dashboard/economia/salario': 'Salário Mínimo',
  '/dashboard/economia/pib':     'PIB Brasil',
  '/dashboard/mercado/acoes':    'Ações',
  '/dashboard/mercado/metais':   'Metais Preciosos',
  '/dashboard/moedas/cambio':    'Câmbio',
  '/dashboard/moedas/cripto':    'Criptomoedas',
  '/dashboard/brasil/ibge':      'IBGE — Municípios',
  '/dashboard/brasil/ipea':      'IPEA — Séries',
  '/dashboard/brasil/bancos':    'Bancos',
};

// ─── Helper: decodifica JWT e retorna o subject (email/username) ──────────────
function getJwtSub(): string {
  try {
    const token = localStorage.getItem('token');
    if (!token) return 'Usuário';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub ?? payload.email ?? 'Usuário';
  } catch {
    return 'Usuário';
  }
}

// ─── Estilo dos links ativos ──────────────────────────────────────────────────
const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150',
    isActive
      ? 'bg-yellow-500/10 text-yellow-400 font-medium'
      : 'text-slate-400 hover:text-white hover:bg-slate-800/70',
  ].join(' ');

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState<Record<string, boolean>>({
    Economia: true,
    Mercado:  true,
    Moedas:   true,
    Brasil:   true,
  });

  const toggle = (group: string) =>
    setOpen(prev => ({ ...prev, [group]: !prev[group] }));

  // Dados do usuário logado (decodificados do JWT)
  const userEmail = useMemo(getJwtSub, []);
  const initials  = userEmail[0]?.toUpperCase() ?? 'U';
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Brasil Panel';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login-usuario');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">

      {/* ── Header full-width ─────────────────────────────────────────────── */}
      <header className="h-14 shrink-0 bg-slate-900 border-b border-slate-800
                         flex items-center justify-between px-5 z-20">

        {/* Logo */}
        <BrandLogo textSize="text-sm" iconSize={22} />

        {/* Título da página atual */}
        <span className="hidden md:block text-slate-500 text-xs font-medium tracking-wide">
          {pageTitle}
        </span>

        {/* Usuário + logout */}
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

      {/* ── Corpo: sidebar + conteúdo ─────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-60 shrink-0 bg-slate-900 border-r border-slate-800
                          flex flex-col overflow-y-auto">

          <nav className="flex-1 p-3 flex flex-col gap-0.5 pt-4">
            {NAV.map(({ group, icon: GroupIcon, items }) => (
              <div key={group} className="mb-1">

                {/* Cabeçalho do grupo */}
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

                {/* Itens */}
                {open[group] && (
                  <div className="ml-3 mt-0.5 pl-3 border-l border-slate-800 flex flex-col gap-0.5">
                    {items.map(({ label, path, icon: ItemIcon }) => (
                      <NavLink key={path} to={path} end className={linkClass}>
                        <ItemIcon size={13} className="shrink-0" />
                        {label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Rodapé */}
          <div className="px-4 py-3 border-t border-slate-800 text-[10px] text-slate-700">
            Brasil Panel © {new Date().getFullYear()}
          </div>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}