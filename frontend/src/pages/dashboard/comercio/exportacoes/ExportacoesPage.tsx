// API: IPEA — Exportações (11 séries: valores FOB + índices)
import { memo, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Activity, Sparkles, Filter, Layers } from "lucide-react";

import {
  useTotalExports,
  useExportQuantumIndex,
  useBasicProductsExports,
  useAgricultureLivestockQuantumExports,
  useConsumerGoodsExports,
  useCapitalGoodsPriceIndex,
  useDurableConsumerGoodsPriceIndex,
  useNonDurableConsumerGoodsPriceIndex,
  useIntermediateGoodsFobValue,
  useIntermediateGoodsQuantumIndex,
  useFuelsFobValue,
} from "../../../../hooks/UseIpea";

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
  fmtPctSigned,
  fmtUSDCompact,
  fmtIndex,
  fmtBRDate,
  MONTHS_PT,
  computeMetrics,
  computeLatestSummary,
  describeAmplitude,
  describeVolatility,
  describeLast5Trend,
  getResponsiveGridCols,
  useResponsiveValue,
  findBannerImage,
} from "../../../../components/indicators/Indicators";

import { IndicesSummaryPanel } from "../../../../components/indicators/parts/IndicesSummaryPanel.tsx";
import { PageBanner } from "../../../../components/indicators/parts/PageBanner.tsx";


import type { IpeaSerie } from "../../../../types/IpeaType";
import type {
  ExportSpec,
  SeasonalityInsight,
  ComparativoGridProps,
  SeriesHookResult,
} from "../../../../types/utilities/Economy";

//import { findBannerImage } from '../../../../components/indicators/Helpers';

import {
  EXPORT_SPECS,
  NAV_ITEMS_EXPORTS,
} from "../../../../constants/exportacoes/ExportSpecs";
import { renderExportIcon } from "../../../../constants/exportacoes/ExportIcons";
import {
  EXPORT_SEASONALITY,
  EXPORT_HARVEST_LABEL,
} from "../../../../constants/exportacoes/ExportSeasonality";

// ─── Formatador por categoria ──────────────────────────────────────────────
const fmtForSpec = (spec: ExportSpec): ((v: number) => string) =>
  spec.category === "valor" ? fmtUSDCompact : fmtIndex;

// ─── Helpers locais ────────────────────────────────────────────────────────

/**
 * Gera observações dinâmicas para uma série de exportação, baseadas em
 * thresholds + regras de safra/sazonalidade + correlações macro.
 */
