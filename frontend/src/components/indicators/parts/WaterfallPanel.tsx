/**
 * WaterfallPanel.tsx — decomposição de um saldo em contribuições.
 *
 * Terceiro dos painéis de participação, e o único que aceita valor negativo:
 *
 *   AggregatedTotalPanel  todo = soma das séries    → barra empilhada
 *   SharesOfTotalPanel    todo = série própria      → uma barra por parte
 *   WaterfallPanel        saldo = soma algébrica    → cascata
 *
 * Existe porque na Balança de Pagamentos as séries são SALDOS. Uma barra
 * empilhada exigiria porcentagens, e porcentagem sobre valores de sinais
 * opostos não significa nada — a balança comercial é superavitária enquanto
 * transações correntes é deficitária, e o contraste entre as duas é justamente
 * a informação.
 *
 * Na cascata o sinal deixa de ser problema e vira o assunto: cada barra parte de
 * onde a anterior terminou, positiva empurra para a direita, negativa para a
 * esquerda, e o acumulado final é o saldo.
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import { GitCommitHorizontal } from 'lucide-react';
import { itemVariants } from '../../../constants/indicators/Motion';
import type { WaterfallBreakdown } from '../../../types/utilities/Economy';

export interface WaterfallPanelProps {
  id?: string;
  title: string;
  subtitle: string;
  accent?: string;
  breakdown: WaterfallBreakdown | null;
  valueFormatter: (v: number) => string;
  /** Cor das contribuições positivas / negativas. */
  positiveColor?: string;
  negativeColor?: string;
}

/** Converte um valor da escala de dados para % da largura do trilho. */
const posPct = (v: number, min: number, max: number): number => {
  const span = max - min;
  if (span <= 0) return 0;
  return ((v - min) / span) * 100;
};

export const WaterfallPanel = memo(function WaterfallPanel({
  id,
  title,
  subtitle,
  accent = '#fbbf24',
  breakdown,
  valueFormatter,
  positiveColor = '#34d399',
  negativeColor = '#fb7185',
}: WaterfallPanelProps) {
  return (
    <motion.div
      id={id}
      variants={itemVariants}
      className="group relative overflow-hidden rounded-2xl border border-white/10
                 bg-linear-to-br from-amber-950/30 via-slate-950/30 to-slate-950/40
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
            <GitCommitHorizontal size={18} />
          </span>
          <div>
            <h4 className="text-base font-semibold tracking-tight text-slate-100">{title}</h4>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{subtitle}</p>
          </div>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: `${accent}1a`, color: accent }}
        >
          {breakdown ? `${breakdown.steps.length} passos` : '—'}
        </span>
      </div>

      {!breakdown ? (
        <div className="flex h-32 items-center justify-center text-sm text-slate-500">
          Sem dados no mês de referência.
        </div>
      ) : (
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <p
              className="text-metric font-bold"
              style={{ color: breakdown.totalValue >= 0 ? positiveColor : negativeColor }}
            >
              {valueFormatter(breakdown.totalValue)}
            </p>
            <p className="text-slate-400 text-xs font-mono">
              {breakdown.totalLabel} · {breakdown.referenceMonth.replace('-', '/')}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {breakdown.steps.map((st) => {
              const de = posPct(Math.min(st.start, st.end), breakdown.min, breakdown.max);
              const ate = posPct(Math.max(st.start, st.end), breakdown.min, breakdown.max);
              const positivo = st.value >= 0;
              const cor = positivo ? positiveColor : negativeColor;
              return (
                <div key={st.key} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span
                        aria-hidden
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: cor }}
                      />
                      {st.label}
                      {/* O resíduo não é medido, é diferença — e quem lê precisa
                          saber disso para não tratá-lo como série do IPEA. */}
                      {st.isResidual && (
                        <span className="text-[10px] uppercase tracking-wider text-slate-600">
                          por diferença
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-semibold" style={{ color: cor }}>
                      {positivo ? '+' : ''}
                      {valueFormatter(st.value)}
                    </span>
                  </div>
                  {/* Trilho = escala inteira, do mínimo ao máximo acumulado.
                      A barra ocupa só o trecho entre o antes e o depois. */}
                  <div
                    className="relative h-2.5 w-full overflow-hidden rounded-full border border-white/10 bg-inset"
                    role="img"
                    aria-label={`${st.label}: ${positivo ? 'contribui' : 'reduz'} ${valueFormatter(Math.abs(st.value))}`}
                  >
                    <div
                      className="absolute inset-y-0 rounded-full transition-[left,width] duration-500"
                      style={{
                        left: `${de}%`,
                        width: `${Math.max(ate - de, 0.6)}%`,
                        backgroundColor: cor,
                        opacity: st.isResidual ? 0.55 : 1,
                      }}
                    />
                    {/* Marca do zero: sem ela não dá para ver de que lado do
                        equilíbrio cada acumulado está. */}
                    <div
                      aria-hidden
                      className="absolute inset-y-0 w-px bg-white/25"
                      style={{ left: `${posPct(0, breakdown.min, breakdown.max)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {breakdown.omitted.length > 0 && (
            <p className="text-[11px] leading-relaxed text-slate-500">
              Sem dado em {breakdown.referenceMonth.replace('-', '/')}:{' '}
              <span className="text-slate-400">{breakdown.omitted.join(', ')}</span>. Por
              isso a diferença até o saldo não é exibida — ela absorveria estas séries.
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
});
