// API: World Bank
// Endpoints consumidos:
//   GET /worldbank          → useCurrentPibBrazil()
//   GET /worldbank/{year}   → usePibBrazilByYear(year)
//   GET /worldbank/series   → usePibSeries()

import { useState, useMemo, type ChangeEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { LoaderCircle, Landmark, CalendarSearch, LineChart, TrendingUp, TrendingDown, Minus, Map } from 'lucide-react';
import { useCurrentPibBrazil, usePibBrazilByYear, usePibSeries } from '../../../hooks/UseWorldBank';
import { usePibPorEstado } from '../../../hooks/UseSidra';
import { LineChartEcharts } from '../../../components/charts/LineChartEcharts';
import { BarChartEcharts } from '../../../components/charts/BarChartEcharts';
import { AnimatedNumber } from '../../../components/AnimatedNumber';
import { container, item } from '../../../lib/motion/presets';

// ============================================================================
// 1. IMPORTAÇÃO DINÂMICA DE IMAGENS (Padrão Metais)
// ============================================================================
const PIB_IMAGES = import.meta.glob('../../../assets/pib/*.{jpeg,jpg,png,webp,avif}', { 
  eager: true, 
  import: 'default' 
}) as Record<string, string>;

// Função para buscar imagens específicas por palavra-chave no nome do arquivo
function findPibImage(term: string): string | undefined {
  const match = Object.entries(PIB_IMAGES).find(([path]) => path.toLowerCase().includes(term));
  return match?.[1];
}

// ============================================================================
// 2. COMPONENTE DE ESQUELETO (Evita repetição de Tailwind/Framer Motion)
// ============================================================================
interface WidgetCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

function WidgetCard({ title, icon, children, className = '' }: WidgetCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -4 }} 
      className={`bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col gap-3 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-yellow-500">{icon}</span>
        <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

// ============================================================================
// FUNÇÕES DE FORMATAÇÃO
// ============================================================================
const compactBrl = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1e12) return `R$ ${(v / 1e12).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} tri`;
  if (abs >= 1e9)  return `R$ ${(v / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} bi`;
  if (abs >= 1e6)  return `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi`;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};

const fullBrl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================
export default function PibPage() {
  const [year, setYear] = useState<number>(2020);
  const { data: currentPib, isLoading: isCurrentPibLoading, error: currentPibError } = useCurrentPibBrazil();
  const { data: pibByYear,  isLoading: isPibByYearLoading,  error: pibByYearError  } = usePibBrazilByYear(year);
  const { data: series,     isLoading: isSeriesLoading,     error: seriesError     } = usePibSeries();
  const { data: pibEstados, isLoading: isEstadosLoading,    error: estadosError    } = usePibPorEstado();

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

  // 3. ARRAY DE CONFIGURAÇÃO PARA OS BLOCOS DE ESTATÍSTICA (Data-Driven)
  const statBlocks = useMemo(() => {
    if (!stats) return [];
    const up = stats.pct > 0;
    const down = stats.pct < 0;
    const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
    const colorClass = up ? 'text-green-400' : down ? 'text-red-400' : 'text-slate-400';
    const bgClass = up ? 'bg-green-500/10 border-green-700' : down ? 'bg-red-500/10 border-red-700' : 'bg-slate-800/60 border-slate-700';

    return [
      { label: stats.first.date, value: compactBrl(stats.first.value), isVar: false },
      { label: stats.last.date, value: compactBrl(stats.last.value), isVar: false },
      { 
        label: 'Variação no período', 
        value: `${up ? '+' : ''}${stats.pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`, 
        isVar: true, icon: <Icon size={12} className={colorClass} />, colorClass, bgClass 
      }
    ];
  }, [stats]);

  const handleYearChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') return setYear(2020);
    const newYear = parseInt(e.target.value, 10);
    if (!isNaN(newYear)) setYear(newYear);
  };

  // Pegamos a imagem dinamicamente (basta ter 'banner' no nome da imagem na pasta)
  const bannerImage = findPibImage('banner') || Object.values(PIB_IMAGES)[0];

  return (
    <motion.div className="flex flex-col gap-6" variants={container} initial="hidden" animate="show">
      
      {/* HEADER DINÂMICO COM IMAGEM */}
      <motion.div variants={item} className="relative overflow-hidden rounded-xl border border-green-400 p-6 flex flex-col justify-end min-h-35 float-card border-b-3">
        {bannerImage ? (
          <>
            <img src={bannerImage} alt="Banner PIB" className="absolute inset-0 w-full h-full object-cover opacity-100 pib-img-banner hover:scale-110" />
            <div className="absolute inset-0 bg-linear-to-t from-blue-900/70 via-blue-900/10 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-slate-900" />
        )}
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white">PIB do Brasil</h1>
          <p className="text-slate-400 text-sm mt-1">Produto Interno Bruto a preços correntes (R$), fonte World Bank.</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* WIDGET: PIB ATUAL */}
        <WidgetCard title="PIB mais recente" icon={<Landmark size={15} />} className="bg-pib-card-1">
          {isCurrentPibLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm"><LoaderCircle size={16} className="animate-spin" /> Carregando...</div>
          ) : currentPibError ? (
            <span className="text-red-400 text-sm">Erro ao carregar o PIB atual.</span>
          ) : currentPib && (
            <>
              <p className="text-4xl font-bold text-green-400 tracking-tight">
                <AnimatedNumber value={currentPib.value} format={compactBrl} />
              </p>
              <p className="text-slate-400 text-sm font-mono">{fullBrl(currentPib.value)}</p>
              <span className="inline-flex w-fit text-xs text-yellow-400 bg-yellow-500/15 px-2 py-0.5 rounded-full">Ano de referência: {currentPib.year}</span>
            </>
          )}
        </WidgetCard>

        {/* WIDGET: CONSULTAR POR ANO */}
        <WidgetCard title="Consultar por ano" icon={<CalendarSearch size={15} />} className="bg-pib-card-2">
          <div className="flex items-center gap-2">
            <input
              type="number" value={year} onChange={handleYearChange} placeholder="Ano"
              className="w-28 h-10 px-3 rounded-md bg-slate-300/80 text-black border border-slate-600 outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-sm"
             
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
              <span className="inline-flex w-fit text-xs text-yellow-400 bg-yellow-500/15 px-2 py-0.5 rounded-full">Ano de referência: {pibByYear.year}</span>
            </>
          ) : !isPibByYearLoading && (
            <p className="text-slate-500 text-sm">Sem dados para o ano {year}.</p>
          )}
        </WidgetCard>
      </motion.div>

      {/* WIDGET: SÉRIE HISTÓRICA */}
      <motion.div variants={item}>
        <WidgetCard title="Evolução histórica" icon={<LineChart size={15} />} className="gap-4 pib-container-grafico">
          {isSeriesLoading ? (
             <div className="flex items-center gap-2 text-slate-400 text-sm"><LoaderCircle size={16} className="animate-spin" /> Carregando série...</div>
          ) : seriesError ? (
            <span className="text-red-400 text-sm">Erro ao carregar a série histórica.</span>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-1">
                {/* RENDERIZAÇÃO DATA-DRIVEN DAS ESTATÍSTICAS */}
                {statBlocks.map((block, idx) => (
                  <div key={idx} className={`border  rounded-lg p-3 ${block.isVar ? block.bgClass : 'bg-slate-800/60 border-slate-700 border-b-3'}`}>
                    <p className="text-slate-400 text-xs uppercase tracking-wider flex items-center gap-1">
                      {block.icon} {block.label}
                    </p>
                    <p className={`font-bold text-lg ${block.isVar ? block.colorClass : 'text-white'}`}>
                      {block.value}
                    </p>
                  </div>
                ))}
              </div>
              <LineChartEcharts points={stats.points} color="#22c55e" />
            </>
          ) : (
            <p className="text-slate-500 text-sm">Série sem pontos suficientes para o gráfico.</p>
          )}
        </WidgetCard>
      </motion.div>

      {/* WIDGET: PIB POR ESTADO */}
      <motion.div variants={item}>
        <WidgetCard 
          title={`PIB por estado${pibEstados && pibEstados.length > 0 ? ` (${pibEstados[0].year})` : ''}`} 
          icon={<Map size={15} />} className="gap-4 pib-container-grafico"
        >
          {isEstadosLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm"><LoaderCircle size={16} className="animate-spin" /> Carregando PIB...</div>
          ) : estadosError ? (
            <span className="text-red-400 text-sm">Erro ao carregar o PIB por estado.</span>
          ) : pibEstados && pibEstados.length > 0 ? (
            <BarChartEcharts items={pibEstados.map((e) => ({ label: e.uf, value: e.value }))} color="#22c55e" valueFormatter={compactBrl} />
          ) : (
            <p className="text-slate-500 text-sm">Sem dados de PIB por estado.</p>
          )}
        </WidgetCard>
      </motion.div>

    </motion.div>
  );
}