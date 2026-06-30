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

import { memo } from "react";
import { motion } from "motion/react";
import { itemVariants } from "../../../constants/indicators/Motion";
import { QuickNav, type NavItem } from "./QuickNav";

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
  badge,
  title,
  titleAccent,
  subtitle,
  navItems,
  accentColor = "#FFDF00",
}: PageBannerProps) {
  return (
    <motion.section
      variants={itemVariants}
      className="relative overflow-hidden rounded-2xl bg-slate-950/40" // Fundo semi-transparente para o container
    >
      {/* 1. Camada de Profundidade (A imagem que "sai" do fundo) */}
      {image && (
        <div className="absolute inset-0 z-0">
          <motion.img
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }} // Opacidade reduzida para fundir com o slate
            transition={{ duration: 1.5, ease: "easeOut" }}
            src={image}
            alt=""
            aria-hidden
            className="h-full w-full object-cover grayscale-20 brightness-[0.7]"
            style={{
              // Máscara mais agressiva: 
              // Linear nas bordas para sumir com o corte do card + Radial no centro
              WebkitMaskImage: `
                linear-gradient(to right, transparent, black 15%, black 85%, transparent),
                linear-gradient(to bottom, transparent, black 15%, black 85%, transparent),
                radial-gradient(circle at 50% 50%, black 30%, transparent 90%)
              `,
              maskImage: `
                linear-gradient(to right, transparent, black 15%, black 85%, transparent),
                linear-gradient(to bottom, transparent, black 15%, black 85%, transparent),
                radial-gradient(circle at 50% 50%, black 30%, transparent 90%)
              `,
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          />
        </div>
      )}

      {/* 2. Overlay de "Vignette" para garantir que as bordas sejam EXATAMENTE a cor do fundo */}
      <div className="absolute inset-0 z-0 pointer-events-none ring-1 ring-inset ring-white/0 rounded-2xl shadow-[inset_0_0_100px_rgba(2,6,23,1)]" />

      {/* 3. Gradientes de Legibilidade */}
      <div className="absolute inset-0 z-10 bg-linear-to-t from-slate-950 via-transparent to-slate-950/50" />

      {/* Conteúdo (Z-index alto para ficar acima de tudo) */}
      <div className="relative z-20 flex min-h-65 flex-col justify-between p-8 lg:p-10">
        <div className="flex flex-col gap-3">
          {badge && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] backdrop-blur-md"
              style={{ color: accentColor }}
            >
              {badge}
            </motion.span>
          )}
          
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white">
            {titleAccent ? (
              <>
                {title.replace(titleAccent, "").trim()}{" "}
                <span style={{ color: accentColor }} className="drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  {titleAccent}
                </span>
              </>
            ) : (
              title
            )}
          </h1>
          
          {subtitle && (
            <p className="text-slate-400 text-base mt-2 max-w-xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {navItems && navItems.length > 0 && (
          <div className="mt-10">
            <QuickNav items={navItems} />
          </div>
        )}
      </div>
    </motion.section>
  );
});