// API: IPEA — Impostos (Imp. Importação, IRPF, IRPJ, IR Total, IOF, IPI)
import { memo, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Activity, Sparkles, Filter, Layers } from "lucide-react";

import {
  useImportTax,
  usePersonalIncomeTax,
  useCorporateIncomeTax,
  useTotalIncomeTax,
  useIofTax,
  useIpiTax,
} from "../../../hooks/UseIpea";

import {
  containerVariants,
  itemVariants,
  IndicatorCard,
  DataRow,
  ChartPanel,
  ChartGridPanel,
  RecentClosingsTable,
  PeriodExplorer,
  EducationalInsightsPanel,
  AggregatedTotalPanel,
  QuickNav,
  fmtPctSigned, fmtBRLTax, 
  fmtBRDate, MONTHS_PT,
  computeMetrics,
  computeLatestSummary,
  computeAggregatedTotal,
  describeAmplitude,
  describeVolatility,
  describeLast5Trend,
} from "../../../components/indicators/Indicators";

import type { IpeaSerie } from "../../../types/IpeaType";
import type {
  SeasonalityInsight,
  ComparativoGridProps,
  TaxHookResult,
} from "../../../types/utilities/Economy";

// Formatação de tela baseado no dispositivo
import { useResponsiveValue } from '../../../components/indicators/parts/Atoms'
import { getResponsiveGridCols, GRID_COLS_CLASS } from '../../../constants/indicators/Formatters'

// 1. Dados estáticos dos tributos (array + derivados)
import {
  TAX_SPECS,
  ACCENTS_BY_KEY,
  NAV_ITEMS_TAXES,
  type TaxSpec,
} from "../../../constants/taxes/TaxSpecs";

// 2. Mapa de ícones (JSX) — resolve iconKey → <Icon size={...} />
import { renderTaxIcon } from "../../../constants/taxes/TaxIcons";

// 3. Regras de sazonalidade por tributo
import { SEASONALITY } from "../../../constants/taxes/TaxSeasonality";

// ─── Helpers locais (lógica específica da página) ─────────────────────────

/** Média móvel de 3 períodos — usada pelo insight do IPI. */
const compute3MAvg = (values: number[]): number | null => {
  if (values.length < 3) return null;
  const last3 = values.slice(-3);
  return last3.reduce((s, v) => s + v, 0) / 3;
};

/**
 * Gera observações dinâmicas para um imposto, baseadas em thresholds
 * + regras sazonais específicas por tipo de tributo.
 */
