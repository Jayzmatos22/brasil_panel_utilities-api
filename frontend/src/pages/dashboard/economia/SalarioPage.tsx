// APIs: Banco Central do Brasil (BCB) + IPEA
// Endpoints consumidos:
//   GET /bcb/minimum-wage         → useMinimumWage()
//   GET /bcb/minimum-wage/history → useMinimumWageHistory()
//   GET /ipea/renda               → useRenda()  (séries para contraste)

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { LoaderCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMinimumWage, useMinimumWageHistory } from '../../../hooks/UseEconomy';
import { useRenda } from '../../../hooks/UseIpea';
import { LineChartEcharts, type LinePoint } from '../../../components/charts/LineChartEcharts';
import { AnimatedNumber } from '../../../components/AnimatedNumber';
import { container, item } from '../../../lib/motion/presets';

// Imagem de banner da página (assets/salario/*-img.*)
const PAGE_IMAGES = import.meta.glob(
  '../../../assets/salario/*.{jpeg,jpg,png,webp,avif}',
  { eager: true, import: 'default' },
) as Record<string, string>;
const bannerImage = Object.values(PAGE_IMAGES)[0];

// Fontes contrastáveis. BCB = mínimo nominal; demais vêm do IPEA (/ipea/renda), DB-first.
const SOURCES = [
  { key: 'bcb',   label: 'Nominal (BCB)',                 unit: 'BRL', code: undefined },
  { key: 'real',  label: 'Mínimo real (IPEA)',            unit: 'BRL', code: 'GAC12_SALMINRE12' },
  { key: 'ppc',   label: 'Mínimo PPC em USD (IPEA)',      unit: 'USD', code: 'GAC12_SALMINDOL12' },
  { key: 'renda', label: 'Renda média per capita (IPEA)', unit: 'BRL', code: 'PNADS_RENDAMEDIA' },
] as const;

type SourceKey = (typeof SOURCES)[number]['key'];

function computeStats(points: LinePoint[]) {
  if (points.length < 2) return null;
  const first = points[0].value;
  const last = points[points.length - 1].value;
  const change = last - first;
  const pct = first !== 0 ? (change / first) * 100 : 0;
  const values = points.map((p) => p.value);
  return { change, pct, min: Math.min(...values), max: Math.max(...values) };
}

export default function SalarioPage() {
  const { data: current, isLoading: loadingCurrent, error: errCurrent } = useMinimumWage();
  const { data: history, isLoading: loadingHistory, error: errHistory } = useMinimumWageHistory();
  const { data: renda,   isLoading: loadingRenda,   error: errRenda   } = useRenda();

  const [source, setSource] = useState<SourceKey>('bcb');

  const latest = current?.[current.length - 1];
  const meta = SOURCES.find((s) => s.key === source)!;

  const money = (unit: 'BRL' | 'USD') => (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: unit });
  const brl = money('BRL');
  const fmt = money(meta.unit);

  // Pontos da fonte selecionada, em ordem cronológica crescente.
  const points = useMemo<LinePoint[]>(() => {
    if (source === 'bcb') {
      return (history ?? []).map((p) => ({ date: p.data, value: p.valor }));
    }
    const serie = renda?.find((s) => s.codigo === meta.code);
    if (!serie) return [];
    return serie.dados
      .filter((p) => p.valor != null)
      .map((p) => ({ date: p.data.slice(0, 10), value: p.valor as number }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [source, meta.code, history, renda]);

  const stats = useMemo(() => computeStats(points), [points]);
  const loadingChart = source === 'bcb' ? loadingHistory : loadingRenda;
  const errChart = source === 'bcb' ? errHistory : errRenda;

  return (
    <motion.div className="flex flex-col gap-6" variants={container} initial="hidden" animate="show">
      {/* Cabeçalho lado-a-lado: imagem (esq.) + título e valor atual (dir.) */}
      <motion.div
        variants={item}
        className="flex flex-col lg:flex-row overflow-hidden rounded-2xl border border-slate-700 group bg-linear-to-r from-green-100 to-green-400 "
      >
        {/* Painel da imagem */}
        <div className="relative lg:w-2/5 h-52 lg:h-auto shrink-0 overflow-hidden ">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-900 to-green-700" />
          {bannerImage && (
            <img
              src={bannerImage}
              alt="Salário Mínimo"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 "
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 to-transparent lg:bg-linear-to-r lg:from-transparent lg:to-slate-900/80" />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 flex flex-col justify-center p-6 gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-700">Salário Mínimo</h1>
            <p className="text-slate-700 text-sm mt-1">
              Valor nominal, real e comparativos de renda — BCB e IPEA.
            </p>
          </div>

          {/* Valor atual em destaque */}
          {loadingCurrent ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <LoaderCircle size={16} className="animate-spin" /> Carregando...
            </div>
          ) : latest ? (
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-bold text-white/80 border-3 bg-green-950 px-2 border-white rounded-lg ">
                <AnimatedNumber value={latest.valor} format={brl} />
              </p>
              <span className="text-slate-700 text-xs ">Vigência {latest.data}</span>
            </div>
          ) : null}
        </div>
      </motion.div>

      {/* Erro do valor atual (raro) — o valor em si fica no cabeçalho */}
      {errCurrent && (
        <motion.div variants={item} className="text-red-400 text-sm">
          Erro ao carregar o valor atual.
        </motion.div>
      )}

      {/* Histórico — gráfico com seletor de fonte para contraste */}
      <motion.div variants={item} whileHover={{ y: -4 }} className="bg-card-item border bg-card-filter border-slate-700 rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider ">Histórico</h2>
          <div className="flex items-center gap-2">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as SourceKey)}
              className="h-9 px-3 rounded-md bg-slate-800 text-white border border-slate-600 outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm"
            >
              {SOURCES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            <span className="text-green-500 text-xs">{meta.unit}</span>
          </div>
        </div>

        {loadingChart ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <LoaderCircle size={16} className="animate-spin" /> Carregando...
          </div>
        ) : errChart ? (
          <span className="text-red-400 text-sm">Erro ao carregar histórico.</span>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-green-800 rounded-lg p-3 flex flex-col gap-1 border-b border-white cursor-pointer hover:bg-green-700/60 float-card">
                <span className="text-white text-xs">Variação no período</span>
                <span
                  className={`flex items-center gap-1 font-mono font-semibold ${
                    stats.change > 0 ? 'text-green-200' : stats.change < 0 ? 'text-red-400' : 'text-slate-300'
                  }`}
                >
                  {stats.change > 0 ? <TrendingUp size={15} /> : stats.change < 0 ? <TrendingDown size={15} /> : <Minus size={15} />}
                  {stats.pct > 0 ? '+' : ''}{stats.pct.toFixed(2)}%
                </span>
              </div>
              <div className="bg-blue-500 rounded-lg p-3 flex flex-col gap-1 border-b border-white cursor-pointer float-card hover:bg-blue-400/60">
                <span className="text-white text-xs">Mínima</span>
                <span className="font-mono text-red-800 font-semibold">{fmt(stats.min)}</span>
              </div>
              <div className="bg-yellow-600 rounded-lg p-3 flex flex-col gap-1 border-b border-white cursor-pointer float-card hover:bg-yellow-500/60">
                <span className="text-white text-xs">Máxima</span>
                <span className="font-mono text-green-200 font-semibold">{fmt(stats.max)}</span>
              </div>
            </div>
            <LineChartEcharts points={points} color="#10b981" />
          </>
        ) : (
          <p className="text-slate-500 text-sm">Sem dados suficientes para o gráfico.</p>
        )}
      </motion.div>
    </motion.div>
  );
}
