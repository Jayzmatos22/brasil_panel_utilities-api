// API: World Bank
// Endpoints consumidos:
//   GET /worldbank          → useCurrentPibBrazil()
//   GET /worldbank/{year}   → usePibBrazilByYear(year)
//   GET /worldbank/series   → usePibSeries()

import { useState, useMemo, type ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { LoaderCircle, Landmark, CalendarSearch, LineChart, TrendingUp, TrendingDown, Minus, Map } from 'lucide-react';
import { useCurrentPibBrazil, usePibBrazilByYear, usePibSeries } from '../../../hooks/UseWorldBank';
import { usePibPorEstado } from '../../../hooks/UseSidra';
import { LineChartEcharts } from '../../../components/charts/LineChartEcharts';
import { BarChartEcharts } from '../../../components/charts/BarChartEcharts';
import { AnimatedNumber } from '../../../components/AnimatedNumber';
import { container, item } from '../../../lib/motion/presets';

// PIB vem em R$ cheios (~10^13). Mostra compacto (tri/bi/mi) e o valor integral abaixo.
const compactBrl = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1e12) return `R$ ${(v / 1e12).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} tri`;
  if (abs >= 1e9)  return `R$ ${(v / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} bi`;
  if (abs >= 1e6)  return `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi`;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};