const buildExportObservations = (
  spec: ExportSpec,
  data: IpeaSerie[] | undefined,
): {
  observations: string[];
  insights: { label: string; value: string; tone: "pos" | "neg" | "neutral" }[];
} => {
  const metrics = computeMetrics(data);
  const latest = computeLatestSummary(data);
  if (!metrics || !latest) return { observations: [], insights: [] };

  const fmt = fmtForSpec(spec);
  const observations: string[] = [];
  const insights: {
    label: string;
    value: string;
    tone: "pos" | "neg" | "neutral";
  }[] = [];

  // KPIs do painel
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

  // Obs 1: valor + variações
  const lastVal = fmt(latest.value);
  observations.push(
    `${spec.category === "valor" ? "Valor" : "Índice"} mais recente de ${spec.shortName}: ${lastVal} ` +
      `(referência ${fmtBRDate(latest.date)}).` +
      (latest.variationMM !== null
        ? ` Frente ao mês anterior, variação de ${fmtPctSigned(latest.variationMM)}` +
          (latest.variationMM >= 15
            ? " (forte alta mensal)"
            : latest.variationMM >= 3
              ? " (alta mensal consistente)"
              : latest.variationMM > -3
                ? " (estável no mês)"
                : latest.variationMM > -15
                  ? " (queda mensal moderada)"
                  : " (forte queda mensal)")
        : "") +
      (latest.variationYoY !== null
        ? `; frente ao mesmo mês do ano anterior, variação de ${fmtPctSigned(latest.variationYoY)}` +
          (latest.variationYoY >= 15
            ? " (expansão robusta na base anual)"
            : latest.variationYoY >= 0
              ? " (crescimento anual moderado)"
              : latest.variationYoY > -15
                ? " (recuo anual moderado)"
                : " (recuo anual acentuado)")
        : "") +
      ".",
  );

  // Obs 2: janela 6 meses
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

  // Obs 3: amplitude 5 anos
  if (metrics.fiveYearHigh && metrics.fiveYearLow) {
    observations.push(
      `${describeAmplitude(metrics.fiveYearHigh, metrics.fiveYearLow, fmt)}, evidenciando os ciclos do comércio exterior brasileiro.`,
    );
  }

  // Obs 4: volatilidade
  if (metrics.avgDailyAbsVar6m !== null) {
    observations.push(
      `${describeVolatility(metrics.avgDailyAbsVar6m, metrics.positiveDays6m, metrics.negativeDays6m)}.`,
    );
  }

  // Obs 5: tendência últimos 5 pontos
  if (metrics.last5Trend !== null && metrics.last5NetPct !== null) {
    observations.push(
      `${describeLast5Trend(metrics.last5Trend, metrics.last5NetPct)}.`,
    );
  }

  // Obs 6: regra de safra/sazonalidade específica
  const monthIdx = parseInt(latest.date.substring(5, 7), 10) - 1;
  const monthName = MONTHS_PT[monthIdx] ?? "mês atual";

  const seasonal: SeasonalityInsight[] | undefined =
    EXPORT_SEASONALITY[spec.key];
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
        `Fora dos meses de pico sazonal, ${spec.shortName} apresenta movimento mais contido. O próximo pico esperado ocorre em ${nextName} (${next.reason}).`,
      );
    }
  }

  // Obs 7: correlação macroeconômica por categoria/key
  const harvestLabel = EXPORT_HARVEST_LABEL[spec.key] ?? "comércio exterior";
  if (spec.category === "valor" && spec.key === "fuels") {
    observations.push(
      `Para ${spec.shortName}, a arrecadação em valor FOB acompanha o preço internacional do petróleo e a produção da pré-sal — ciclos de alta do barril elevam o valor exportado mesmo sem crescimento de volume. Correlação observável, mas não determinística.`,
    );
  } else if (spec.category === "valor") {
    observations.push(
      `Para ${spec.shortName}, o valor FOB é influenciado pela conjuntura de ${harvestLabel} e pelo câmbio — períodos de real desvalorizado elevam a competitividade do produto brasileiro no exterior, ampliando o valor exportado. Correlação macroeconômica observável, mas não determinística.`,
    );
  } else {
    // Índices (quantum ou preço)
    observations.push(
      `Para ${spec.shortName} (índice), o movimento reflete ${harvestLabel}, isolando efeitos cambiais. Índices de quantum medem volume físico; índices de preço medem inflação exportada. Leitura distinta das séries de valor FOB.`,
    );
  }

  return { observations, insights };
};

// ─── Componente: ComparativoGrid ───────────────────────────────────────────
const GRID_COLS_CLASS: Record<number, string> = {
  1: "grid grid-cols-1",
  2: "grid grid-cols-1 sm:grid-cols-2",
  3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
};

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
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/2
                 backdrop-blur-md p-6 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)] scroll-mt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl opacity-25"
        style={{ background: "#a78bfa" }}
      />
      <div className="relative mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
            style={{ background: "#a78bfa1a", color: "#a78bfa" }}
            aria-hidden
          >
            <Layers size={18} />
          </span>
          <div>
            <h4 className="text-base font-semibold tracking-tight text-slate-100">
              Comparativo — últimos 12 meses
            </h4>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              {series.length} séries · escalas independentes
            </p>
          </div>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: "#a78bfa1a", color: "#a78bfa" }}
        >
          {series.length} itens
        </span>
      </div>

      <div className={`${GRID_COLS_CLASS[cols] ?? GRID_COLS_CLASS[4]} gap-3`}>
        {panels.map((p) => {
          const spec = EXPORT_SPECS.find((s) => s.key === p.key);
          const fmt = spec ? fmtForSpec(spec) : fmtUSDCompact;
          return (
            <ChartGridPanel
              key={p.key}
              title={p.shortName}
              subtitle={p.longName}
              accent={p.accent}
              points={p.points}
              emptyHint="Sem dados para esta série."
              valueFormatter={fmt}
            />
          );
        })}
      </div>
    </motion.div>
  );
});

