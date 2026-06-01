import { Check } from 'lucide-react';
import { BrandLogo } from '../brand/BrandLogo';


const FEATURES = [
  'Indicadores do Banco Central (BCB)',
  'Cotações de ações e metais preciosos',
  'Câmbio, criptomoedas e PTAX',
  'Dados do IBGE, IPEA e lista de bancos',
];

/**
 * Painel esquerdo das páginas de autenticação (Register / Login).
 * Exibido apenas em telas lg+.
 */
export function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12
                    bg-slate-900 border-r border-slate-800">

      <BrandLogo variant="framed" className="hv-tricolor-glow" />

      <div className="flex flex-col gap-6 max-w-sm">
        <div className="flex gap-4 items-start">
          {/* barra vertical tricolor */}
          <svg width="6" height="120" viewBox="0 0 6 120" fill="none"
               className="shrink-0 mt-1 vertical-icon" aria-hidden="true">
            <rect x="0" y="0"  width="6" height="40" rx="3" fill="#10b981"/>
            <rect x="0" y="40" width="6" height="40"        fill="#3b82f6"/>
            <rect x="0" y="80" width="6" height="40" rx="3" fill="#f59e0b"/>
          </svg>

          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Dados econômicos do{' '}
              <span className="text-amber-400">Brasil</span>{' '}
              em um só lugar.
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Indicadores oficiais, cotações ao vivo e séries históricas
              reunidos em um painel limpo e rápido.
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-3 mt-2">
          {FEATURES.map(f => (
            <li key={f} className="flex items-center gap-3 text-slate-300 text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center
                               justify-center shrink-0">
                <Check size={11} className="text-emerald-400" />
              </span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-slate-700 text-xs">
        Brasil Panel © {new Date().getFullYear()} — Dados em tempo real
      </p>
    </div>
  );
}