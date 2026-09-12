/**
 * SharesOfTotalPanel.tsx — participação de cada categoria numa série TOTAL.
 *
 * Irmão do AggregatedTotalPanel, e a diferença é deliberada:
 *
 *   AggregatedTotalPanel  o todo é a SOMA das séries → uma barra empilhada,
 *                         porque as fatias particionam o todo e somam 100%.
 *   SharesOfTotalPanel    o todo é uma SÉRIE PRÓPRIA → uma barra POR categoria,
 *                         porque as partes podem se sobrepor e somar mais de
 *                         100% sem nenhuma estar errada.
 *
 * Empilhar aqui seria o erro: nas exportações, `Produtos Básicos` é eixo de
 * fator agregado e `Combustíveis` é grupo de produto — um barril de petróleo
 * pertence aos dois. Numa barra empilhada ele apareceria duas vezes e todas as
 * fatias sairiam encolhidas para caber em 100%.
 *
 * Por isso também não há total das participações em lugar nenhum da tela: seria
 * um número sem significado.
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import { PieChart } from 'lucide-react';
import { itemVariants } from '../../../constants/indicators/Motion';
import type { SharesOfTotal } from '../../../types/utilities/Economy';

export interface SharesOfTotalPanelProps {
  id?: string;
  title: string;
  subtitle: string;
  accent?: string;
  shares: SharesOfTotal | null;
  /** Mapa key → cor. Sem entrada, a barra usa o accent do painel. */
  accentsByKey?: Record<string, string>;
  /** Formatador dos valores absolutos (total e cada parte). */
  valueFormatter: (v: number) => string;
  /** Nome da série que serve de todo — aparece no rótulo do total. */
  totalLabel: string;
}

export const SharesOfTotalPanel = memo(function SharesOfTotalPanel({
  id,
  title,
  subtitle,
  accent = '#34d399',
  shares,
  accentsByKey,
  valueFormatter,
  totalLabel,
}: SharesOfTotalPanelProps) {
  return (
    <motion.div
      id={id}
      variants={itemVariants}
      className="group relative overflow-hidden rounded-2xl border border-white/10
                 bg-linear-to-br from-emerald-950/40 via-teal-950/20 to-slate-950/40
                 backdrop-blur-md p-6 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)] scroll-mt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl opacity-25 transition-opacity group-hover:opacity-40"
        style={{ background: accent }}
      />

      <div className="relative mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
            style={{ background: `${accent}1a`, color: accent }}
            aria-hidden
          >
            <PieChart size={18} />
          </span>
          <div>
            <h4 className="text-base font-semibold tracking-tight text-slate-100">{title}</h4>
            <p className="text-[11px] uppercase tracking-[0.18em] text-fg-dim">{subtitle}</p>
          </div>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: `${accent}1a`, color: accent }}
        >
          {shares ? `${shares.parts.length} categorias` : '—'}
        </span>
      </div>

      {!shares ? (
        <div className="flex h-32 items-center justify-center text-sm text-fg-dim">
          Sem dados no mês de referência.
        </div>
      ) : (
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <p className="text-metric font-bold" style={{ color: accent }}>
              {valueFormatter(shares.totalValue)}
            </p>
            <p className="text-slate-400 text-xs font-mono">
              {totalLabel} · {shares.referenceMonth.replace('-', '/')}
            </p>
          </div>

          {/* Uma barra por categoria. Cada uma vai de 0 ao total — a escala é a
              MESMA nas quatro, então o comprimento é comparável entre elas. */}
          <div className="flex flex-col gap-3">
            {shares.parts.map((p) => {
              const cor = accentsByKey?.[p.key] ?? accent;
              return (
                <div key={p.key} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span
                        aria-hidden
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: cor }}
                      />
                      {p.label}
                    </span>
                    <span className="flex items-baseline gap-2 font-mono">
                      <span className="text-fg-dim">{valueFormatter(p.value)}</span>
                      <span className="font-semibold text-slate-200">
                        {p.pct.toFixed(1)}%
                      </span>
                    </span>
                  </div>
                  {/* O trilho é o total; o preenchimento, a categoria.
                      `min` em 100 protege o desenho de uma série revisada que
                      passe do total — o número ao lado segue mostrando o real. */}
                  <div
                    className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-inset"
                    role="img"
                    aria-label={`${p.label}: ${p.pct.toFixed(1)}% do total`}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, p.pct))}%`,
                        backgroundColor: cor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Séries que não alcançaram o mês de referência. Aparecem porque o
              silêncio seria pior: sem esta linha, uma categoria sumida da lista
              pareceria valer zero. */}
          {shares.omitted.length > 0 && (
            <p className="text-[11px] leading-relaxed text-fg-dim">
              Fora do cálculo por não terem dado em{' '}
              {shares.referenceMonth.replace('-', '/')}:{' '}
              <span className="text-slate-400">{shares.omitted.join(', ')}</span>.
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
});