const fullBrl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export default function PibPage() {
  const [year, setYear] = useState<number>(2020);
  const { data: currentPib, isLoading: isCurrentPibLoading, error: currentPibError } = useCurrentPibBrazil();
  const { data: pibByYear,  isLoading: isPibByYearLoading,  error: pibByYearError  } = usePibBrazilByYear(year);
  const { data: series,     isLoading: isSeriesLoading,     error: seriesError     } = usePibSeries();
  const { data: pibEstados, isLoading: isEstadosLoading,    error: estadosError    } = usePibPorEstado();

  // Série histórica → pontos do gráfico (LinePoint usa date: string) + estatísticas de variação.
  const stats = useMemo(() => {
    if (!series || series.length < 2) return null;
    const points = [...series]
      .map((p) => ({ date: p.year, value: p.value }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const first = points[0];
    const last = points[points.length - 1];
    const change = last.value - first.value;
    const pct = first.value !== 0 ? (change / first.value) * 100 : 0;
    return { points, first, last, change, pct };
  }, [series]);

  const handleYearChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      setYear(2020);
      return;
    }
    const newYear = parseInt(e.target.value, 10);
    if (!isNaN(newYear)) setYear(newYear);
  };

  return (
    <motion.div className="flex flex-col gap-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white">PIB do Brasil</h1>
        <p className="text-slate-500 text-sm mt-1">
          Produto Interno Bruto a preços correntes (R$), fonte World Bank.
        </p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PIB atual */}
        <motion.div whileHover={{ y: -4 }} className="bg-pib-item border border-slate-700 rounded-xl p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-yellow-500"><Landmark size={15} /></span>
            <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider">PIB mais recente</h2>
          </div>

          {isCurrentPibLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <LoaderCircle size={16} className="animate-spin" /> Carregando...
            </div>
          ) : currentPibError ? (
            <span className="text-red-400 text-sm">Erro ao carregar o PIB atual.</span>
          ) : currentPib ? (
            <>
              <p className="text-4xl font-bold text-green-400 tracking-tight">
                <AnimatedNumber value={currentPib.value} format={compactBrl} />
              </p>
              <p className="text-slate-400 text-sm font-mono">{fullBrl(currentPib.value)}</p>
              <span className="inline-flex w-fit text-xs text-yellow-400 bg-yellow-500/15 px-2 py-0.5 rounded-full">
                Ano de referência: {currentPib.year}
              </span>
            </>
          ) : null}
        </motion.div>

        {/* PIB por ano */}
        <motion.div whileHover={{ y: -4 }} className="bg-slate-900 border border-slate-700 bg-pib-item2 rounded-xl p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-yellow-500"><CalendarSearch size={15} /></span>
            <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider ">Consultar por ano</h2>
          </div>

          <div className="flex items-center gap-2 ">
            <input
              type="number"
              value={year}
              onChange={handleYearChange}
              placeholder="Ano"
              className="w-28 h-10 px-3 rounded-md bg-slate-800 text-white border border-slate-600 outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm"
            />
            {isPibByYearLoading && <LoaderCircle size={16} className="animate-spin text-slate-400" />}
          </div>

          {pibByYearError ? (
            <span className="text-red-400 text-sm">Erro ao carregar o PIB para {year}.</span>
          ) : pibByYear ? (
            <>
              <p className="text-4xl font-bold text-green-400 tracking-tight">
                <AnimatedNumber value={pibByYear.value} format={compactBrl} />
              </p>
              <p className="text-slate-400 text-sm font-mono">{fullBrl(pibByYear.value)}</p>
              <span className="inline-flex w-fit text-xs text-yellow-400 bg-yellow-500/15 px-2 py-0.5 rounded-full">
                Ano de referência: {pibByYear.year}
              </span>
            </>
          ) : !isPibByYearLoading ? (
            <p className="text-slate-500 text-sm">Sem dados para o ano {year}.</p>
          ) : null}
        </motion.div>
      </motion.div>

      {/* Série histórica */}
      <motion.div variants={item} whileHover={{ y: -4 }} className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-yellow-500"><LineChart size={15} /></span>
          <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider">Evolução histórica</h2>
        </div>

        {isSeriesLoading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando série...
          </div>
        ) : seriesError ? (
          <span className="text-red-400 text-sm">Erro ao carregar a série histórica.</span>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-400 text-xs uppercase tracking-wider">{stats.first.date}</p>
                <p className="text-white font-bold text-lg">{compactBrl(stats.first.value)}</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
                <p className="text-slate-400 text-xs uppercase tracking-wider">{stats.last.date}</p>
                <p className="text-white font-bold text-lg">{compactBrl(stats.last.value)}</p>
              </div>
              <div className={[
                'border rounded-lg p-3',
                stats.change > 0 ? 'bg-green-500/10 border-green-700' :
                stats.change < 0 ? 'bg-red-500/10 border-red-700' : 'bg-slate-800/60 border-slate-700',
              ].join(' ')}>
                <p className="text-slate-400 text-xs uppercase tracking-wider flex items-center gap-1">
                  {stats.change > 0 ? <TrendingUp size={12} className="text-green-400" /> :
                   stats.change < 0 ? <TrendingDown size={12} className="text-red-400" /> :
                   <Minus size={12} className="text-slate-400" />}
                  Variação no período
                </p>
                <p className={[
                  'font-bold text-lg',
                  stats.change > 0 ? 'text-green-400' : stats.change < 0 ? 'text-red-400' : 'text-slate-300',
                ].join(' ')}>
                  {stats.pct > 0 ? '+' : ''}{stats.pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
                </p>
              </div>
            </div>
            <LineChartEcharts points={stats.points} color="#22c55e" />
          </>
        ) : (
          <p className="text-slate-500 text-sm">Série sem pontos suficientes para o gráfico.</p>
        )}
      </motion.div>

      {/* PIB por estado */}
      <motion.div variants={item} whileHover={{ y: -4 }} className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-yellow-500"><Map size={15} /></span>
          <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider">
            PIB por estado{pibEstados && pibEstados.length > 0 ? ` (${pibEstados[0].year})` : ''}
          </h2>
        </div>

        {isEstadosLoading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando PIB por estado...
          </div>
        ) : estadosError ? (
          <span className="text-red-400 text-sm">Erro ao carregar o PIB por estado.</span>
        ) : pibEstados && pibEstados.length > 0 ? (
          <BarChartEcharts
            items={pibEstados.map((e) => ({ label: e.uf, value: e.value }))}
            color="#22c55e"
            valueFormatter={compactBrl}
          />
        ) : (
          <p className="text-slate-500 text-sm">Sem dados de PIB por estado.</p>
        )}
      </motion.div>
    </motion.div>
  );
}
