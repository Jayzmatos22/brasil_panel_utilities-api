import { useState, useEffect, type ChangeEvent, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  BarChart3,
  MapPin,
  MapPinned,
  Signpost,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import {
  useStates,
  useCitiesByState,
  useStatesRanking,
} from "../../../hooks/UseIbge";
import { useViaCep, useCepSearch } from "../../../hooks/UseViaCep";
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

// O chip já tinha estados de hover que sugeriam clique sem fazer nada. Agora ele
// seleciona o município, que é o que destrava a busca de CEP por logradouro.
const CityChip = memo(
  ({
    name,
    selected,
    onSelect,
  }: {
    name: string;
    selected: boolean;
    onSelect: (name: string) => void;
  }) => (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(name)}
      className={`text-left rounded-lg px-4 py-2.5 text-sm border transition-all duration-200 cursor-pointer
                  coarse:min-h-11 ${
                    selected
                      ? "bg-emerald-500/15 text-white border-emerald-500/40 shadow-[0_0_18px_-6px_rgba(16,185,129,0.6)]"
                      : "bg-white/3 text-slate-300 border-white/10 hover:bg-emerald-500/10 hover:text-white hover:border-emerald-500/30"
                  }`}
    >
      {name}
    </button>
  ),
);

// Par rótulo/valor do card de CEP. Valor vazio some, em vez de virar um campo em
// branco — vários campos do ViaCEP (unidade, gia) só existem em alguns CEPs.
const CepField = ({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}) => {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`text-white text-sm ${mono ? "font-mono text-emerald-300" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function IbgePage() {
  const [selectedState, setSelectedState] = useState("");
  const [filtro, setFiltro] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");

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

  const {
    data: endereco,
    isFetching: buscandoCep,
    isError: cepNaoEncontrado,
  } = useViaCep(cep);

  const {
    data: cepsDaRua,
    isFetching: buscandoRua,
    isError: erroBuscaRua,
  } = useCepSearch(selectedState, selectedCity, rua);

  // O CEP é um atalho para o eixo que a página já opera: resolvido o endereço,
  // o estado e o município passam a ser os dele, e o resto da tela reage
  // sozinho — ranking, card do estado e lista de municípios.
  useEffect(() => {
    if (!endereco) return;
    setSelectedState(endereco.uf);
    setFiltro(endereco.municipio);
    setSelectedCity(endereco.municipio);
  }, [endereco]);

  const bannerImage =
    findIbgeImage("estado-img") || Object.values(IBGE_IMAGES)[0];
  const selectedStateData = states?.find((s) => s.sigla === selectedState);

  return (
    <motion.div
      className="@container/page flex flex-col gap-section max-w-6xl mx-auto"
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
          <h1 className="text-display font-semibold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
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
                setSelectedCity("");
                setRua("");
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

        {/* CEP — terceira via de entrada no mesmo eixo Estado → Município */}
        <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
          <label
            htmlFor="cep-input"
            className="text-slate-400 text-xs font-medium uppercase tracking-wider"
          >
            Buscar por CEP
          </label>
          <div className="relative">
            <MapPinned
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              id="cep-input"
              type="text"
              inputMode="numeric"
              maxLength={9}
              value={cep}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setCep(e.target.value)
              }
              placeholder="01310-100"
              className="w-full h-12 pl-11 pr-10 rounded-xl bg-white/5 backdrop-blur-md text-white border border-white/10
                         placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50
                         transition-all text-sm font-mono hover:bg-white/10"
            />
            {buscandoCep && (
              <LoaderCircle
                size={15}
                className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-yellow-400"
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════
          RESULTADO DO CEP — ViaCEP
         ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {cepNaoEncontrado && !buscandoCep && (
          <motion.div
            key="cep-erro"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <VisualErrorState message="CEP não encontrado na base dos Correios." />
          </motion.div>
        )}

        {endereco && !buscandoCep && (
          <motion.section
            key={endereco.cep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            className="relative overflow-hidden bg-surface-3 border border-white/10 backdrop-blur-md
                       rounded-2xl p-6 shadow-xl shadow-black/20 flex flex-col gap-5"
          >
            {/* Trilho amarelo: marca a origem ViaCEP, distinta do verde do IBGE */}
            <div className="absolute left-0 top-0 bottom-0 w-0.75 bg-linear-to-b from-[#FFDF00] to-transparent" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <MapPinned size={16} className="text-yellow-400" />
                <h2 className="text-white font-semibold text-sm uppercase tracking-wider">
                  {endereco.logradouro || "Localidade"}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200">
                ViaCEP · {endereco.cep}
              </span>
            </div>

            <div className="grid-auto-cards gap-x-6 gap-y-4 [--card-min:8rem]">
              <CepField label="Bairro" value={endereco.bairro} />
              <CepField label="Complemento" value={endereco.complemento} />
              <CepField label="Unidade" value={endereco.unidade} />
              <CepField label="Município" value={endereco.municipio} />
              {/* A ponte com o IBGE: este código é o mesmo id de ibge_cities */}
              <CepField label="Cód. IBGE" value={endereco.municipioId} mono />
              <CepField label="UF" value={endereco.uf} mono />
              <CepField label="Estado" value={endereco.estado} />
              <CepField label="Região" value={endereco.regiao} />
              <CepField label="DDD" value={endereco.ddd} mono />
              <CepField label="SIAFI" value={endereco.siafi} mono />
              <CepField label="GIA" value={endereco.gia} mono />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          RANKING & STATE INFO GRID
         ══════════════════════════════════════════════════════════════════ */}
      <div className="grid-auto-cards gap-6 [--card-min:17rem]">
        {/* Ranking Chart */}
        <motion.div
          variants={item}
          className="lg:col-span-2 relative bg-surface-3 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl shadow-black/20 flex flex-col gap-4"
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
            <div className="mt-2 rounded-xl overflow-hidden bg-inset p-2 border border-white/5 min-h-75">
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
            className="relative bg-surface-3 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl shadow-black/20"
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
              <div className="grid-auto-cards gap-3 [--card-min:8rem]">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : cities && cities.length > 0 ? (
              <div className="grid-auto-cards gap-3 [--card-min:8rem] max-h-100 overflow-y-auto scrollbar-thin pr-2">
                {cities.map((city) => (
                  <CityChip
                    key={city.id}
                    name={city.nome}
                    selected={city.nome === selectedCity}
                    onSelect={(nome) => {
                      setSelectedCity(nome === selectedCity ? "" : nome);
                      setRua("");
                    }}
                  />
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

      {/* ══════════════════════════════════════════════════════════════════
          BUSCA REVERSA — logradouro → CEPs (ViaCEP)
         ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedCity && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative bg-surface-3 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl shadow-black/20"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <h2 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
                <Signpost size={16} className="text-yellow-400" />
                CEPs por rua em {selectedCity}
              </h2>

              <div className="relative w-full sm:w-72">
                <Search
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  aria-label={`Buscar rua em ${selectedCity}`}
                  value={rua}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setRua(e.target.value)
                  }
                  placeholder="Nome da rua (mín. 3 letras)..."
                  className="w-full h-10 coarse:min-h-11 pl-10 pr-9 rounded-control bg-white/5 text-white border border-white/10
                             placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-400/30 transition-all text-sm"
                />
                {buscandoRua && (
                  <LoaderCircle
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-yellow-400"
                  />
                )}
              </div>
            </div>

            {erroBuscaRua ? (
              <VisualErrorState message="Não foi possível consultar os CEPs desta rua." />
            ) : rua.trim().length < 3 ? (
              <p className="text-slate-500 text-sm py-8 text-center">
                Digite ao menos 3 letras do nome da rua — é o mínimo aceito pela
                base dos Correios.
              </p>
            ) : buscandoRua ? (
              <div className="flex flex-col gap-2 py-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : cepsDaRua && cepsDaRua.length > 0 ? (
              <>
                {/* A origem limita em 50 resultados: dizer isso evita que a
                    lista truncada pareça a resposta completa. */}
                {cepsDaRua.length >= 50 && (
                  <p className="text-slate-500 text-xs mb-3">
                    Exibindo os 50 primeiros resultados — refine a busca para
                    ver outros.
                  </p>
                )}
                <div className="overflow-x-auto overscroll-x-contain max-h-100 overflow-y-auto scrollbar-thin">
                  <table className="w-full min-w-md text-sm">
                    <thead className="sticky top-0 bg-slate-950/90 backdrop-blur-sm z-10">
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-slate-500 font-medium w-28 text-xs uppercase tracking-wider">
                          CEP
                        </th>
                        <th className="text-left py-3 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">
                          Logradouro
                        </th>
                        <th className="text-left py-3 px-4 text-slate-500 font-medium hidden md:table-cell text-xs uppercase tracking-wider">
                          Bairro
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cepsDaRua.map((e) => (
                        <tr
                          key={`${e.cep}-${e.logradouro}`}
                          className="border-b border-white/5 hover:bg-yellow-500/5 transition-colors group/row"
                        >
                          <td className="py-3 px-4 text-yellow-400/80 font-mono group-hover/row:text-yellow-300 transition-colors">
                            {e.cep}
                          </td>
                          <td className="py-3 px-4 text-slate-300 group-hover/row:text-white transition-colors font-medium">
                            {e.logradouro}
                            {e.complemento && (
                              <span className="text-slate-500 text-xs block">
                                {e.complemento}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-xs hidden md:table-cell group-hover/row:text-slate-400 transition-colors">
                            {e.bairro}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-sm py-8 text-center">
                Nenhuma rua com esse nome em {selectedCity}.
              </p>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
