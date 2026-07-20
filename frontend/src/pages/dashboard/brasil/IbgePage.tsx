import { useState, type ChangeEvent, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  BarChart3,
  MapPin,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import {
  useStates,
  useCitiesByState,
  useStatesRanking,
} from "../../../hooks/UseIbge";
import { BarChartEcharts } from "../../../components/charts/BarChartEcharts";
import { container, item } from "../../../lib/motion/presets";

// ─── Image Management ───────────────────────────────────────────────────────
const IBGE_IMAGES = import.meta.glob(
  "../../../assets/ibge/*.{jpeg,jpg,png,webp,avif}",
  { eager: true, import: "default" },
) as Record<string, string>;

function findIbgeImage(term: string): string | undefined {
  const match = Object.entries(IBGE_IMAGES).find(([path]) =>
    path.toLowerCase().includes(term),
  );
  return match?.[1];
}

// ─── Visual Sub-Components (Memoized) ───────────────────────────────────────
const SkeletonBlock = ({ className }: { className?: string }) => (
  <div
    className={`animate-pulse bg-white/5 rounded-md ${className}`}
    aria-hidden="true"
  />
);

const VisualErrorState = ({ message }: { message: string }) => (
  <div
    className="flex items-center gap-3 text-red-300 bg-red-950/30 border border-red-500/20 rounded-lg px-4 py-3 text-sm"
    role="alert"
  >
    <AlertCircle size={16} className="shrink-0" />
    <span>{message}</span>
  </div>
);

const CityChip = memo(({ name }: { name: string }) => (
  <div
    className="bg-white/3 border border-white/10 rounded-lg px-4 py-2.5 text-slate-300 text-sm 
               hover:bg-emerald-500/10 hover:text-white hover:border-emerald-500/30 
               transition-all duration-200 cursor-default"
  >
    {name}
  </div>
));

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function IbgePage() {
  const [selectedState, setSelectedState] = useState("");
  const [filtro, setFiltro] = useState("");

  // Hooks remain EXACTLY as provided. Types are inferred automatically.
  const { data: states, isLoading: loadingStates } = useStates();
  const { data: cities, isLoading: loadingCities } = useCitiesByState(
    selectedState,
    filtro || undefined,
  );
  const {
    data: ranking,
    isLoading: loadingRanking,
    error: rankingError,
  } = useStatesRanking();

  const bannerImage =
    findIbgeImage("estado-img") || Object.values(IBGE_IMAGES)[0];
  const selectedStateData = states?.find((s) => s.sigla === selectedState);

  return (
    <motion.div
      className="flex flex-col gap-8 max-w-6xl mx-auto"
      variants={container}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {/* ══════════════════════════════════════════════════════════════════
          HERO — 3D Emerging Banner with Pure CSS Pan
         ══════════════════════════════════════════════════════════════════ */}
      <motion.header
        variants={item}
        className="group relative overflow-hidden rounded-2xl bg-slate-950 shadow-2xl shadow-emerald-900/20 min-h-70 flex items-end"
        style={{
          transform: "perspective(1200px) rotateX(2deg)",
          transformOrigin: "bottom center",
        }}
      >
        {/* Ambient BR Glow */}
        <div
          className="absolute inset-0 z-0 scale-150 blur-3xl opacity-40"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, #009C3B 0%, #FFDF00 30%, #002776 60%, transparent 80%)",
          }}
        />

        {bannerImage && (
          <img
            src={bannerImage}
            alt=""
            role="presentation"
            className="absolute inset-0 w-full h-full object-cover opacity-80 animate-slow-pan z-1"
            style={{
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 70%)",
              maskImage:
                "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 70%)",
            }}
          />
        )}

        {/* Deep Overlays */}
        <div className="absolute inset-0 z-2 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 z-2 bg-linear-to-r from-slate-950/60 via-transparent to-transparent" />

        {/* Tricolor Rail */}
        <div className="absolute left-0 top-0 bottom-0 w-0.75 z-3 bg-linear-to-b from-[#009C3B] via-[#FFDF00] to-[#002776] shadow-[0_0_18px_rgba(255,223,0,0.4)]" />

        {/* Content */}
        <div className="relative z-10 p-8 sm:p-10 w-full">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              IBGE · Território
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
            Estados e <span className="text-[#FFDF00]">Municípios</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-300/90 leading-relaxed">
            Informações territoriais, malha municipal e dados estruturais do
            Brasil.
          </p>
        </div>
      </motion.header>

      {/* ══════════════════════════════════════════════════════════════════
          CONTROLS — Glassmorphic Select & Search
         ══════════════════════════════════════════════════════════════════ */}
      <motion.div
        variants={item}
        className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4"
      >
        {/* State Select */}
        <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
          <label
            htmlFor="state-select"
            className="text-slate-400 text-xs font-medium uppercase tracking-wider"
          >
            Estado
          </label>
          {loadingStates ? (
            <div className="h-12 rounded-xl bg-white/5 border border-white/10 flex items-center px-4 gap-2">
              <LoaderCircle
                size={14}
                className="animate-spin text-emerald-400"
              />
              <span className="text-slate-400 text-sm">Carregando...</span>
            </div>
          ) : (
            <select
              id="state-select"
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setFiltro("");
              }}
              className="h-12 px-4 rounded-xl bg-white/5 backdrop-blur-md text-white border border-white/10 
                         outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 
                         transition-all text-sm appearance-none cursor-pointer hover:bg-white/10"
            >
              <option value="" disabled className="bg-slate-900">
                Selecione um estado
              </option>
              {states?.map((s) => (
                <option key={s.id} value={s.sigla} className="bg-slate-900">
                  {s.sigla} — {s.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* City Filter */}
        <AnimatePresence>
          {selectedState && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col gap-1.5 flex-1 max-w-xs"
            >
              <label
                htmlFor="city-filter"
                className="text-slate-400 text-xs font-medium uppercase tracking-wider"
              >
                Filtrar Município
              </label>
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="city-filter"
                  type="text"
                  value={filtro}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFiltro(e.target.value)
                  }
                  placeholder="Nome do município..."
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 backdrop-blur-md text-white border border-white/10 
                             placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                             transition-all text-sm hover:bg-white/10"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════
          RANKING & STATE INFO GRID
         ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranking Chart */}
        <motion.div
          variants={item}
          className="lg:col-span-2 relative bg-slate-900/50 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl shadow-black/20 flex flex-col gap-4"
        >
          <div className="flex items-center gap-2.5">
            <BarChart3
              size={16}
              className="text-yellow-400"
              aria-hidden="true"
            />
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider">
              Ranking por Municípios
            </h2>
          </div>

          {loadingRanking ? (
            <div className="flex-1 flex flex-col gap-3 py-4">
              <SkeletonBlock className="h-4 w-1/4" />
              <SkeletonBlock className="flex-1 w-full" />
            </div>
          ) : rankingError ? (
            <VisualErrorState message="Erro ao carregar o ranking." />
          ) : ranking && ranking.length > 0 ? (
            <div className="mt-2 rounded-xl overflow-hidden bg-slate-950/40 p-2 border border-white/5 min-h-75">
              <BarChartEcharts
                items={ranking.map((e) => ({
                  label: e.sigla,
                  value: e.totalMunicipios,
                }))}
                color="#eab308"
              />
            </div>
          ) : (
            <p className="text-slate-500 text-sm py-8 text-center">
              Sem dados para o ranking.
            </p>
          )}
        </motion.div>

        {/* State Details Card */}
        <AnimatePresence mode="wait">
          {selectedState && selectedStateData ? (
            <motion.div
              key={selectedState}
              variants={item}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative bg-emerald-900/10 border border-emerald-500/20 backdrop-blur-md rounded-2xl p-6 shadow-xl shadow-black/20 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">
                    {selectedStateData.nome}
                  </h3>
                  <p className="text-emerald-400 text-xs font-mono font-semibold">
                    {selectedStateData.sigla}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Região</span>
                  <span className="text-white font-medium">
                    {selectedStateData.regiao.nome}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Municípios</span>
                  {loadingCities ? (
                    <SkeletonBlock className="h-4 w-8" />
                  ) : cities ? (
                    <span className="text-yellow-400 font-mono font-bold">
                      {cities.length}
                    </span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={item}
              className="relative bg-white/2 border border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2"
            >
              <MapPin size={24} className="text-slate-600" />
              <p className="text-slate-500 text-sm">
                Selecione um estado para detalhes
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CITIES LIST
         ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedState && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative bg-slate-900/50 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                Municípios
              </h2>
              {cities && !loadingCities && (
                <span className="text-slate-500 text-xs font-mono">
                  {cities.length} resultados
                </span>
              )}
            </div>

            {loadingCities ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : cities && cities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-100 overflow-y-auto scrollbar-thin pr-2">
                {cities.map((city) => (
                  <CityChip key={city.id} name={city.nome} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-slate-500 text-sm">
                  Nenhum município encontrado para este filtro.
                </p>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