const buildTaxObservations = (
  spec: TaxSpec,
  data: IpeaSerie[] | undefined,
): {
  observations: string[];
  insights: { label: string; value: string; tone: "pos" | "neg" | "neutral" }[];
} => {
  const metrics = computeMetrics(data);
  const latest = computeLatestSummary(data);
  if (!metrics || !latest) return { observations: [], insights: [] };

  const observations: string[] = [];
  const insights: {
    label: string;
    value: string;
    tone: "pos" | "neg" | "neutral";
  }[] = [];

  // ── KPIs do painel de insights
  insights.push({
    label: "Variação M/M",
    value: latest.variationMM === null ? "—" : fmtPctSigned(latest.variationMM),
    tone:
      latest.variationMM === null
        ? "neutral"
        : latest.variationMM >= 0
          ? "pos"
          : "neg",
  });
  insights.push({
    label: "Variação YoY",
    value:
      latest.variationYoY === null ? "—" : fmtPctSigned(latest.variationYoY),
    tone:
      latest.variationYoY === null
        ? "neutral"
        : latest.variationYoY >= 0
          ? "pos"
          : "neg",
  });
  insights.push({
    label: "Variação 6 meses",
    value:
      metrics.sixMonthReturn === null
        ? "—"
        : fmtPctSigned(metrics.sixMonthReturn),
    tone:
      metrics.sixMonthReturn === null
        ? "neutral"
        : metrics.sixMonthReturn >= 0
          ? "pos"
          : "neg",
  });
  insights.push({
    label: "Vol. média 6m",
    value:
      metrics.avgDailyAbsVar6m === null
        ? "—"
        : `${metrics.avgDailyAbsVar6m.toFixed(2)}%`,
    tone: "neutral",
  });

  // ── Obs 1: valor + variações M/M e YoY com thresholds
  const lastVal = fmtBRLTax(latest.value);
  observations.push(
    `Arrecadação mais recente de ${spec.shortName}: ${lastVal} (referência ${fmtBRDate(latest.date)}).` +
      (latest.variationMM !== null
        ? ` Frente ao mês imediatamente anterior, variação de ${fmtPctSigned(latest.variationMM)}` +
          (latest.variationMM >= 10
            ? " (forte alta mensal)"
            : latest.variationMM >= 2
              ? " (alta mensal consistente)"
              : latest.variationMM > -2
                ? " (estável no mês)"
                : latest.variationMM > -10
                  ? " (queda mensal moderada)"
                  : " (forte queda mensal)")
        : "") +
      (latest.variationYoY !== null
        ? `; frente ao mesmo mês do ano anterior, variação de ${fmtPctSigned(latest.variationYoY)}` +
          (latest.variationYoY >= 10
            ? " (aceleração estrutural de arrecadação)"
            : latest.variationYoY >= 0
              ? " (crescimento em ritmo moderado)"
              : latest.variationYoY > -10
                ? " (recuo moderado na base anual)"
                : " (recuo acentuado na base anual)")
        : "") +
      ".",
  );

  // ── Obs 2: janela 6 meses
  if (metrics.sixMonthReturn !== null) {
    const r = metrics.sixMonthReturn;
    let desc: string;
    if (r >= 20)
      desc = `forte alta de curto prazo, acumulando ${fmtPctSigned(r)} nos últimos 6 meses`;
    else if (r >= 5)
      desc = `fase ascendente consistente, com ${fmtPctSigned(r)} nos últimos 6 meses`;
    else if (r >= 0.5)
      desc = `leve viés de alta no curto prazo, acumulando ${fmtPctSigned(r)} nos últimos 6 meses`;
    else if (r > -0.5)
      desc = `mercado lateralizado nos últimos 6 meses, com variação líquida de ${fmtPctSigned(r)}`;
    else if (r > -5)
      desc = `leve viés de baixa no curto prazo, acumulando ${fmtPctSigned(r)} nos últimos 6 meses`;
    else if (r > -20)
      desc = `fase descendente consistente, com ${fmtPctSigned(r)} nos últimos 6 meses`;
    else
      desc = `forte queda de curto prazo, acumulando ${fmtPctSigned(r)} nos últimos 6 meses`;
    observations.push(`Nos últimos 6 meses, ${desc}.`);
  }

  // ── Obs 3: amplitude 5 anos
  if (metrics.fiveYearHigh && metrics.fiveYearLow) {
    observations.push(
      `${describeAmplitude(metrics.fiveYearHigh, metrics.fiveYearLow, fmtBRLTax)}, evidenciando os ciclos de arrecadação do tributo.`,
    );
  }

  // ── Obs 4: volatilidade
  if (metrics.avgDailyAbsVar6m !== null) {
    observations.push(
      `${describeVolatility(metrics.avgDailyAbsVar6m, metrics.positiveDays6m, metrics.negativeDays6m)}.`,
    );
  }

  // ── Obs 5: tendência últimos 5 pontos
  if (metrics.last5Trend !== null && metrics.last5NetPct !== null) {
    observations.push(
      `${describeLast5Trend(metrics.last5Trend, metrics.last5NetPct)}.`,
    );
  }

  // ── Obs 6: regra específica por imposto (sazonalidade ou correlação macro)
  const monthIdx = parseInt(latest.date.substring(5, 7), 10) - 1;
  const monthName = MONTHS_PT[monthIdx] ?? "mês atual";

  const seasonal: SeasonalityInsight[] | undefined = SEASONALITY[spec.key];
  if (seasonal && seasonal.length > 0) {
    const matched = seasonal.find((s) => s.monthIdx === monthIdx);
    const next =
      seasonal.find((s) => s.monthIdx > monthIdx) ??
      seasonal.find((s) => s.monthIdx < monthIdx);
    if (matched) {
      observations.push(
        `O mês corrente (${monthName}) é um mês tipicamente de pico para ${spec.shortName} — ${matched.reason}. Esta leitura visual confirma o padrão sazonal historicamente observado.`,
      );
    } else if (next) {
      const nextName = MONTHS_PT[next.monthIdx];
      observations.push(
        `Fora dos meses de pico sazonal, ${spec.shortName} apresenta arrecadação mais contida. O próximo pico esperado ocorre em ${nextName} (${next.reason}).`,
      );
    }
  } else if (spec.key === "ipi") {
    // IPI: análise via média móvel 3M (ciclo industrial)
    const lastVals = metrics.closings.slice(-3).map((c) => c.value);
    const m3 = compute3MAvg(lastVals);
    if (m3 !== null && latest.value > 0) {
      const ratio = (latest.value / m3 - 1) * 100;
      const trend =
        ratio >= 3
          ? "acima da média móvel 3M, sugerindo recuperação do ciclo industrial"
          : ratio <= -3
            ? "abaixo da média móvel 3M, sugerindo desaceleração do ciclo industrial"
            : "alinhada à média móvel 3M, sugerindo estabilidade do ciclo industrial";
      observations.push(
        `Para ${spec.shortName}, o último valor está ${trend} (variação de ${fmtPctSigned(ratio)} frente à média móvel de 3 períodos), dado que o tributo é sensível ao ritmo da indústria de transformação.`,
      );
    }
  } else if (spec.key === "iof") {
    observations.push(
      `Para ${spec.shortName}, a arrecadação acompanha o volume de operações de crédito, câmbio e seguros — períodos de aperto monetário (Selic elevada) tendem a comprimir o crédito e, por consequência, a arrecadação de IOF; o movimento inverso ocorre em ciclos de afrouxamento. Esta correlação macroeconômica é observável historicamente, mas não determinística.`,
    );
  } else if (spec.key === "importacao") {
    observations.push(
      `Para ${spec.shortName}, a arrecadação é diretamente influenciada pelo volume e pelo valor em reais das importações, sensíveis ao ciclo cambial e à demanda interna — períodos de real valorizado tendem a elevar o valor transformado em reais das mercadorias importadas e, por extensão, a arrecadação. Correlação macroeconômica observável, mas não determinística.`,
    );
  }

  return { observations, insights };
};

