// TEMPORÁRIO — três propostas de 404 para escolha visual.
// Este arquivo é descartado depois que uma delas for escolhida.
import { Link } from 'react-router-dom';
import { findAuthImage } from './auth/images';

const TITULO = 'Página não encontrada';
const CORPO = 'O endereço acessado não existe ou foi movido.';

const BOTAO_PRIMARIO =
  'inline-flex items-center justify-center rounded-control bg-amber-500 px-6 py-3 ' +
  'text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400 coarse:min-h-11 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60';

const BOTAO_FANTASMA =
  'inline-flex items-center justify-center rounded-control border border-hairline-strong px-6 py-3 ' +
  'text-sm font-semibold text-slate-200 transition-colors hover:border-white/25 hover:bg-white/5 ' +
  'coarse:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60';

const EYEBROW = 'text-eyebrow font-medium uppercase tracking-[0.18em] text-amber-400';

function Acoes() {
  return (
    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
      <Link to="/dashboard/economia" className={BOTAO_PRIMARIO}>
        Ir para o painel
      </Link>
      <Link to="/sobre" className={BOTAO_FANTASMA}>
        Conhecer o projeto
      </Link>
    </div>
  );
}

/* ══ A — Série de dados interrompida ═══════════════════════════════════════
   A metáfora sai do próprio produto: um painel de séries temporais. A linha
   corre com dados, some num vão, e volta pontilhada. O ponto que falta é o
   endereço que não existe. */

const SERIE_ANTES: readonly (readonly [number, number])[] = [
  [0, 150], [90, 128], [180, 140], [270, 96], [360, 108], [450, 70],
];
const SERIE_DEPOIS: readonly (readonly [number, number])[] = [
  [750, 74], [840, 52], [930, 66], [1020, 34], [1110, 48], [1200, 30],
];
const caminho = (p: readonly (readonly [number, number])[]) =>
  p.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');

function VarianteA() {
  return (
    <div className="w-full max-w-3xl">
      <p className={EYEBROW}>Erro 404</p>
      <h1 className="mt-5 text-display font-semibold text-white">{TITULO}</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">{CORPO}</p>

      <div className="relative mt-10">
        <svg
          viewBox="0 0 1200 180"
          preserveAspectRatio="none"
          className="h-40 w-full"
          aria-hidden="true"
        >
          <defs>
            <pattern id="g404" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M60 0H0v60" fill="none" stroke="currentColor"
                    strokeWidth="1" className="text-white" opacity="0.05" />
            </pattern>
          </defs>
          <rect width="1200" height="180" fill="url(#g404)" />

          {/* Trecho com dados: contínuo e mais forte. */}
          <path d={caminho(SERIE_ANTES)} fill="none" stroke="#10b981"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          {SERIE_ANTES.map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="3.5" fill="#10b981" opacity="0.9" />
          ))}

          {/* O VÃO. Pontilhado e apagado: a série continua existindo, mas este
              trecho não tem leitura. */}
          <path d="M450 70 L750 74" fill="none" stroke="#475569" strokeWidth="2"
                strokeDasharray="2 10" strokeLinecap="round" />

          {/* O ponto que falta, no meio do vão: círculo vazado. */}
          <circle cx="600" cy="72" r="7" fill="#020202" stroke="#f59e0b"
                  strokeWidth="2" strokeDasharray="3 3" />

          <path d={caminho(SERIE_DEPOIS)} fill="none" stroke="#10b981"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          {SERIE_DEPOIS.map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="3.5" fill="#10b981" opacity="0.9" />
          ))}
        </svg>

        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2
                         translate-y-3 text-nano uppercase tracking-[0.2em] text-amber-400/80">
          sem dados
        </span>
      </div>

      <Acoes />
    </div>
  );
}

/* ══ B — Com foto ══════════════════════════════════════════════════════════
   Mesma maquinaria das telas de auth: a ave dissolvendo no abyss. */

function VarianteB() {
  const arte = findAuthImage('registro-login0');
  return (
    <div className="relative w-full max-w-3xl">
      {arte !== undefined && (
        // z-0 e não -z-10: o ::before do .bg-smoke-abyss é OPACO e vive em
        // z-index -1, então qualquer coisa abaixo dele fica escondida. O
        // conteúdo sobe para z-10, mesmo arranjo do AuthBackdrop.
        <div className="pointer-events-none absolute -inset-x-8 -top-24 bottom-0 z-0 overflow-hidden"
             aria-hidden="true">
          <img
            src={arte}
            alt=""
            className="h-full w-full object-cover opacity-45"
            style={{
              objectPosition: '58% 40%',
              filter: 'saturate(0.45) contrast(1.05) brightness(0.8)',
              maskImage:
                'radial-gradient(90% 70% at 72% 40%, rgb(0 0 0/1) 0%, rgb(0 0 0/0.6) 45%, rgb(0 0 0/0) 85%)',
            }}
          />
        </div>
      )}
      <div className="relative z-10">
        <p className={EYEBROW}>Erro 404</p>
        <h1 className="mt-5 text-display font-semibold text-white">{TITULO}</h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">{CORPO}</p>
        <Acoes />
        <div className="h-40" />
      </div>
    </div>
  );
}

/* ══ C — Tipográfico puro ══════════════════════════════════════════════════ */

function VarianteC() {
  return (
    <div className="flex w-full max-w-3xl gap-6">
      <svg width="6" height="150" viewBox="0 0 6 150" fill="none"
           className="mt-2 shrink-0" aria-hidden="true">
        <rect x="0" y="0" width="6" height="50" rx="3" fill="#10b981" />
        <rect x="0" y="50" width="6" height="50" fill="#3b82f6" />
        <rect x="0" y="100" width="6" height="50" rx="3" fill="#f59e0b" />
      </svg>
      <div>
        <p className="text-[clamp(4rem,14vw,8rem)] font-bold leading-none tracking-tighter text-slate-800">
          404
        </p>
        <h1 className="mt-6 text-title font-semibold text-white">{TITULO}</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">{CORPO}</p>
        <Acoes />
      </div>
    </div>
  );
}

export function NotFoundVariants() {
  const v = new URLSearchParams(window.location.search).get('v') ?? 'a';
  if (v === 'b') return <VarianteB />;
  if (v === 'c') return <VarianteC />;
  return <VarianteA />;
}
