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

      <BrandLogo variant="full" />

      <div className="flex flex-col gap-6 max-w-sm">
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