// API: Banco Central do Brasil (BCB)
// Endpoints consumidos:
//   GET /bcb/dollar/ptax → useDollarPtax()
//   GET /bcb/selic       → useSelic()
//   GET /bcb/cdi         → useCdiRate()
//   GET /bcb/ipca        → useIpca()

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { DollarSign, TrendingUp, BarChart3, Percent, LoaderCircle } from 'lucide-react';
import { useDollarPtax, useSelic, useCdiRate, useIpca } from '../../../hooks/UseEconomy';
import { container, item } from '../../../lib/motion/presets';

// ─── Imagens dos indicadores ─────────────────────────────────────────────────
// Carrega tudo de assets/imagesPage automaticamente. Basta soltar arquivos
// nomeados com a "key" do indicador (ex: dollar-img.jpeg, selic-img.png).
const IMAGES = import.meta.glob(
  '../../../assets/indicadores/*.{jpeg,jpg,png,webp,avif}',
  { eager: true, import: 'default' },
) as Record<string, string>;

function findImage(key: string): string | undefined {
  const match = Object.entries(IMAGES).find(([path]) =>
    path.toLowerCase().includes(`${key}-img`),
  );
  return match?.[1];
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const pct = (v: number) => `${v.toFixed(2)}%`;
const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CARD_DELAYS = [60, 700, 1400, 2100] as const;

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
    <div className="flex justify-between items-center text-sm py-[3px] border-b border-slate-800/60 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-mono font-medium">{value}</span>
    </div>
  );
}

interface IndicatorCardProps {
  imageKey: string;
  gradient: string;        // classes tailwind do gradiente de fallback
  icon: React.ReactNode;
  title: string;
  badge: string;
  description: string;
  ready: boolean;
  children: React.ReactNode;
  imageClassName?: string; // CSS extra aplicado só à imagem deste card
}

// Classes-base: APENAS posicionamento. Transform/filter/animação/hover ficam
// por conta da classe individual no App.css (sem conflito com utilities Tailwind).
const BASE_IMG = 'absolute inset-0 w-full h-full';

