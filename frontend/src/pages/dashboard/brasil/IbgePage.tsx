// API: IBGE
// Endpoints consumidos:
//   GET /ibge/states                    → useStates()
//   GET /ibge/cities/{state}?filtro=... → useCitiesByState(state, filtro?)

import { useState, type ChangeEvent } from "react";
import { motion } from "motion/react";
import { LoaderCircle, Search, BarChart3 } from "lucide-react";
import {
  useStates,
  useCitiesByState,
  useStatesRanking,
} from "../../../hooks/UseIbge";
import { BarChartEcharts } from "../../../components/charts/BarChartEcharts";
import { container, item } from "../../../lib/motion/presets";

// ============================================================================
// 1. IMPORTAÇÃO DINÂMICA DE IMAGENS
// ============================================================================
const IBGE_IMAGES = import.meta.glob(
  "../../../assets/ibge/*.{jpeg,jpg,png,webp,avif}",
  {
    eager: true,
    import: "default",
  },
) as Record<string, string>;

// Função para buscar imagens específicas por palavra-chave no nome do arquivo
function findIbgeImage(term: string): string | undefined {
  const match = Object.entries(IBGE_IMAGES).find(([path]) =>
    path.toLowerCase().includes(term),
  );
  return match?.[1];
}

export default function IbgePage() {
  const [selectedState, setSelectedState] = useState("");
  const [filtro, setFiltro] = useState("");

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

  const selectClass =
    "h-10 px-3 rounded-md bg-white text-black/60 border border-slate-600 outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm";

  // Busca a imagem estado-img dinamicamente
  const bannerImage =
    findIbgeImage("estado-img") || Object.values(IBGE_IMAGES)[0];

  return (
    <motion.div
      className="flex flex-col gap-6 estado-img"
      variants={container}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      <motion.h1 variants={item} className="text-2xl font-bold text-green-500">
        IBGE — Estados e Municípios
      </motion.h1>

      {/* ── Imagem de Banner Animada ── */}
      {bannerImage && (
        <motion.div
          variants={item}
          className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden border border-slate-700 shadow-lg"
        >
          <motion.img
            src={bannerImage}
            alt="Estados e Municípios"
            className="absolute inset-0 w-full h-full object-cover opacity-80 scale-110"
            animate={{
              x: ["-2%", "2%"],
              y: ["-1%", "1%"],
            }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 25,
              ease: "linear",
            }}
          />

          {/* Escurece a imagem */}
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent" />

          {/* Gradiente inferior */}
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent" />

          {/* Conteúdo */}
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
              IBGE
            </h1>

            <p className="text-slate-200 text-sm md:text-base mt-1 max-w-xl">
              Estados, municípios e informações territoriais do Brasil.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Ranking de estados por nº de municípios ── */}
      <motion.div
        variants={item}
        whileHover={{ y: -4 }}
        className="bg-green-50 border border-slate-700 rounded-xl p-5 flex flex-col gap-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-yellow-500">
            <BarChart3 size={15} />
          </span>
          <h2 className="text-yellow-700 font-semibold text-sm uppercase tracking-wider">
            Estados por nº de municípios
          </h2>
        </div>

        {loadingRanking ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando
            ranking...
          </div>
        ) : rankingError ? (
          <span className="text-red-400 text-sm">
            Erro ao carregar o ranking.
          </span>
        ) : ranking && ranking.length > 0 ? (
          <BarChartEcharts
            items={ranking.map((e) => ({
              label: e.sigla,
              value: e.totalMunicipios,
            }))}
            color="#eab308"
          />
        ) : (
          <p className="text-slate-500 text-sm">Sem dados para o ranking.</p>
        )}
      </motion.div>

      {/* ── Controles ── */}
      <motion.div variants={item} className="flex items-end gap-3 flex-wrap ">
        <div className="flex flex-col gap-1 ">
          <label className="text-slate-400 text-xs ">Estado</label>
          {loadingStates ? (
            <div className="flex items-center  gap-2 text-slate-400 text-sm h-10">
              <LoaderCircle size={14} className="animate-spin" /> Carregando...
            </div>
          ) : (
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setFiltro("");
              }}
              className={selectClass}
            >
              <option value="">Selecione um estado</option>
              {states?.map((s) => (
                <option key={s.id} value={s.sigla}>
                  {s.sigla} — {s.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedState && (
          <div className="flex flex-col gap-1 ">
            <label className="text-slate-400 text-xs">Filtrar município</label>
            <div className="relative ">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 "
              />
              <input
                value={filtro}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFiltro(e.target.value)
                }
                placeholder="Nome do município..."
                className="h-10 pl-9 pr-3 rounded-md bg-white text-black border border-slate-600
                           placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Resumo do estado selecionado ── */}
      {selectedState && states && (
        <motion.div
          variants={item}
          whileHover={{ y: -4 }}
          className="bg-green-50 border border-slate-700 rounded-xl p-4 max-w-sm"
        >
          {(() => {
            const state = states.find((s) => s.sigla === selectedState);
            return state ? (
              <div className="flex flex-col gap-1">
                <p className="text-slate-700 font-bold text-lg">{state.nome}</p>
                <p className="text-slate-700 text-sm">
                  Sigla: <span className="text-yellow-600">{state.sigla}</span>
                </p>
                <p className="text-slate-700 text-sm">
                  Região: {state.regiao.nome}
                </p>
                {cities && (
                  <p className="text-slate-700 text-sm">
                    Municípios encontrados:{" "}
                    <span className="text-yellow-600">{cities.length}</span>
                  </p>
                )}
              </div>
            ) : null;
          })()}
        </motion.div>
      )}

      {/* ── Lista de municípios ── */}
      {selectedState && (
        <motion.div
          variants={item}
          whileHover={{ y: -3 }}
          className="bg-slate-900 border border-slate-700 rounded-xl pb-5 p-1 "
        >
            <div className="bg-slate-950 rounded-md px-4 py-3 mb-4 border-b border-slate-600">
              <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider text-center">
                Municípios
              </h2>
            </div>

          {loadingCities ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <LoaderCircle size={16} className="animate-spin" /> Carregando
              municípios...
            </div>
          ) : cities && cities.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto pr-1 ">
              {cities.map((city) => (
                <div
                  key={city.id}
                  className="bg-slate-800 rounded-md px-3 py-2 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                >
                  {city.nome}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">
              Nenhum município encontrado.
            </p>
          )}
        </motion.div>
      )}

      {!selectedState && (
        <p className="text-slate-500 text-sm ">
          Selecione um estado para ver os municípios.
        </p>
      )}
    </motion.div>
  );
}
