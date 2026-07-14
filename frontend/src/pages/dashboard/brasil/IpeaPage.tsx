// API: IPEA — Indicadores Socioeconômicos
// Endpoints: /ipea/macro, /emprego, /renda, /desigualdade-pobreza, /precos, /populacao
import { memo, useMemo, useState, type ChangeEvent } from "react";
import { motion } from "motion/react";
import {
  ChevronDown,
  LoaderCircle,
  Search,
  TrendingUp,
  Briefcase,
  DollarSign,
  Scale,
  Percent,
  Users,
  Calendar,
  X,
} from "lucide-react";
import {
  useMacro,
  useEmprego,
  useRenda,
  useDesigualdade,
  usePrecos,
  usePopulacao,
} from "../../../hooks/UseIpea";
import type { IpeaSerie, IpeaItem } from "../../../types/IpeaType";
import {
  containerVariants,
  itemVariants,
  PageBanner,
  findBannerImage,
  fmtPctSigned,
  fmtBRDate,
  fmtCompact,
} from "../../../components/indicators/Indicators";

import type { ComponentType } from "react";

import {
  LineChartEcharts,
  type LinePoint,
} from "../../../components/charts/LineChartEcharts";

// ─── Tipos ─────────────────────────────────────────────────────────────────

type Tab =
  | "Macro"
  | "Emprego"
  | "Renda"
  | "Desigualdade"
  | "Preços"
  | "População";

interface TabSpec {
  key: Tab;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  accent: string;
  description: string;
}

const TAB_SPECS: TabSpec[] = [
  {
    key: "Macro",
    label: "Macro",
    icon: TrendingUp,
    accent: "#34d399",
    description: "Indicadores macroeconômicos — PIB, juros, câmbio, atividade.",
  },
  {
    key: "Emprego",
    label: "Emprego",
    icon: Briefcase,
    accent: "#22d3ee",
    description: "Mercado de trabalho — rendimento, ocupação, desemprego.",
  },
  {
    key: "Renda",
    label: "Renda",
    icon: DollarSign,
    accent: "#84cc16",
    description: "Renda média e distribuição de rendimentos.",
  },
  {
    key: "Desigualdade",
    label: "Desigualdade",
    icon: Scale,
    accent: "#fbbf24",
    description: "Pobreza, desigualdade, índice de Gini e vulnerabilidade.",
  },
  {
    key: "Preços",
    label: "Preços",
    icon: Percent,
    accent: "#fb923c",
    description: "Índices de preços ao consumidor e produtor.",
  },
  {
    key: "População",
    label: "População",
    icon: Users,
    accent: "#a78bfa",
    description: "Demografia, população residente e projeções.",
  },
];

// ─── Helpers locais ────────────────────────────────────────────────────────

const sortValidAsc = (items: IpeaItem[]): IpeaItem[] =>
  items
    .filter(
      (i) =>
        i.valor !== null && i.valor !== undefined && !Number.isNaN(i.valor),
    )
    .sort((a, b) => a.data.localeCompare(b.data));

const toPoints = (items: IpeaItem[]): LinePoint[] =>
  items.map((i) => ({
    date: i.data.substring(0, 10),
    value: i.valor as number,
  }));

/** Último valor e variação M/M de uma série. */
const getSeriesStats = (serie: IpeaSerie) => {
  const valid = sortValidAsc(serie.dados ?? []);
  if (valid.length === 0) return null;
  const last = valid[valid.length - 1];
  const lastMonth = last.data.substring(0, 7);
  // Procura primeiro ponto de mês diferente (M/M anterior).
  let prev: IpeaItem | null = null;
  for (let i = valid.length - 2; i >= 0; i--) {
    if (valid[i].data.substring(0, 7) !== lastMonth) {
      prev = valid[i];
      break;
    }
  }
  const variationMM =
    prev && prev.valor ? ((last.valor! - prev.valor) / prev.valor) * 100 : null;
  return {
    last,
    variationMM,
    points: toPoints(valid),
    count: valid.length,
  };
};

// ─── SerieCard ─────────────────────────────────────────────────────────────

interface SerieCardProps {
  serie: IpeaSerie;
  accent: string;
}

