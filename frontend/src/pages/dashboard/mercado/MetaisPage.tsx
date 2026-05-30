// API: Metals.dev
// Endpoints consumidos:
//   GET /metals → useMetals()

import { LoaderCircle } from 'lucide-react';
import { useMetals } from '../../../hooks/UseMetals';

const METALS = [
  { key: 'gold',      label: 'Ouro',      emoji: '🥇' },
  { key: 'silver',    label: 'Prata',     emoji: '🥈' },
  { key: 'platinum',  label: 'Platina',   emoji: '⚪' },
  { key: 'palladium', label: 'Paládio',   emoji: '🔘' },
  { key: 'copper',    label: 'Cobre',     emoji: '🟤' },
  { key: 'aluminum',  label: 'Alumínio',  emoji: '🔩' },
  { key: 'nickel',    label: 'Níquel',    emoji: '⚙️'  },
  { key: 'zinc',      label: 'Zinco',     emoji: '🔳' },
] as const;

export default function MetaisPage() {
  const { data: metals, isLoading, error } = useMetals();

  const brl = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Metais Preciosos</h1>
        {metals && (
          <span className="text-slate-500 text-xs">
            Atualizado: {new Date(metals.lastUpdated).toLocaleString('pt-BR')}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <LoaderCircle size={16} className="animate-spin" /> Carregando cotações...
        </div>
      )}

      {error && (
        <span className="text-red-400 text-sm">Erro ao carregar cotações.</span>
      )}

      {metals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {METALS.map(({ key, label, emoji }) => (
            <div
              key={key}
              className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{emoji}</span>
                <span className="text-slate-400 text-sm">{label}</span>
              </div>
              <p className="text-white font-bold text-xl font-mono">
                {brl(metals[key])}
              </p>
              <p className="text-slate-600 text-xs">por troy oz</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}