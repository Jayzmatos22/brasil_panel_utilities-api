/**
 * PageBanner — banner de cabeçalho de página com imagem de fundo.
 *
 * Estrutura:
 *  ┌──────────────────────────────────────────┐
 *  │                                          │
 *  │              [IMAGEM DE FUNDO]            │  ← gradient overlay
 *  │                                          │
 *  │  Badge                                   │
 *  │  TÍTULO GRANDE                           │  ← top (alinhado à esquerda)
 *  │  Subtítulo                               │
 *  │                                          │
 *  │  ────────────────────────────────────    │
 *  │  [ QuickNav ]                            │  ← bottom (alinhado à esquerda)
 *  └──────────────────────────────────────────┘
 *
 * Uso:
 *  <PageBanner
 *    image="url-da-imagem"
 *    title="Exportações Brasileiras"
 *    titleAccent="Brasileiras"
 *    subtitle="..."
 *    badge="IPEA · Comex"
 *    navItems={NAV_ITEMS_EXPORTS}
 *  />
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import { itemVariants } from '../../../constants/indicators/Motion';
import { QuickNav, type NavItem } from './QuickNav';

export interface PageBannerProps {
  /** URL da imagem de fundo (Vite-resolved via import.meta.glob). */
  image?: string;
  /** Gradiente Tailwind para overlay no topo da imagem (ex: 'from-emerald-950/80 to-transparent'). */
  gradient?: string;
  badge?: string;
  title: string;
  /** Parte do título que deve aparecer com cor de destaque. */
  titleAccent?: string;
  subtitle?: string;
  /** Itens da QuickNav (vai para a parte inferior do banner). */
  navItems?: NavItem[];
  /** Cor temática do badge e do título destaque. Default: amarelo Brasil. */
  accentColor?: string;
}

export const PageBanner = memo(function PageBanner({
  image,
  gradient = 'from-slate-950/85 via-slate-950/60 to-slate-950/30',
  badge,
  title,
  titleAccent,
  subtitle,
  navItems,
  accentColor = '#FFDF00',
}: PageBannerProps) {
  return (
    <motion.section
      variants={itemVariants}
      className="relative overflow-hidden rounded-2xl border border-white/10
                 shadow-[0_8px_40px_-15px_rgba(0,0,0,0.5)]"
    >
      {/* Imagem de fundo */}
      {image && (
        <img
          src={image}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Overlays de legibilidade — gradiente do topo + gradiente do rodapé */}
      <div className={`absolute inset-0 bg-linrar-to-b ${gradient}`} />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-slate-950 via-slate-950/80 to-transparent" />

      {/* Conteúdo */}
      <div className="relative flex min-h-[65 flex-col justify-between p-6 lg:p-8">
        {/* Topo: badge + título + subtítulo */}
        <div className="flex flex-col gap-2">
          {badge && (
            <span
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] backdrop-blur-sm"
              style={{ color: accentColor }}
            >
              {badge}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
            {titleAccent ? (
              <>
                {title.replace(titleAccent, '').trim()}{' '}
                <span style={{ color: accentColor }}>{titleAccent}</span>
              </>
            ) : (
              title
            )}
          </h1>
          {subtitle && (
            <p className="text-slate-300 text-sm mt-1 max-w-2xl drop-shadow-md">
              {subtitle}
            </p>
          )}
        </div>

        {/* Rodapé: QuickNav dentro do banner */}
        {navItems && navItems.length > 0 && (
          <div className="mt-6">
            <QuickNav items={navItems} />
          </div>
        )}
      </div>
    </motion.section>
  );
});