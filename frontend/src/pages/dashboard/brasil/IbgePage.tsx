// API: IBGE
// Endpoints consumidos:
//   GET /ibge/states                    → useStates()
//   GET /ibge/cities/{state}?filtro=... → useCitiesByState(state, filtro?)

import { useState, type ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { LoaderCircle, Search, BarChart3 } from 'lucide-react';
import { useStates, useCitiesByState, useStatesRanking } from '../../../hooks/UseIbge';
import { BarChartEcharts } from '../../../components/charts/BarChartEcharts';
import { container, item } from '../../../lib/motion/presets';

export default function IbgePage() {
  const [selectedState, setSelectedState] = useState('');
  const [filtro,        setFiltro]        = useState('');

  const { data: states,  isLoading: loadingStates } = useStates();
  const { data: cities,  isLoading: loadingCities } = useCitiesByState(selectedState, filtro || undefined);
  const { data: ranking, isLoading: loadingRanking, error: rankingError } = useStatesRanking();

  const selectClass =
    'h-10 px-3 rounded-md bg-slate-800 text-white border border-slate-600 outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm';

  return (
    <motion.div className="flex flex-col gap-6" variants={container} initial="hidden" animate="show">
      <motion.h1 variants={item} className="text-2xl font-bold text-green-500">IBGE — Estados e Municípios</motion.h1>

      {/* Ranking de estados por nº de municípios */}
      <motion.div variants={item} whileHover={{ y: -4 }} className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-yellow-500"><BarChart3 size={15} /></span>
          <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider">
            Estados por nº de municípios
          </h2>
        </div>

        {loadingRanking ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando ranking...
          </div>
        ) : rankingError ? (
          <span className="text-red-400 text-sm">Erro ao carregar o ranking.</span>
        ) : ranking && ranking.length > 0 ? (
          <BarChartEcharts
            items={ranking.map((e) => ({ label: e.sigla, value: e.totalMunicipios }))}
            color="#eab308"
          />
        ) : (
          <p className="text-slate-500 text-sm">Sem dados para o ranking.</p>
        )}
      </motion.div>

      {/* Controles */}
      <motion.div variants={item} className="flex items-end gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-slate-400 text-xs">Estado</label>
          {loadingStates ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm h-10">
              <LoaderCircle size={14} className="animate-spin" /> Carregando...
            </div>
          ) : (
            <select
              value={selectedState}
              onChange={(e) => { setSelectedState(e.target.value); setFiltro(''); }}
              className={selectClass}
            >
              <option value="">Selecione um estado</option>
              {states?.map((s) => (
                <option key={s.id} value={s.sigla}>{s.sigla} — {s.nome}</option>
              ))}
            </select>
          )}
        </div>

        {selectedState && (
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 text-xs">Filtrar município</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={filtro}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFiltro(e.target.value)}
                placeholder="Nome do município..."
                className="h-10 pl-9 pr-3 rounded-md bg-slate-800 text-white border border-slate-600
                           placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Resumo do estado selecionado */}
      {selectedState && states && (
        <motion.div variants={item} whileHover={{ y: -4 }} className="bg-slate-900 border border-slate-700 rounded-xl p-4 max-w-sm">
          {(() => {
            const state = states.find(s => s.sigla === selectedState);
            return state ? (
              <div className="flex flex-col gap-1">
                <p className="text-white font-bold text-lg">{state.nome}</p>
                <p className="text-slate-400 text-sm">Sigla: <span className="text-yellow-400">{state.sigla}</span></p>
                <p className="text-slate-400 text-sm">Região: {state.regiao.nome}</p>
                {cities && <p className="text-slate-400 text-sm">Municípios encontrados: <span className="text-white">{cities.length}</span></p>}
              </div>
            ) : null;
          })()}
        </motion.div>
      )}

      {/* Lista de municípios */}
      {selectedState && (
        <motion.div variants={item} whileHover={{ y: -4 }} className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider mb-4">Municípios</h2>

          {loadingCities ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <LoaderCircle size={16} className="animate-spin" /> Carregando municípios...
            </div>
          ) : cities && cities.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto pr-1">
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
            <p className="text-slate-500 text-sm">Nenhum município encontrado.</p>
          )}
        </motion.div>
      )}

      {!selectedState && (
        <p className="text-slate-500 text-sm">Selecione um estado para ver os municípios.</p>
      )}
    </motion.div>
  );
}