// ─── Componente: PeriodExplorerWithSelector ────────────────────────────────
interface PeriodExplorerWithSelectorProps {
  seriesByKey: Record<string, IpeaSerie[] | undefined>;
  id?: string;
}

const PeriodExplorerWithSelector = memo(function PeriodExplorerWithSelector({
  seriesByKey,
  id,
}: PeriodExplorerWithSelectorProps) {
  const [selectedKey, setSelectedKey] = useState<string>(
    EXPORT_SPECS[0]?.key ?? "",
  );
  const selectedSpec =
    EXPORT_SPECS.find((s) => s.key === selectedKey) ?? EXPORT_SPECS[0];
  const data = selectedSpec ? seriesByKey[selectedSpec.key] : undefined;
  const metrics = useMemo(() => computeMetrics(data), [data]);
  const fmt = selectedSpec ? fmtForSpec(selectedSpec) : fmtUSDCompact;

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
              Selecione a série · depois ano e mês
            </p>
          </div>
        </div>
        <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
          <span>Série</span>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 hover:border-white/20 transition-colors"
            aria-label="Selecionar série"
          >
            {EXPORT_SPECS.map((s) => (
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
          valueFormatter={fmt}
        />
      ) : (
        <div className="flex h-75 items-center justify-center text-center text-xs text-slate-500">
          Sem dados válidos para {selectedSpec.shortName}.
        </div>
      )}
    </motion.div>
  );
});

