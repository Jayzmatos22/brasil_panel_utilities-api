// API: Banco Central do Brasil (BCB) & IPEA (Ibovespa)
import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign, TrendingUp, BarChart3, Percent, Activity, Sparkles,
} from 'lucide-react';
import { useDollarPtax, useSelic, useCdiRate, useIpca } from '../../../hooks/UseEconomy';
import { useIbovespa } from '../../../hooks/UseIpea';
import {
  containerVariants, itemVariants,
  IndicatorCard, DataRow,
  ChartPanel, RecentClosingsTable, PeriodExplorer, EducationalInsightsPanel,
  QuickNav, type NavItem,
  fmtPct as pct, fmtBRL as brl, fmtPts as formatPts, fmtPctSigned,
  computeMetrics,
  describeFiveYearReturn, describeSixMonthReturn, describeVolatility,
  describeLast5Trend, describeAmplitude, describeSelicCorrelation,
} from '../../../components/indicators/Indicators';

// ─── QuickNav items ─────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { id: 'sec-ibovespa',  label: 'Ibovespa',    color: '#818cf8' },
  { id: 'sec-hist-5y',   label: '5 Anos',      color: '#c084fc' },
  { id: 'sec-hist-6m',   label: '6 Meses',     color: '#38bdf8' },
  { id: 'sec-explorer',  label: 'Explorador',  color: '#a78bfa' },
  { id: 'sec-closings',  label: 'Fechamentos', color: '#a5b4fc' },
  { id: 'sec-insights',  label: 'Insights',    color: '#c084fc' },
  { id: 'sec-dollar',    label: 'Dólar',       color: '#4ade80' },
  { id: 'sec-selic',     label: 'Selic',       color: '#f87171' },
  { id: 'sec-cdi',       label: 'CDI',         color: '#60a5fa' },
  { id: 'sec-ipca',      label: 'IPCA',        color: '#cbd5e1' },
];