// ════════════════════════════════════════════════════════════════════════════
// Componente: ComparativoGrid — grid 2x3 de mini-gráficos
// ════════════════════════════════════════════════════════════════════════════
// Mapa estático para Tailwind purge funcionar.


const ComparativoGrid = memo(function ComparativoGrid({
  series,
  id,
}: ComparativoGridProps & { id?: string }) {
  const cols = useResponsiveValue(() => getResponsiveGridCols(series.length));

  const panels = useMemo(() => {
    return series.map((s) => {
      const metrics = computeMetrics(s.data);
      const valid = metrics?.validAsc ?? [];
      const last12 = valid.slice(-12).map((i) => ({
        date: i.data.substring(0, 10),
        value: i.valor as number,
      }));
      const sixMonth = metrics?.sixMonthPoints ?? [];
      const points = last12.length >= sixMonth.length ? last12 : sixMonth;
      return {
        key: s.key,
        shortName: s.shortName,
        longName: s.longName,
        accent: s.accent,
        points,
      };
    });
  }, [series]);

  return (
    <motion.div
      id={id}
      variants={itemVariants}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]
                 backdrop-blur-md p-6 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)] scroll-mt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl opacity-25"
        style={{ background: '#a78bfa' }}
      />
      <div className="relative mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
            style={{ background: '#a78bfa1a', color: '#a78bfa' }}
            aria-hidden
          >
            <Layers size={18} />
          </span>
          <div>
            <h4 className="text-base font-semibold tracking-tight text-slate-100">Comparativo — últimos 12 meses</h4>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              {series.length} tributos · {cols} coluna(s) no tamanho atual
            </p>
          </div>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: '#a78bfa1a', color: '#a78bfa' }}
        >
          {series.length} itens
        </span>
      </div>

      <div className={`${GRID_COLS_CLASS[cols] ?? GRID_COLS_CLASS[3]} gap-3`}>
        {panels.map((p) => (
          <ChartGridPanel
            key={p.key}
            title={p.shortName}
            subtitle={p.longName}
            accent={p.accent}
            points={p.points}
            emptyHint="Sem dados para este tributo."
            valueFormatter={fmtBRLTax}
          />
        ))}
      </div>
    </motion.div>
  );
});

