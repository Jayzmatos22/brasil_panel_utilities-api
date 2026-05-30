// API: Banco Central do Brasil (BCB)
// Endpoints consumidos:
//   GET /bcb/dollar/ptax → useDollarPtax()
//   GET /bcb/selic       → useSelic()
//   GET /bcb/cdi         → useCdiRate()
//   GET /bcb/ipca        → useIpca()

import { LoaderCircle } from 'lucide-react';
import { useDollarPtax, useSelic, useCdiRate, useIpca } from '../../../hooks/UseEconomy';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col gap-3">
      <h2 className="text-yellow-500 font-semibold text-sm uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center gap-2 text-slate-400 text-sm">
      <LoaderCircle size={16} className="animate-spin" />
      Carregando...
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-mono">{value}</span>
    </div>
  );
}

export default function EconomiaPage() {
  const { data: dollar,  isLoading: loadingDollar,  error: errDollar  } = useDollarPtax();
  const { data: selic,   isLoading: loadingSelic,   error: errSelic   } = useSelic();
  const { data: cdi,     isLoading: loadingCdi,     error: errCdi     } = useCdiRate();
  const { data: ipca,    isLoading: loadingIpca,    error: errIpca    } = useIpca();

  const pct = (v: number) => `${v.toFixed(2)}%`;
  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Indicadores Econômicos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Dólar PTAX */}
        <Card title="Dólar PTAX">
          {loadingDollar ? <Loading /> : errDollar ? (
            <span className="text-red-400 text-sm">Erro ao carregar.</span>
          ) : dollar ? (
            <>
              <p className="text-3xl font-bold text-white">{brl(dollar.value)}</p>
              <p className="text-slate-500 text-xs">Referência: {dollar.date}</p>
            </>
          ) : null}
        </Card>

        {/* Selic */}
        <Card title="Selic">
          {loadingSelic ? <Loading /> : errSelic ? (
            <span className="text-red-400 text-sm">Erro ao carregar.</span>
          ) : selic ? (
            <>
              <p className="text-3xl font-bold text-white">{pct(selic.currentRate)}</p>
              <div className="flex flex-col gap-1 mt-1">
                <Row label="Acum. mês"      value={pct(selic.accumulatedMonth)} />
                <Row label="Acum. ano"      value={pct(selic.accumulatedYear)} />
                <Row label="Últ. 12 meses"  value={pct(selic.last12MonthsCompound)} />
              </div>
            </>
          ) : null}
        </Card>

        {/* CDI */}
        <Card title="CDI">
          {loadingCdi ? <Loading /> : errCdi ? (
            <span className="text-red-400 text-sm">Erro ao carregar.</span>
          ) : cdi ? (
            <>
              <p className="text-3xl font-bold text-white">{pct(cdi.value)}</p>
              <p className="text-slate-500 text-xs">Referência: {cdi.date}</p>
            </>
          ) : null}
        </Card>

        {/* IPCA */}
        <Card title="IPCA">
          {loadingIpca ? <Loading /> : errIpca ? (
            <span className="text-red-400 text-sm">Erro ao carregar.</span>
          ) : ipca ? (
            <>
              <p className="text-3xl font-bold text-white">{pct(ipca.currentMonth)}</p>
              <div className="flex flex-col gap-1 mt-1">
                <Row label="Acum. ano"      value={pct(ipca.accumulatedYear)} />
                <Row label="Soma 12 meses"  value={pct(ipca.last12MonthsSum)} />
                <Row label="Comp. 12 meses" value={pct(ipca.last12MonthsCompound)} />
              </div>
            </>
          ) : null}
        </Card>

      </div>
    </div>
  );
}
