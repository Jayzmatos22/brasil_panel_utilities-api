/**
 * IndicatorCard.tsx — card visual padrão para indicadores.
 *
 * Estrutura: painel esquerdo (imagem + gradiente + título) | painel direito
 * (slots para children + descrição fixa no rodapé).
 *
 * Não conhece domínio (impostos, ibovespa, etc.) — recebe tudo por props.
 * Os `children` preenchem o espaço de dados (número, variações, etc.).
 */

import { memo, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { itemVariants } from '../../../constants/indicators/Motion';
import { findImage } from '../Helpers';
import { Skeleton, ErrorState } from './Atoms';


export interface IndicatorCardProps {
  id?: string;
  imageKey: string;
  /** Em qual pasta de assets buscar a imagem. Default: 'indicadores'. */
  imageFolder?: 'indicadores' | 'impostos';
  gradient: string;
  /** Ícone lucide já dimensionado. */
  icon: ReactNode;
  title: string;
  badge: string;
  description: string;
  isLoading: boolean;
  error: Error | null;
  refetch?: () => void;
  children: ReactNode;
}




export const IndicatorCard = memo(function IndicatorCard({
  id,
  imageKey,
  imageFolder = 'indicadores',
  gradient,
  icon,
  title,
  badge,
  description,
  isLoading,
  error,
  refetch,
  children,
}: IndicatorCardProps) {
  const img = findImage(imageKey, imageFolder);


  return (
    <motion.article
      id={id}
      variants={itemVariants}
      // scroll-mt-24 reserva espaço para a QuickNav sticky ao rolar até aqui.
      className="group relative flex flex-col lg:flex-row overflow-hidden bg-white/[0.02]
                 backdrop-blur-md border border-white/10 rounded-2xl
                 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)] scroll-mt-24"
    >
      {/* ── Painel visual (esquerda) ── */}
      <div className="relative lg:w-2/5 aspect-video lg:aspect-auto shrink-0 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

        {img && (
          <img
            src={img}
            alt=""
            role="presentation"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            // Máscara radial: a imagem "emerge" do gradiente em vez de cobri-lo.
            style={{
              WebkitMaskImage:
                'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 70%)',
              maskImage:
                'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 70%)',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        {/* Gradiente para baixo para legibilidade do título no canto inferior. */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/60 to-transparent" />

        <div className="absolute bottom-0 left-0 p-6 flex flex-col gap-2 z-10">
          <div className="flex items-center gap-3">
            <span
              className="w-9 h-9 rounded-xl bg-amber-500/90 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 backdrop-blur-sm"
              aria-hidden="true"
            >
              {icon}
            </span>
            <span className="text-white font-bold text-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {title}
            </span>
          </div>
          <span className="text-slate-300 text-[10px] uppercase tracking-[0.2em] font-semibold drop-shadow-md">
            {badge}
          </span>
        </div>
      </div>

      {/* ── Painel de conteúdo (direita) ── */}
      <div className="flex-1 flex flex-col p-6 lg:p-8 gap-5">
        <div
          className="min-h-[130px] flex flex-col justify-center"
          role="status"
          aria-live="polite"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <div className="flex flex-col gap-3 w-full" aria-hidden="true">
              <Skeleton className="h-12 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ) : error ? (
            <ErrorState error={error} refetch={refetch} />
          ) : (
            children
          )}
        </div>
        <p className="text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-5">
          {description}
        </p>
      </div>
    </motion.article>
  );
});