// ─── Página principal ──────────────────────────────────────────────────────
function ExportacoesPage() {
  // 11 hooks
  const total = useTotalExports();
  const quantum = useExportQuantumIndex();
  const basicProducts = useBasicProductsExports();
  const agricultureQuantum = useAgricultureLivestockQuantumExports();
  const consumerGoods = useConsumerGoodsExports();
  const capitalPrice = useCapitalGoodsPriceIndex();
  const durablePrice = useDurableConsumerGoodsPriceIndex();
  const nonDurablePrice = useNonDurableConsumerGoodsPriceIndex();
  const intermediateValue = useIntermediateGoodsFobValue();
  const intermediateQuantum = useIntermediateGoodsQuantumIndex();
  const fuels = useFuelsFobValue();

  const resultsByKey = useMemo<Record<string, SeriesHookResult>>(
    () => ({
      total: total,
      quantum: quantum,
      "basic-products": basicProducts,
      "agriculture-quantum": agricultureQuantum,
      "consumer-goods": consumerGoods,
      "capital-price": capitalPrice,
      "durable-price": durablePrice,
      "non-durable-price": nonDurablePrice,
      "intermediate-value": intermediateValue,
      "intermediate-quantum": intermediateQuantum,
      fuels: fuels,
    }),
    [
      total,
      quantum,
      basicProducts,
      agricultureQuantum,
      consumerGoods,
      capitalPrice,
      durablePrice,
      nonDurablePrice,
      intermediateValue,
      intermediateQuantum,
      fuels,
    ],
  );

  // Resumo de índices (NÃO soma — apenas mostra lado a lado)
  const indicesSummary = useMemo(() => {
    return EXPORT_SPECS.filter((s) => s.category === "indice").map((s) => ({
      key: s.key,
      label: s.shortName,
      accent: s.accent,
      latest: computeLatestSummary(resultsByKey[s.key]?.data),
      valueFormatter: fmtIndex,
    }));
  }, [resultsByKey]);

  // Resumo de valores (NÃO soma — apenas mostra lado a lado)
  const valoresSummary = useMemo(() => {
    return EXPORT_SPECS.filter((s) => s.category === "valor").map((s) => ({
      key: s.key,
      label: s.shortName,
      accent: s.accent,
      latest: computeLatestSummary(resultsByKey[s.key]?.data),
      valueFormatter: fmtUSDCompact,
    }));
  }, [resultsByKey]);

  // Série para o Comparativo
  const comparativoSeries = useMemo(
    () =>
      EXPORT_SPECS.map((spec) => ({
        key: spec.key,
        shortName: spec.shortName,
        longName: spec.longName,
        accent: spec.accent,
        data: resultsByKey[spec.key]?.data,
      })),
    [resultsByKey],
  );

  // Série por key — usada pelo Explorador
  const seriesByKey = useMemo(() => {
    const map: Record<string, IpeaSerie[] | undefined> = {};
    for (const spec of EXPORT_SPECS) {
      map[spec.key] = resultsByKey[spec.key]?.data;
    }
    return map;
  }, [resultsByKey]);

  return (
    <motion.section
      className="flex flex-col gap-8 max-w-5xl mx-auto py-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <PageBanner
        image={findBannerImage("exportacoes")}
        badge="IPEA · Comex"
        title="Exportações Brasileiras"
        titleAccent="Brasileiras"
        subtitle="Comércio exterior — séries mensais de valor FOB (US$) e índices de quantum/preço."
        navItems={NAV_ITEMS_EXPORTS}
        accentColor="#34d399"
      />

      {/* ── Painel de Valores FOB ── */}
      <IndicesSummaryPanel
        id="sec-resumo-valores"
        title="Valores FOB — Último mês"
        subtitle="Séries monetárias em US$ (milhões)"
        items={valoresSummary}
      />

      {/* ── Painel de Índices ── */}
      <IndicesSummaryPanel
        id="sec-resumo-indices"
        title="Índices de Quantum e Preço"
        subtitle="Séries adimensionais (base 100)"
        items={indicesSummary}
      />

      {/* ── Comparativo ── */}
      <ComparativoGrid id="sec-comparativo" series={comparativoSeries} />

      {/* ── 11 seções individuais ── */}
      {EXPORT_SPECS.map((spec) => {
        const result = resultsByKey[spec.key];
        if (!result) return null;
        const { data, isLoading, error, refetch } = result;
        const metrics = computeMetrics(data);
        const latest = computeLatestSummary(data);
        const { observations, insights } = buildExportObservations(spec, data);
        const fmt = fmtForSpec(spec);

        return (
          <div key={spec.key} className="flex flex-col gap-5">
            <IndicatorCard
              id={`sec-${spec.key}`}
              imageKey={spec.imageKey}
              imageFolder={spec.imageFolder ?? "exportacoes"}
              gradient={spec.gradient}
              icon={renderExportIcon(spec.iconKey, 18)}
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
                    {fmt(latest.value)}
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
                        label="Variação YoY"
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
                valueFormatter={fmt}
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
                valueFormatter={fmt}
              />
            )}

            {metrics && metrics.closings.length > 0 && (
              <RecentClosingsTable
                rows={metrics.closings}
                title={`${spec.shortName} — Últimos Fechamentos`}
                subtitle="5 períodos · variação D/D-1"
                valueFormatter={fmt}
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

      {/* ── Explorador ── */}
      <PeriodExplorerWithSelector
        id="sec-explorador"
        seriesByKey={seriesByKey}
      />
    </motion.section>
  );
}

export default memo(ExportacoesPage);
