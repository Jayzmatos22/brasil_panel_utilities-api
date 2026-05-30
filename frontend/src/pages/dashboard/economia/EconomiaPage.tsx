// API: Banco Central do Brasil (BCB)
// Endpoints consumidos:
//   GET /bcb/dollar/ptax → useDollarPtax()
//   GET /bcb/selic       → useSelic()
//   GET /bcb/cdi         → useCdiRate()
//   GET /bcb/ipca        → useIpca()

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, BarChart3, Percent, LoaderCircle } from 'lucide-react';
import { useDollarPtax, useSelic, useCdiRate, useIpca } from '../../../hooks/UseEconomy';

// ─── delays para cada card (ms) ──────────────────────────────────────────────
const CARD_DELAYS = [60, 900, 1800, 2700] as const;

// ─── helpers ─────────────────────────────────────────────────────────────────
const pct = (v: number) => `${v.toFixed(2)}%`;
const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ─── sub-components ──────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center gap-2 text-slate-500 text-sm py-5">
      <LoaderCircle size={14} className="animate-spin" />
      Carregando dados…
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm py-[3px]">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-mono font-medium">{value}</span>
    </div>
  );
}

interface CardProps {
  icon: React.ReactNode;
  title: string;
  badge: string;
  description: string;
  ready: boolean;
  children: React.ReactNode;
}

function IndicadorCard({ icon, title, badge, description, ready, children }: CardProps) {
  return (
    <div
      className={[
        'flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-5',
        'hover:border-slate-600 hover:shadow-xl hover:shadow-black/30',
        'transition-all duration-700 ease-out',
        ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
      ].join(' ')}
    >
      {/* cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-yellow-500">{icon}</span>
          <span className="text-yellow-500 font-semibold text-xs uppercase tracking-widest">
            {title}
          </span>
        </div>
        <span className="text-slate-600 text-[10px] uppercase tracking-wider">{badge}</span>
      </div>

      {/* dados dinâmicos */}
      <div className="flex-1 min-h-[88px]">{children}</div>

      {/* texto explicativo */}
      <div className="border-t border-slate-800 mt-4 pt-4">
        <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── página ──────────────────────────────────────────────────────────────────
export default function EconomiaPage() {
  const [ready, setReady] = useState([false, false, false, false]);

  useEffect(() => {
    const timers = CARD_DELAYS.map((delay, i) =>
      setTimeout(
        () => setReady(prev => { const next = [...prev]; next[i] = true; return next; }),
        delay,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const { data: dollar, isLoading: l0, error: e0 } = useDollarPtax(ready[0]);
  const { data: selic,  isLoading: l1, error: e1 } = useSelic(ready[1]);
  const { data: cdi,    isLoading: l2, error: e2 } = useCdiRate(ready[2]);
  const { data: ipca,   isLoading: l3, error: e3 } = useIpca(ready[3]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Indicadores Econômicos</h1>
        <p className="text-slate-500 text-sm mt-1">
          Dados oficiais do Banco Central do Brasil, atualizados diariamente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* ── Dólar PTAX ── */}
        <IndicadorCard
          icon={<DollarSign size={15} />}
          title="Dólar PTAX"
          badge="BCB"
          ready={ready[0]}
          description={
            'Cotação oficial calculada pelo Banco Central com base nas operações ' +
            'do mercado interbancário. É a referência para contratos, importações ' +
            'e o cálculo de IOF em remessas ao exterior.'
          }
        >
          {l0 ? <Spinner /> : e0 ? (
            <span className="text-red-400 text-sm">Falha ao carregar.</span>
          ) : dollar ? (
            <div className="flex flex-col gap-1">
              <p className="text-4xl font-bold text-white tracking-tight">
                {brl(dollar.value)}
              </p>
              <p className="text-slate-500 text-xs mt-1">Referência: {dollar.date}</p>
            </div>
          ) : null}
        </IndicadorCard>

        {/* ── Selic ── */}
        <IndicadorCard
          icon={<TrendingUp size={15} />}
          title="Selic"
          badge="BCB · COPOM"
          ready={ready[1]}
          description={
            'Taxa básica de juros da economia brasileira, definida pelo COPOM a cada ' +
            '45 dias. Serve de piso para todos os juros do país e influencia o crédito, ' +
            'os investimentos e o controle da inflação.'
          }
        >
          {l1 ? <Spinner /> : e1 ? (
            <span className="text-red-400 text-sm">Falha ao carregar.</span>
          ) : selic ? (
            <div className="flex flex-col gap-2">
              <p className="text-4xl font-bold text-white tracking-tight">
                {pct(selic.currentRate)}
              </p>
              <div className="flex flex-col gap-[2px] mt-1">
                <Row label="Acum. mês"      value={pct(selic.accumulatedMonth)} />
                <Row label="Acum. ano"      value={pct(selic.accumulatedYear)} />
                <Row label="Últ. 12 meses"  value={pct(selic.last12MonthsCompound)} />
              </div>
            </div>
          ) : null}
        </IndicadorCard>

        {/* ── CDI ── */}
        <IndicadorCard
          icon={<BarChart3 size={15} />}
          title="CDI"
          badge="BCB"
          ready={ready[2]}
          description={
            'Certificado de Depósito Interbancário — taxa média dos empréstimos de ' +
            'curtíssimo prazo entre bancos. É o principal benchmark da renda fixa: ' +
            'CDBs, fundos DI e LCIs costumam render um percentual do CDI.'
          }
        >
          {l2 ? <Spinner /> : e2 ? (
            <span className="text-red-400 text-sm">Falha ao carregar.</span>
          ) : cdi ? (
            <div className="flex flex-col gap-1">
              <p className="text-4xl font-bold text-white tracking-tight">
                {pct(cdi.annualRate)}
              </p>
              <div className="flex flex-col gap-[2px] mt-1">
                <Row label="Taxa diária"  value={`${cdi.dailyRate.toFixed(4)}%`} />
                <Row label="Referência"   value={cdi.date} />
              </div>
            </div>
          ) : null}
        </IndicadorCard>

        {/* ── IPCA ── */}
        <IndicadorCard
          icon={<Percent size={15} />}
          title="IPCA"
          badge="BCB · IBGE"
          ready={ready[3]}
          description={
            'Índice Nacional de Preços ao Consumidor Amplo — o indicador oficial de ' +
            'inflação do Brasil, apurado pelo IBGE. É a meta perseguida pelo Banco ' +
            'Central: quando sobe demais, o COPOM eleva a Selic para conter o consumo.'
          }
        >
          {l3 ? <Spinner /> : e3 ? (
            <span className="text-red-400 text-sm">Falha ao carregar.</span>
          ) : ipca ? (
            <div className="flex flex-col gap-2">
              <p className="text-4xl font-bold text-white tracking-tight">
                {pct(ipca.currentMonth)}
              </p>
              <div className="flex flex-col gap-[2px] mt-1">
                <Row label="Acum. ano"       value={pct(ipca.accumulatedYear)} />
                <Row label="Soma 12 meses"   value={pct(ipca.last12MonthsSum)} />
                <Row label="Comp. 12 meses"  value={pct(ipca.last12MonthsCompound)} />
              </div>
            </div>
          ) : null}
        </IndicadorCard>

      </div>
    </div>
  );
}
