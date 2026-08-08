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
      /* Sem fundo próprio, de propósito. O container tinha bg-slate-950/40, que
         punha uma lâmina azulada entre a imagem e a página e criava justamente a
         borda que se queria dissolver. Sem ela, o que aparece atrás da imagem é o
         gradiente real do dashboard — e aí não há dois materiais, só um. */
      className="@container/banner relative overflow-hidden rounded-panel"
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
              /* A máscara é o único mecanismo de fusão daqui. Ela torna o pixel
                 transparente de verdade, então o que aparece na transição é o
                 fundo REAL da página, seja qual for a cor dele.

                 É diferente de sobrepor um gradiente colorido: aquele precisa
                 acertar a cor do fundo, e antes errava — desvanecia para
                 slate-950 (#020617) enquanto o dashboard é #05070d→#0b0f1a. Dez
                 pontos de azul a mais, o que lia como moldura em vez de fusão.

                 As paradas foram para 40%/60%: antes eram 15%/85%, ou seja, a
                 imagem ficava opaca em 70% da largura e só então caía — a queda
                 curta é que virava aresta. Agora ela desvanece durante quase toda
                 a superfície e chega nas bordas já em zero. */
              WebkitMaskImage: `
                linear-gradient(to right, transparent, black 28%, black 72%, transparent),
                linear-gradient(to bottom, transparent, black 22%, black 78%, transparent),
                radial-gradient(ellipse at 50% 45%, black 35%, transparent 88%)
              `,
              maskImage: `
                linear-gradient(to right, transparent, black 28%, black 72%, transparent),
                linear-gradient(to bottom, transparent, black 22%, black 78%, transparent),
                radial-gradient(ellipse at 50% 45%, black 35%, transparent 88%)
              `,
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          />
        </div>
      )}

      {/* 2. Legibilidade do texto — PRETO, não slate.
             Antes eram duas camadas: uma vinheta `inset 0 0 100px rgba(2,6,23,1)`
             com alfa 1, e um gradiente `from-slate-950`. As duas eram opacas e
             azuladas, e pintavam por cima da máscara — a máscara dissolvia a
             imagem e elas redesenhavam a borda logo em seguida.

             Preto puro resolve porque só reduz luminância, sem deslocar matiz:
             escurece o suficiente para o texto ter contraste e continua correto
             sobre qualquer ponto do gradiente do dashboard, que varia de #05070d
             no topo a #0b0f1a embaixo. Um slate fixo só acertaria uma altura. */}
      <div className="absolute inset-0 z-10 bg-linear-to-t from-black/80 via-black/10 to-black/40" />

      {/* Conteúdo (Z-index alto para ficar acima de tudo) */}
      {/* min-h-65 (260px) fixo + p-8 faziam o banner ocupar mais de 60% da tela
          em 375px, antes de qualquer dado aparecer. Ambos passam a ser fluidos:
          176→260px de altura e 20→40px de padding. */}
      <div className="relative z-20 flex min-h-banner-min flex-col justify-between p-banner">
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
          
          <h1 className="text-display font-bold text-white">
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
          <div className="mt-section">
            <QuickNav items={navItems} />
          </div>
        )}
      </div>
    </motion.section>
  );
});