// ════════════════════════════════════════════════════════════════════════════
// Componente: PeriodExplorerWithSelector — explodador com dropdown de tributo
// ════════════════════════════════════════════════════════════════════════════
interface PeriodExplorerWithSelectorProps {
  seriesByKey: Record<string, IpeaSerie[] | undefined>;
  id?: string;
}

const PeriodExplorerWithSelector = memo(function PeriodExplorerWithSelector({
  seriesByKey,
  id,
}: PeriodExplorerWithSelectorProps) {
  const [selectedKey, setSelectedKey] = useState<string>(
    TAX_SPECS[0]?.key ?? "",
  );

  const selectedSpec =
    TAX_SPECS.find((s) => s.key === selectedKey) ?? TAX_SPECS[0];
  const data = selectedSpec ? seriesByKey[selectedSpec.key] : undefined;
  const metrics = useMemo(() => computeMetrics(data), [data]);

  return (
    <motion.div
      id={id}
      variants={itemVariants}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/2
                 backdrop-blur-md p-6 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)] scroll-mt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl opacity-25"
        style={{ background: "#a78bfa" }}
      />

      <div className="relative mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
            style={{ background: "#a78bfa1a", color: "#a78bfa" }}
            aria-hidden
          >
            <Filter size={18} />
          </span>
          <div>
            <h4 className="text-base font-semibold tracking-tight text-slate-100">
              Explorador por Período
            </h4>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Selecione o tributo · depois ano e mês
            </p>
          </div>
        </div>

        <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
          <span>Tributo</span>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 hover:border-white/20 transition-colors"
            aria-label="Selecionar tributo"
          >
            {TAX_SPECS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.shortName}
              </option>
            ))}
          </select>
        </label>
      </div>

      {metrics ? (
        <PeriodExplorer
          validAsc={metrics.validAsc}
          accent={selectedSpec.accent}
          valueFormatter={fmtBRLTax}
        />
      ) : (
        <div className="flex h-75 items-center justify-center text-center text-xs text-slate-500">
          Sem dados válidos para {selectedSpec.shortName}.
        </div>
      )}
    </motion.div>
  );
});