// ─── Main Page ──────────────────────────────────────────────────────────────
function EconomiaPage() {
  const { data: ibovData, isLoading: lIbov, error: eIbov, refetch: rIbov } = useIbovespa();
  const { data: dollar,   isLoading: l0,    error: e0,    refetch: r0 } = useDollarPtax();
  const { data: selic,    isLoading: l1,    error: e1,    refetch: r1 } = useSelic();
  const { data: cdi,      isLoading: l2,    error: e2,    refetch: r2 } = useCdiRate();
  const { data: ipca,     isLoading: l3,    error: e3,    refetch: r3 } = useIpca();

  // Último fechamento válido (geralmente D-1)
  const ibovespaLatest = useMemo(() => {
    if (!ibovData || ibovData.length === 0) return null;
    const rawData = ibovData[0].dados;
    if (!rawData || rawData.length === 0) return null;

    const validData = rawData
      .filter((item) => item.valor !== null)
      .sort((a, b) => b.data.localeCompare(a.data));
    if (validData.length === 0) return null;

    const latest = validData[0];
    const previous = validData.length > 1 ? validData[1] : null;
    let variation = null;
    if (previous && previous.valor) {
      variation = ((latest.valor - previous.valor) / previous.valor) * 100;
    }

    const dateParts = latest.data.substring(0, 10).split('-');
    return {
      value: latest.valor,
      date: `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`,
      variation,
    };
  }, [ibovData]);

  const ibovMetrics = useMemo(() => computeMetrics(ibovData), [ibovData]);

  const ibovInsights = useMemo(() => {
    if (!ibovMetrics) return { observations: [] as string[], insights: [] as { label: string; value: string; tone: 'pos' | 'neg' | 'neutral' }[] };
    const {
      fiveYearReturn, sixMonthReturn,
      fiveYearHigh, fiveYearLow,
      avgDailyAbsVar6m, positiveDays6m, negativeDays6m,
      last5Trend, last5NetPct,
    } = ibovMetrics;

    const observations: string[] = [];
    if (fiveYearReturn !== null) {
      observations.push(`No recorte de 5 anos, o índice apresenta ${describeFiveYearReturn(fiveYearReturn)}.`);
    }
    if (sixMonthReturn !== null) {
      observations.push(`Nos últimos 6 meses, ${describeSixMonthReturn(sixMonthReturn)}.`);
    }
    if (fiveYearHigh && fiveYearLow) {
      observations.push(`${describeAmplitude(fiveYearHigh, fiveYearLow, formatPts)}, ilustrando os ciclos clássicos de volatilidade da bolsa brasileira.`);
    }
    if (avgDailyAbsVar6m !== null) {
      observations.push(`${describeVolatility(avgDailyAbsVar6m, positiveDays6m, negativeDays6m)}.`);
    }
    if (last5Trend !== null && last5NetPct !== null) {
      observations.push(`${describeLast5Trend(last5Trend, last5NetPct)}.`);
    }
    observations.push(`${describeSelicCorrelation(sixMonthReturn, fiveYearReturn)}.`);

    const insights = [
      { label: 'Variação 5 anos', value: fiveYearReturn === null ? '—' : fmtPctSigned(fiveYearReturn), tone: (fiveYearReturn === null ? 'neutral' : fiveYearReturn >= 0 ? 'pos' : 'neg') as 'pos' | 'neg' | 'neutral' },
      { label: 'Variação 6 meses', value: sixMonthReturn === null ? '—' : fmtPctSigned(sixMonthReturn), tone: (sixMonthReturn === null ? 'neutral' : sixMonthReturn >= 0 ? 'pos' : 'neg') as 'pos' | 'neg' | 'neutral' },
      { label: 'Máxima 5 anos', value: fiveYearHigh ? `${formatPts(fiveYearHigh.value)}` : '—', tone: 'neutral' as const },
      { label: 'Mínima 5 anos', value: fiveYearLow ? `${formatPts(fiveYearLow.value)}` : '—', tone: 'neutral' as const },
    ];

    return { observations, insights };
  }, [ibovMetrics]);

  return (
    <motion.section
      className="flex flex-col gap-8 max-w-5xl mx-auto py-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
          Indicadores <span className="text-[#FFDF00]">Econômicos</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xl">
          Dados oficiais do Banco Central do Brasil e da B3, atualizados diariamente.
        </p>
      </motion.div>

      <QuickNav items={NAV_ITEMS} />

      {/* ── Ibovespa ── */}
      <IndicatorCard
        id="sec-ibovespa"
        imageKey="ibovespa"
        gradient="from-indigo-900 to-violet-800"
        icon={<Activity size={18} />}
        title="Ibovespa"
        badge="B3 · IPEA"
        isLoading={lIbov}
        error={eIbov}
        refetch={rIbov}
        description={
          'Principal índice de ações da bolsa de valores brasileira (B3). ' +
          'Reflete o desempenho médio das cotações das empresas mais negociadas e representativas do mercado. ' +
          'Os dados exibidos referem-se ao último fechamento de mercado consolidado.'
        }
      >
        {ibovespaLatest && (
          <div className="flex flex-col gap-2">
            <p className="text-5xl font-bold text-indigo-400 tracking-tight drop-shadow-[0_2px_10px_rgba(129,140,248,0.3)]">
              {formatPts(ibovespaLatest.value)} <span className="text-2xl text-indigo-400/50">pts</span>
            </p>
            <div className="flex flex-col mt-2">
              {ibovespaLatest.variation !== null && (
                <DataRow
                  label="Variação Diária (D/D-1)"
                  value={`${ibovespaLatest.variation > 0 ? '+' : ''}${ibovespaLatest.variation.toFixed(2)}%`}
                  valueClass={ibovespaLatest.variation >= 0 ? "text-emerald-400" : "text-red-400"}
                />
              )}
              <DataRow label="Data do Fechamento" value={ibovespaLatest.date} />
            </div>
          </div>
        )}
      </IndicatorCard>

      {/* ══ Dashboard Ibovespa ══ */}
      {ibovMetrics && (
        <>
          <ChartPanel
            id="sec-hist-5y"
            title="Histórico de 5 Anos"
            subtitle="Fechamento Ibovespa · longo prazo"
            icon={<Activity size={18} />}
            accent="#c084fc"
            points={ibovMetrics.fiveYearPoints}
            emptyHint="Sem dados válidos no intervalo de 5 anos."
          />

          <ChartPanel
            id="sec-hist-6m"
            title="Recente — 6 Meses"
            subtitle="Volatilidade e tendência de curto prazo"
            icon={<Sparkles size={18} />}
            accent="#38bdf8"
            points={ibovMetrics.sixMonthPoints}
            emptyHint="Sem dados válidos nos últimos 6 meses."
          />

          <PeriodExplorer id="sec-explorer" validAsc={ibovMetrics.validAsc} />

          <RecentClosingsTable id="sec-closings" rows={ibovMetrics.closings} />

          <EducationalInsightsPanel
            id="sec-insights"
            observations={ibovInsights.observations}
            insights={ibovInsights.insights}
          />
        </>
      )}

      {/* ── Dólar PTAX ── */}
      <IndicatorCard
        id="sec-dollar"
        imageKey="dollar"
        gradient="from-green-900 to-emerald-700"
        icon={<DollarSign size={18} />}
        title="Dólar PTAX"
        badge="Banco Central"
        isLoading={l0}
        error={e0}
        refetch={r0}
        description={
          'Cotação oficial calculada pelo Banco Central com base nas operações do ' +
          'mercado interbancário ao longo do dia. É a referência para contratos, ' +
          'importações, exportações e o cálculo de IOF em remessas ao exterior.'
        }
      >
        {dollar && (
          <div className="flex flex-col gap-2">
            <p className="text-5xl font-bold text-green-400 tracking-tight drop-shadow-[0_2px_10px_rgba(74,222,128,0.3)]">
              {brl(dollar.value)}
            </p>
            <p className="text-slate-300 text-xs mt-1 font-mono">Referência: {dollar.date}</p>
          </div>
        )}
      </IndicatorCard>

      {/* ── Selic ── */}
      <IndicatorCard
        id="sec-selic"
        imageKey="selic"
        gradient="from-red-900 to-rose-700"
        icon={<TrendingUp size={18} />}
        title="Taxa Selic"
        badge="Banco Central · COPOM"
        isLoading={l1}
        error={e1}
        refetch={r1}
        description={
          'Taxa básica de juros da economia brasileira, definida pelo COPOM a cada 45 ' +
          'dias. Serve de piso para todos os juros do país e influencia diretamente o ' +
          'crédito, os investimentos em renda fixa e o controle da inflação.'
        }
      >
        {selic && (
          <div className="flex flex-col gap-3">
            <p className="text-5xl font-bold text-red-400 tracking-tight drop-shadow-[0_2px_10px_rgba(248,113,113,0.3)]">
              {pct(selic.currentRate)}
            </p>
            <div className="flex flex-col mt-2">
              <DataRow label="Acumulado no mês"  value={pct(selic.accumulatedMonth)} />
              <DataRow label="Acumulado no ano"  value={pct(selic.accumulatedYear)} />
              <DataRow label="Últimos 12 meses"  value={pct(selic.last12MonthsCompound)} />
            </div>
          </div>
        )}
      </IndicatorCard>

      {/* ── CDI ── */}
      <IndicatorCard
        id="sec-cdi"
        imageKey="cdi"
        gradient="from-blue-900 to-sky-700"
        icon={<BarChart3 size={18} />}
        title="CDI"
        badge="Banco Central"
        isLoading={l2}
        error={e2}
        refetch={r2}
        description={
          'Certificado de Depósito Interbancário — taxa média dos empréstimos de ' +
          'curtíssimo prazo entre bancos. É o principal benchmark da renda fixa: CDBs, ' +
          'fundos DI e LCIs costumam render um percentual do CDI.'
        }
      >
        {cdi && (
          <div className="flex flex-col gap-2">
            <p className="text-5xl font-bold text-blue-400 tracking-tight drop-shadow-[0_2px_10px_rgba(96,165,250,0.3)]">
              {pct(cdi.annualRate)}
            </p>
            <div className="flex flex-col mt-2">
              <DataRow label="Taxa diária" value={`${cdi.dailyRate.toFixed(4)}%`} />
              <DataRow label="Referência"  value={cdi.date} />
            </div>
          </div>
        )}
      </IndicatorCard>

      {/* ── IPCA ── */}
      <IndicatorCard
        id="sec-ipca"
        imageKey="ipca"
        gradient="from-slate-800 to-slate-600"
        icon={<Percent size={18} />}
        title="IPCA"
        badge="Banco Central · IBGE"
        isLoading={l3}
        error={e3}
        refetch={r3}
        description={
          'Índice Nacional de Preços ao Consumidor Amplo — o indicador oficial de ' +
          'inflação do Brasil, apurado pelo IBGE. É a meta perseguida pelo Banco ' +
          'Central: quando sobe demais, o COPOM eleva a Selic para conter o consumo.'
        }
      >
        {ipca && (
          <div className="flex flex-col gap-3">
            <p className="text-5xl font-bold text-slate-100 tracking-tight drop-shadow-[0_2px_10px_rgba(241,245,249,0.2)]">
              {pct(ipca.currentMonth)}
            </p>
            <div className="flex flex-col mt-2">
              <DataRow label="Acumulado no ano"     value={pct(ipca.accumulatedYear)} />
              <DataRow label="Soma 12 meses"        value={pct(ipca.last12MonthsSum)} />
              <DataRow label="Composto 12 meses"    value={pct(ipca.last12MonthsCompound)} />
            </div>
          </div>
        )}
      </IndicatorCard>

    </motion.section>
  );
}

export default memo(EconomiaPage);