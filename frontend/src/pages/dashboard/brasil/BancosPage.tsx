import { useState, type ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { LoaderCircle, Search } from 'lucide-react';
import { useAllBanks, useBankByCode } from '../../../hooks/UseBanks';
import { container, item } from '../../../lib/motion/presets';

// ============================================================================
// 1. IMPORTAÇÃO DINÂMICA DE IMAGENS (Padrão Vite)
// ============================================================================
const BANCOS_IMAGES = import.meta.glob('../../../assets/bancos/*.{jpeg,jpg,png,webp,avif}', { 
  eager: true, 
  import: 'default' 
}) as Record<string, string>;

function findBancosImage(term: string): string | undefined {
  const match = Object.entries(BANCOS_IMAGES).find(([path]) => path.toLowerCase().includes(term));
  return match?.[1];
}

export default function BancosPage() {
  const [search, setSearch] = useState('');
  const [code, setCode] = useState(0);
  const [codeInput, setCodeInput] = useState('');

  const { data: banks, isLoading: loadingAll } = useAllBanks();
  const { data: byCode, isLoading: loadingCode } = useBankByCode(code);

  const filtered = banks?.filter(b =>
    b.name && b.code && (
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      String(b.code).includes(search)
    )
  ) ?? [];

  const handleCodeSearch = (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = parseInt(codeInput, 10);
    if (!isNaN(parsed) && parsed > 0) setCode(parsed);
  };

  const headerImage = findBancosImage('cambio-img') || Object.values(BANCOS_IMAGES)[0];

  return (
    <motion.div 
      className="flex flex-col gap-8 bg-[#020617] min-h-screen py-6" // Assuming slate-950 page background
      variants={container} 
      initial="hidden" 
      animate="show"
      exit="exit" 
    >
      {/* ══════════════════════════════════════════════════════════════════
          HERO — Emerging 3D Banner, BACEN/Central Bank aesthetic
         ══════════════════════════════════════════════════════════════════ */}
      <motion.header
        variants={item}
        className="group relative min-h-[340px] flex items-end bg-[#020617] rounded-2xl overflow-hidden"
        style={{ 
          transform: 'perspective(1200px) rotateX(2deg)', 
          transformOrigin: 'bottom center' 
        }}
      >
        {headerImage ? (
          <>
            {/* Ambient Financial Glow (Navy & Gold) projecting off the screen */}
            <div 
              className="absolute inset-0 z-0 scale-150 translate-y-10 blur-3xl opacity-50"
              style={{ background: 'radial-gradient(circle at 60% 40%, #002776 0%, #FFDF00 30%, transparent 70%)' }}
            />

            {/* The Image */}
            <img
              src={headerImage}
              alt="Fundo Bancos"
              className="absolute inset-0 w-full h-full object-cover object-center scale-110 transition-transform duration-[1400ms] ease-out group-hover:scale-[1.2] z-[1] drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)]"
              style={{ filter: 'brightness(1.05) contrast(1.1) saturate(1.2)' }}
            />

            {/* The Merging Mask - Dissolves the image edges into the #020617 background */}
            <div 
              className="absolute inset-0 z-[2]"
              style={{ background: 'radial-gradient(ellipse 70% 65% at 70% 40%, transparent 0%, rgba(2,6,23,0.6) 40%, #020617 80%)' }}
            />
            
            {/* Subtle bottom gradient for text readability */}
            <div className="absolute bottom-0 left-0 right-0 h-[60%] z-[2] bg-gradient-to-t from-[#020617] via-[#020617]/50 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[#020617]" />
        )}

        {/* Gold/Navy tricolor rail */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] z-[3] bg-gradient-to-b from-[#002776] via-[#FFDF00] to-[#009C3B] shadow-[0_0_18px_rgba(255,223,0,0.4)]" />

        {/* Content Overlay */}
        <div className="relative z-10 p-6 sm:p-10 w-full">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
              BACEN · Live
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200 backdrop-blur-sm">
              Sistema Financeiro Nacional
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] mb-6">
            Bancos do <span className="text-[#FFDF00]">Brasil</span>
          </h1>

          {/* Search Form - Premium Glassmorphism */}
          <form onSubmit={handleCodeSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl relative z-20">
            <input
              type="number"
              value={codeInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCodeInput(e.target.value)}
              placeholder="Código da instituição (Ex: 341)"
              className="flex-1 h-12 px-5 rounded-xl bg-white/10 backdrop-blur-md text-white border border-white/20 
                         placeholder-slate-300/70 outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 
                         transition-all text-sm font-mono shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            />
            <button
              type="submit"
              className="h-12 px-6 bg-yellow-500 hover:bg-yellow-400 text-slate-950 cursor-pointer rounded-xl
                         flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95 
                         shadow-[0_4px_20px_rgba(250,204,21,0.3)]"
            >
              <Search size={16} />
              Consultar
            </button>
          </form>

          {/* Result Area */}
          <div className="mt-4 min-h-24 relative z-20">
            {loadingCode && code > 0 && (
              <div className="flex items-center gap-2 text-slate-300 text-sm backdrop-blur-md bg-white/5 w-fit px-4 py-2 rounded-lg border border-white/10">
                <LoaderCircle size={14} className="animate-spin text-yellow-400" /> Buscando instituição...
              </div>
            )}

            {byCode && !loadingCode && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mt-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-6 py-4 
                           shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col gap-2 max-w-2xl"
              >
                <p className="text-white font-bold text-lg drop-shadow-md">{byCode.name}</p>
                <p className="text-slate-300 text-sm drop-shadow-md">{byCode.fullName}</p>
                <div className="flex gap-6 mt-2 pt-3 border-t border-white/10 text-xs text-slate-400">
                  <span>Código: <span className="text-yellow-400 font-mono font-bold">{byCode.code}</span></span>
                  <span>ISPB: <span className="text-slate-200 font-mono">{byCode.ispb}</span></span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.header>

      {/* ══════════════════════════════════════════════════════════════════
          DATA TABLE — Deep translucent premium list
         ══════════════════════════════════════════════════════════════════ */}
      <motion.div 
        variants={item} 
        className="relative bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_0_60px_-15px_rgba(250,204,21,0.05)]"
      >
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            Instituições Ativas {banks && `(${filtered.length})`}
          </h2>
          
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Filtrar por nome ou código..."
              className="h-10 pl-10 pr-4 rounded-xl bg-white/5 text-white border border-white/10 
                         placeholder-slate-500 outline-none focus:ring-2 focus:ring-yellow-400/30 transition-all text-sm w-72"
            />
          </div>
        </div>

        {loadingAll ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-8 justify-center">
            <LoaderCircle size={16} className="animate-spin text-yellow-400" /> Carregando bancos...
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto styled-scrollbar">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-950/90 backdrop-blur-sm z-10">
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-slate-500 font-medium w-24 text-xs uppercase tracking-wider">Código</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium text-xs uppercase tracking-wider">Nome</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-medium hidden md:table-cell text-xs uppercase tracking-wider">ISPB</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(bank => (
                  <tr 
                    key={bank.ispb} 
                    className="border-b border-white/5 hover:bg-yellow-500/5 hover:text-white transition-colors group/row cursor-default"
                  >
                    <td className="py-3 px-4 text-yellow-400/80 font-mono group-hover/row:text-yellow-300 transition-colors">{bank.code}</td>
                    <td className="py-3 px-4 text-slate-300 group-hover/row:text-white transition-colors font-medium">{bank.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs hidden md:table-cell group-hover/row:text-slate-400 transition-colors">{bank.ispb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-12">Nenhuma instituição encontrada.</p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}