function IndicatorCard({
  imageKey, gradient, icon, title, badge, description, ready, children,
  imageClassName = 'object-cover',
}: IndicatorCardProps) {
  const img = findImage(imageKey);

  return (
    <motion.article
      variants={item}
      className={[
        'group flex flex-col lg:flex-row overflow-hidden',
        'bg-slate-900 border border-slate-800 rounded-2xl',
        'hover:border-slate-600 hover:shadow-xl hover:shadow-black/30',
        'transition-all duration-500',
        ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
      ].join(' ')}
    >
      {/* ── Painel visual (imagem ou gradiente) ── */}
      <div className="relative lg:w-2/5 h-48 lg:h-auto shrink-0 overflow-hidden">
        {/* gradiente de fundo — sempre presente, serve de fallback */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

        {/* imagem por cima */}
        {img && (
          <img
            src={img}
            alt={title}
            loading="lazy"
            className={`${BASE_IMG} ${imageClassName}`}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}

        {/* overlay escuro para legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

        {/* selo de título sobre a imagem */}
        <div className="absolute bottom-0 left-0 p-5 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
              {icon}
            </span>
            <span className="text-white font-bold text-lg drop-shadow">{title}</span>
          </div>
          <span className="text-slate-300 text-[10px] uppercase tracking-widest">{badge}</span>
        </div>
      </div>

      {/* ── Conteúdo (dados + descrição) ── */}
      <div className="flex-1 flex flex-col p-6 gap-4">
        <div className="min-h-[96px]">{children}</div>
        <p className="text-slate-400 text-sm leading-relaxed border-t border-slate-800 pt-4">
          {description}
        </p>
      </div>
    </motion.article>
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
    <motion.div
      className="flex flex-col gap-6 max-w-5xl mx-auto"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-blue-500">Indicadores Econômicos</h1>
        <p className="text-slate-500 text-sm mt-1">
          Dados oficiais do Banco Central do Brasil, atualizados diariamente.
        </p>
      </motion.div>

      {/* ── Dólar PTAX ── */}
      <IndicatorCard
        imageKey="dollar"
        imageClassName="img-dollar"
        gradient="from-green-900 to-emerald-700"
        icon={<DollarSign size={16} />}
        title="Dólar PTAX"
        badge="Banco Central"
        ready={ready[0]}
        description={
          'Cotação oficial calculada pelo Banco Central com base nas operações do ' +
          'mercado interbancário ao longo do dia. É a referência para contratos, ' +
          'importações, exportações e o cálculo de IOF em remessas ao exterior.'
        }
      >
        {l0 ? <Spinner /> : e0 ? (
          <span className="text-red-400 text-sm">Falha ao carregar.</span>
        ) : dollar ? (
          <div className="flex flex-col gap-1">
            <p className="text-5xl font-bold text-green-500 tracking-tight">{brl(dollar.value)}</p>
            <p className="text-cyan-400 text-xs mt-1">Referência: {dollar.date}</p>
          </div>
        ) : null}
      </IndicatorCard>

      {/* ── Selic ── */}
      <IndicatorCard
        imageKey="selic"
        imageClassName="img-selic"
        gradient="from-red-900 to-rose-700"
        icon={<TrendingUp size={16} />}
        title="Taxa Selic"
        badge="Banco Central · COPOM"
        ready={ready[1]}
        description={
          'Taxa básica de juros da economia brasileira, definida pelo COPOM a cada 45 ' +
          'dias. Serve de piso para todos os juros do país e influencia diretamente o ' +
          'crédito, os investimentos em renda fixa e o controle da inflação.'
        }
      >
        {l1 ? <Spinner /> : e1 ? (
          <span className="text-red-400 text-sm">Falha ao carregar.</span>
        ) : selic ? (
          <div className="flex flex-col gap-2">
            <p className="text-5xl font-bold text-red-400 tracking-tight">{pct(selic.currentRate)}</p>
            <div className="flex flex-col mt-1">
              <Row label="Acumulado no mês"  value={pct(selic.accumulatedMonth)} />
              <Row label="Acumulado no ano"  value={pct(selic.accumulatedYear)} />
              <Row label="Últimos 12 meses"  value={pct(selic.last12MonthsCompound)} />
            </div>
          </div>
        ) : null}
      </IndicatorCard>

      {/* ── CDI ── */}
      <IndicatorCard
        imageKey="cdi"
        imageClassName="img-cdi"
        gradient="from-blue-900 to-sky-700"
        icon={<BarChart3 size={16} />}
        title="CDI"
        badge="Banco Central"
        ready={ready[2]}
        description={
          'Certificado de Depósito Interbancário — taxa média dos empréstimos de ' +
          'curtíssimo prazo entre bancos. É o principal benchmark da renda fixa: CDBs, ' +
          'fundos DI e LCIs costumam render um percentual do CDI.'
        }
      >
        {l2 ? <Spinner /> : e2 ? (
          <span className="text-red-400 text-sm">Falha ao carregar.</span>
        ) : cdi ? (
          <div className="flex flex-col gap-1">
            <p className="text-5xl font-bold text-blue-500 tracking-tight">{pct(cdi.annualRate)}</p>
            <div className="flex flex-col mt-1">
              <Row label="Taxa diária" value={`${cdi.dailyRate.toFixed(4)}%`} />
              <Row label="Referência"  value={cdi.date} />
            </div>
          </div>
        ) : null}
      </IndicatorCard>

      {/* ── IPCA ── */}
      <IndicatorCard
        imageKey="ipca"
        imageClassName="img-ipca"
        gradient="from-slate-700 to-slate-500"
        icon={<Percent size={16} />}
        title="IPCA"
        badge="Banco Central · IBGE"
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
            <p className="text-5xl font-bold text-slate-300 tracking-tight">{pct(ipca.currentMonth)}</p>
            <div className="flex flex-col mt-1">
              <Row label="Acumulado no ano"     value={pct(ipca.accumulatedYear)} />
              <Row label="Soma 12 meses"        value={pct(ipca.last12MonthsSum)} />
              <Row label="Composto 12 meses"    value={pct(ipca.last12MonthsCompound)} />
            </div>
          </div>
        ) : null}
      </IndicatorCard>

    </motion.div>
  );
}