const SerieCard = memo(function SerieCard({ serie, accent }: SerieCardProps) {
  const stats = useMemo(() => getSeriesStats(serie), [serie]);

  if (!stats) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/2 p-4">
        <p className="text-slate-500 text-sm">{serie.nome}</p>
        <p className="text-slate-600 text-xs mt-1">Sem dados válidos.</p>
      </div>
    );
  }

  const { last, variationMM, points, count } = stats;
  const lastValueStr = fmtCompact(last.valor as number);
  const lastDateStr = fmtBRDate(last.data);

  // Determina se vale a pena mostrar gráfico "wide" (muitos pontos → scroll horizontal)
  const needsWideChart = points.length > 60;
  const chartHeight = needsWideChart ? 280 : 200;
  const chartWidth = needsWideChart
    ? Math.max(800, points.length * 12)
    : undefined;

  return (
    <motion.div
      variants={itemVariants}
      className="relative overflow-hidden rounded-xl border border-white/10 bg-white/2
                 backdrop-blur-md"
    >
      {/* Glow lateral colorido */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-12 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full blur-2xl opacity-15"
        style={{ background: accent }}
      />

      {/* Header do card (sempre visível) */}
      <div className="relative p-4">
        {/* Linha 1: Nome + Badge de código */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-slate-100 text-sm font-medium leading-tight line-clamp-2">
              {serie.nome}
            </span>
            <span className="text-slate-600 text-[10px] font-mono uppercase tracking-wider">
              {serie.codigo}
            </span>
          </div>
          <span
            className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-mono font-medium border"
            style={{
              background: `${accent}1a`,
              color: accent,
              borderColor: `${accent}30`,
            }}
          >
            {count} pts
          </span>
        </div>

        {/* Linha 2: Valor + variação + data */}
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span
              className="font-mono text-xl font-bold tracking-tight"
              style={{ color: accent }}
            >
              {lastValueStr}
            </span>
            <span className="flex items-center gap-1 text-slate-500 text-[11px] font-mono">
              <Calendar size={10} aria-hidden />
              {lastDateStr}
            </span>
          </div>

          {variationMM !== null && (
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] ${
                variationMM >= 0
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                  : "bg-red-500/10 text-red-300 border-red-500/20"
              }`}
            >
              {variationMM >= 0 ? "↗" : "↘"} {fmtPctSigned(variationMM)} M/M
            </span>
          )}
        </div>
      </div>

      {/* Gráfico sempre visível — scroll horizontal se muitos pontos */}
      {points.length >= 2 ? (
        <div className="border-t border-white/5 bg-slate-950/30">
          <div className="px-4 pt-3 pb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
            <span>Série histórica completa</span>
            {needsWideChart && (
              <span className="flex items-center gap-1 text-slate-600">
                <ChevronDown size={10} className="rotate-90" /> Arraste para ver
                mais
              </span>
            )}
          </div>
          <div className={needsWideChart ? "overflow-x-auto pb-3" : "pb-3"}>
            <div
              style={
                needsWideChart
                  ? { width: `${chartWidth}px`, minWidth: "100%" }
                  : undefined
              }
            >
              <LineChartEcharts
                points={points}
                color={accent}
                style={{ height: `${chartHeight}px` }}
              />
            </div>
          </div>

          {/* Stats extras — sempre visíveis abaixo do gráfico */}
          <div className="px-4 pb-4 pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border-t border-white/5">
            <StatBox
              label="Máxima"
              value={fmtCompact(Math.max(...points.map((p) => p.value)))}
            />
            <StatBox
              label="Mínima"
              value={fmtCompact(Math.min(...points.map((p) => p.value)))}
            />
            <StatBox
              label="Primeiro"
              value={fmtCompact(points[0].value)}
              hint={fmtBRDate(points[0].date)}
            />
            <StatBox
              label="Último"
              value={fmtCompact(points[points.length - 1].value)}
              hint={fmtBRDate(points[points.length - 1].date)}
            />
          </div>
        </div>
      ) : (
        <div className="border-t border-white/5 p-4">
          <p className="text-slate-500 text-xs">
            Série sem pontos suficientes para o gráfico.
          </p>
        </div>
      )}
    </motion.div>
  );
});

const StatBox = memo(
  ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
    <div className="rounded-lg border border-white/5 bg-white/2 px-3 py-2">
      <span className="block text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="block font-mono text-sm font-semibold text-slate-200 mt-0.5">
        {value}
      </span>
      {hint && (
        <span className="block text-[10px] text-slate-600 font-mono mt-0.5">
          {hint}
        </span>
      )}
    </div>
  ),
);

// ─── TabBar ────────────────────────────────────────────────────────────────

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TabBar = memo(function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
      {TAB_SPECS.map((spec) => {
        const isActive = active === spec.key;
        const Icon = spec.icon;
        return (
          <button
            key={spec.key}
            onClick={() => onChange(spec.key)}
            aria-pressed={isActive}
            className="group flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200
                       border focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            style={{
              background: isActive
                ? `${spec.accent}1a`
                : "rgba(255,255,255,0.02)",
              color: isActive ? spec.accent : "#94a3b8",
              borderColor: isActive
                ? `${spec.accent}40`
                : "rgba(255,255,255,0.08)",
            }}
          >
            <Icon size={14} className="shrink-0" />
            <span>{spec.label}</span>
          </button>
        );
      })}
    </div>
  );
});

// ─── CategoryHeader ────────────────────────────────────────────────────────

interface CategoryHeaderProps {
  spec: TabSpec;
  count: number;
  lastUpdate: string | null;
  filter: string;
  onFilterChange: (value: string) => void;
}

const CategoryHeader = memo(function CategoryHeader({
  spec,
  count,
  lastUpdate,
  filter,
  onFilterChange,
}: CategoryHeaderProps) {
  const Icon = spec.icon;
  return (
    <motion.div
      variants={itemVariants}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/2
                 backdrop-blur-md p-5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl opacity-20"
        style={{ background: spec.accent }}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
            style={{ background: `${spec.accent}1a`, color: spec.accent }}
            aria-hidden
          >
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold tracking-tight text-slate-100">
                {spec.label}
              </h2>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border"
                style={{
                  background: `${spec.accent}1a`,
                  color: spec.accent,
                  borderColor: `${spec.accent}30`,
                }}
              >
                {count} séries
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-1 max-w-xl leading-relaxed">
              {spec.description}
            </p>
            {lastUpdate && (
              <p className="flex items-center gap-1 text-slate-600 text-[11px] font-mono mt-1.5">
                <Calendar size={10} aria-hidden />
                Última atualização: {fmtBRDate(lastUpdate)}
              </p>
            )}
          </div>
        </div>

        {/* Filtro de busca */}
        <div className="relative flex-1 min-w-50 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            aria-hidden
          />
          <input
            type="text"
            value={filter}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onFilterChange(e.target.value)
            }
            placeholder="Buscar série..."
            className="w-full h-10 pl-9 pr-9 rounded-lg bg-slate-900/70 border border-white/10
                       text-slate-200 text-sm placeholder:text-slate-600
                       focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
                       hover:border-white/20 transition-colors"
          />
          {filter && (
            <button
              onClick={() => onFilterChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Limpar filtro"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// ─── TabContent ────────────────────────────────────────────────────────────

interface TabContentProps {
  data: IpeaSerie[] | undefined;
  isLoading: boolean;
  error: unknown;
  filter: string;
  accent: string;
}

const TabContent = memo(function TabContent({
  data,
  isLoading,
  error,
  filter,
  accent,
}: TabContentProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-12 justify-center">
        <LoaderCircle size={16} className="animate-spin text-emerald-400" />
        Carregando séries...
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-sm">Erro ao carregar dados.</p>
        <p className="text-slate-600 text-xs mt-1 font-mono">
          {error instanceof Error ? error.message : "Erro desconhecido"}
        </p>
      </div>
    );
  }
  if (!data) return null;

  const normalized = filter.trim().toLowerCase();
  const filtered = normalized
    ? data.filter(
        (s) =>
          s.nome.toLowerCase().includes(normalized) ||
          s.codigo.toLowerCase().includes(normalized),
      )
    : data;

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-sm">
          {data.length === 0
            ? "Nenhuma série disponível nesta categoria."
            : `Nenhuma série encontrada para "${filter}".`}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-3 lg:grid-cols-2"
    >
      {filtered.map((serie) => (
        <SerieCard key={serie.codigo} serie={serie} accent={accent} />
      ))}
    </motion.div>
  );
});

// ─── IpeaPage ──────────────────────────────────────────────────────────────

function IpeaPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Macro");
  const [filter, setFilter] = useState("");

  const macro = useMacro();
  const emprego = useEmprego();
  const renda = useRenda();
  const desig = useDesigualdade();
  const precos = usePrecos();
  const populacao = usePopulacao();

  const activeQuery = (() => {
    switch (activeTab) {
      case "Macro":
        return macro;
      case "Emprego":
        return emprego;
      case "Renda":
        return renda;
      case "Desigualdade":
        return desig;
      case "Preços":
        return precos;
      case "População":
        return populacao;
    }
  })();

  const activeSpec = TAB_SPECS.find((s) => s.key === activeTab) ?? TAB_SPECS[0];

  // Calcula última atualização (data mais recente entre todas as séries da categoria).
  const lastUpdate = useMemo(() => {
    if (!activeQuery.data) return null;
    let max = "";
    for (const serie of activeQuery.data) {
      const valid = sortValidAsc(serie.dados ?? []);
      if (valid.length > 0) {
        const last = valid[valid.length - 1].data;
        if (last > max) max = last;
      }
    }
    return max || null;
  }, [activeQuery.data]);

  // Reset do filtro ao trocar de tab.
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setFilter("");
  };

  return (
    <motion.section
      className="flex flex-col gap-6 max-w-6xl mx-auto py-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <PageBanner
        image={findBannerImage("ipea")}
        badge="IPEA · Indicadores Socioeconômicos"
        title="Séries IPEA"
        titleAccent="IPEA"
        subtitle="Indicadores macroeconômicos, sociais e demográficos do Brasil — dados oficiais do IPEA."
        accentColor="#34d399"
      />

      <TabBar active={activeTab} onChange={handleTabChange} />

      <CategoryHeader
        spec={activeSpec}
        count={activeQuery.data?.length ?? 0}
        lastUpdate={lastUpdate}
        filter={filter}
        onFilterChange={setFilter}
      />

      <TabContent
        data={activeQuery.data}
        isLoading={activeQuery.isLoading}
        error={activeQuery.error}
        filter={filter}
        accent={activeSpec.accent}
      />
    </motion.section>
  );
}

export default memo(IpeaPage);