// ════════════════════════════════════════════════════════════════════════════
// Página principal
// ════════════════════════════════════════════════════════════════════════════
function ImpostosPage() {
  // Hooks — um por imposto, chamados estaticamente no topo (regra dos hooks)
  const importacao = useImportTax();
  const irpf = usePersonalIncomeTax();
  const irpj = useCorporateIncomeTax();
  const irTotal = useTotalIncomeTax();
  const iof = useIofTax();
  const ipi = useIpiTax();
  




  // Mapa key → resultado do hook, para lookup por spec
  const resultsByKey: Record<string, TaxHookResult> = {
    importacao: importacao,
    irpf: irpf,
    irpj: irpj,
    "ir-total": irTotal,
    iof: iof,
    ipi: ipi,
  };

  // Série por key — usada pelo Explorador
  const seriesByKey = useMemo(() => {
    const map: Record<string, IpeaSerie[] | undefined> = {};
    for (const spec of TAX_SPECS) {
      map[spec.key] = resultsByKey[spec.key]?.data;
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importacao, irpf, irpj, irTotal, iof, ipi]);

  // Série para o Comparativo 2x3
  const comparativoSeries = useMemo(
    () =>
      TAX_SPECS.map((spec) => ({
        key: spec.key,
        shortName: spec.shortName,
        longName: spec.longName,
        accent: spec.accent,
        data: resultsByKey[spec.key]?.data,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [importacao, irpf, irpj, irTotal, iof, ipi],
  );

  // Agregado (soma dos 6 tributos no último mês disponível comum)
  const aggregate = useMemo(
    () =>
      computeAggregatedTotal(
        TAX_SPECS.map((spec) => ({
          key: spec.key,
          label: spec.shortName,
          data: resultsByKey[spec.key]?.data,
        })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [importacao, irpf, irpj, irTotal, iof, ipi],
  );

  return (
    <motion.section
      className="flex flex-col gap-8 max-w-5xl mx-auto py-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
          Indicadores <span className="text-[#FFDF00]">Fiscais</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xl">
          Arrecadação tributária federal — IPEA / Receita Federal. Séries
          mensais atualizadas conforme calendário de apuração de cada tributo.
        </p>
      </motion.div>

      <QuickNav items={NAV_ITEMS_TAXES} />

      {/* ── Painel agregado no topo ── */}
      <AggregatedTotalPanel
        id="sec-agregado"
        title="Arrecadação Total — Soma dos 6 Tributos"
        subtitle="Último mês de referência comum"
        aggregate={aggregate}
        accent="#818cf8"
        accentsByKey={ACCENTS_BY_KEY}
      />

      {/* ── Comparativo 2x3 ── */}
      <ComparativoGrid id="sec-comparativo" series={comparativoSeries} />

      {/* ── Cards individuais por imposto + insights sazonais ── */}
      {TAX_SPECS.map((spec) => {
        const result = resultsByKey[spec.key];
        if (!result) return null;

        const { data, isLoading, error, refetch } = result;
        const metrics = computeMetrics(data);
        const latest = computeLatestSummary(data);
        const { observations, insights } = buildTaxObservations(spec, data);

        return (
          <div key={spec.key} className="flex flex-col gap-5">
            <IndicatorCard
              id={`sec-${spec.key}`}
              imageKey={spec.imageKey}
              imageFolder="impostos" // ← NOVA LINHA
              gradient={spec.gradient}
              icon={renderTaxIcon(spec.iconKey, 18)}
              title={spec.shortName}
              badge={spec.badge}
              description={spec.description}
              isLoading={isLoading}
              error={error}
              refetch={refetch}
            >
              {latest && (
                <div className="flex flex-col gap-2">
                  <p
                    className="text-4xl font-bold tracking-tight"
                    style={{ color: spec.accent }}
                  >
                    {fmtBRLTax(latest.value)}
                  </p>
                  <p className="text-slate-300 text-xs mt-1 font-mono">
                    Referência: {fmtBRDate(latest.date)}
                  </p>
                  <div className="flex flex-col mt-2">
                    {latest.variationMM !== null && (
                      <DataRow
                        label="Variação M/M"
                        value={fmtPctSigned(latest.variationMM)}
                        valueClass={
                          latest.variationMM >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      />
                    )}
                    {latest.variationYoY !== null && (
                      <DataRow
                        label="Variação YoY (mesmo mês ano anterior)"
                        value={fmtPctSigned(latest.variationYoY)}
                        valueClass={
                          latest.variationYoY >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      />
                    )}
                  </div>
                </div>
              )}
            </IndicatorCard>

            {metrics && metrics.fiveYearPoints.length > 0 && (
              <ChartPanel
                title={`${spec.shortName} — 5 Anos`}
                subtitle={`${spec.longName} · longo prazo`}
                icon={<Activity size={18} />}
                accent={spec.accent}
                points={metrics.fiveYearPoints}
                emptyHint="Sem dados válidos no intervalo de 5 anos."
                valueFormatter={fmtBRLTax}
              />
            )}

            {metrics && metrics.sixMonthPoints.length > 0 && (
              <ChartPanel
                title={`${spec.shortName} — 6 Meses`}
                subtitle="Volatilidade e tendência de curto prazo"
                icon={<Sparkles size={18} />}
                accent={spec.accent}
                points={metrics.sixMonthPoints}
                emptyHint="Sem dados válidos nos últimos 6 meses."
                valueFormatter={fmtBRLTax}
              />
            )}

            {metrics && metrics.closings.length > 0 && (
              <RecentClosingsTable
                rows={metrics.closings}
                title={`${spec.shortName} — Últimos Fechamentos`}
                subtitle="5 períodos · variação D/D-1"
                valueFormatter={fmtBRLTax}
              />
            )}

            {observations.length > 0 && (
              <EducationalInsightsPanel
                observations={observations}
                insights={insights}
                accent={spec.accent}
              />
            )}
          </div>
        );
      })}

      {/* ── Explorador com seletor de tributo ── */}
      <PeriodExplorerWithSelector
        id="sec-explorador"
        seriesByKey={seriesByKey}
      />
    </motion.section>
  );
}

export default memo(ImpostosPage);
