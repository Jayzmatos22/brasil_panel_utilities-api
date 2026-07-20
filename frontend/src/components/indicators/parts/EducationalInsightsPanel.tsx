/**
 * EducationalInsightsPanel.tsx — painel de insights com disclaimer.
 *
 * É um componente "burro" — não gera observações, apenas exibe as que recebe.
 * A geração dinâmica (com thresholds e sazonalidade) vive nas páginas,
 * porque é específica de cada domínio (impostos têm regras diferentes
 * do Ibovespa).
 *
 * Disclaimer fixo no rodapé — texto sempre presente, não configurável.
 */

import { memo } from "react";
import { motion } from "motion/react";
import { GraduationCap, AlertTriangle } from "lucide-react";
import { itemVariants } from "../../../constants/indicators/Motion";

export interface InsightKPI {
  label: string;
  value: string;
  tone: "pos" | "neg" | "neutral";
}

export interface EducationalInsightsPanelProps {
  id?: string;
  /** Frases dinâmicas geradas pela página. */
  observations: string[];
  /** KPIs exibidos no grid superior (4 colunas em desktop). */
  insights: InsightKPI[];
  /** Cor de destaque (default: indigo). */
  accent?: string;
}

// KPI individual — cor do valor depende do tone.
const InsightItem = memo(({ label, value, tone }: InsightKPI) => {
  const toneCls =
    tone === "pos"
      ? "text-emerald-300"
      : tone === "neg"
        ? "text-red-300"
        : "text-slate-200";
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-white/5 bg-white/2 px-3 py-2">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className={`font-mono text-sm font-semibold ${toneCls}`}>
        {value}
      </span>
    </div>
  );
});

export const EducationalInsightsPanel = memo(function EducationalInsightsPanel({
  id,
  observations,
  insights,
  accent = "#c084fc",
}: EducationalInsightsPanelProps) {
  return (
    <motion.div
      id={id}
      variants={itemVariants}
      className="relative overflow-hidden rounded-2xl border border-white/10
                 bg-linear-to-br from-indigo-950/40 via-violet-950/20 to-slate-950/40
                 backdrop-blur-md p-6 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)] scroll-mt-24"
    >
      <div className="mb-5 flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/10"
          style={{ color: accent }}
        >
          <GraduationCap size={16} aria-hidden />
        </span>
        <div>
          <h4 className="text-base font-semibold tracking-tight text-slate-100">
            Insights Educacionais
          </h4>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Leitura dinâmica dos dados · sem recomendação
          </p>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {insights.map((it) => (
            <InsightItem key={it.label} {...it} />
          ))}
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {observations.map((o, idx) => (
          <li
            key={idx}
            className="flex gap-3 text-sm leading-relaxed text-slate-300"
          >
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: accent }}
              aria-hidden
            />
            <span>{o}</span>
          </li>
        ))}
      </ul>

      {/* Disclaimer fixo — conteúdo educacional, nunca financeiro. */}
      <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <AlertTriangle
          size={16}
          className="mt-0.5 shrink-0 text-amber-400"
          aria-hidden
        />
        <p className="text-xs leading-relaxed text-amber-200/80">
          <strong className="font-semibold text-amber-200">
            Aviso educacional:
          </strong>{" "}
          o conteúdo acima é estritamente didático, derivado da leitura visual
          da série, e
          <strong> não constitui recomendação de investimento</strong>. Não há
          análise fundamentalista, projeção ou orientação de alocação. Decisões
          financeiras são de responsabilidade individual e exigem profissional
          certificado.
        </p>
      </div>
    </motion.div>
  );
});
