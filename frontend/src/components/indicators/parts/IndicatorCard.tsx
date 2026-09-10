/**
 * IndicatorCard.tsx — card visual padrão para indicadores.
 *
 * Estrutura: painel esquerdo (imagem + gradiente + título) | painel direito
 * (slots para children + descrição fixa no rodapé).
 *
 * Não conhece domínio (impostos, ibovespa, etc.) — recebe tudo por props.
 * Os `children` preenchem o espaço de dados (número, variações, etc.).
 */

import { memo, type ReactNode } from "react";
import { motion } from "motion/react";
import { itemVariants } from "../../../constants/indicators/Motion";
import { findImage } from "../Helpers";
import { Skeleton, ErrorState } from "./Atoms";

export interface IndicatorCardProps {
  id?: string;
  imageKey: string;
  /** Em qual pasta de assets buscar a imagem. Default: 'indicadores'. */
  imageFolder?: 'indicadores' | 'impostos' | 'exportacoes' | 'cambioComercial' | 'balanca';
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
  imageFolder = "indicadores",
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
      // scroll-mt-24 reserva o deslocamento do topo ao ancorar nesta seção.
      //
      // O split em 2 colunas responde ao CONTAINER, não ao viewport: com `lg:`
      // ele disparava a 1024px de janela, largura em que a área de conteúdo tem
      // só 696px por causa da sidebar — e o card já entrava espremido.
      // `@3xl/page` espera o container ter 768px de fato.
      className="group relative flex flex-col @3xl/page:flex-row overflow-hidden bg-white/2
                 backdrop-blur-md border border-white/10 rounded-panel
                 shadow-panel scroll-mt-24"
    >
      {/* ── Painel visual (esquerda) ── */}
      <div className="relative @3xl/page:w-2/5 aspect-video @3xl/page:aspect-auto shrink-0 overflow-hidden">
        {/* Paleta do assunto. `opacity-50` NÃO é enfeite — sem ela a cor cobre
            quase todo o painel, e a imagem vira um vulto atrás de um vidro
            colorido.

            O mecanismo é a soma de duas coisas. As classes que chegam em
            `gradient` são cores Tailwind CHEIAS (from-green-900 to-emerald-700
            = #14532d → #047857, alfa 1), e a <img> logo abaixo é mascarada por
            um radial que zera o alfa a 70% do raio. Ou seja: em toda a coroa
            externa do painel não há imagem nenhuma, só a cor chapada.

            Medido no canto superior esquerdo, com a foto do Ibovespa: a 100% o
            painel lia rgb(14,62,42) — verde valendo mais de 4x o vermelho, um
            excesso de 20 pontos sobre os outros canais. A 50% cai para
            rgb(11,36,31), excesso 5: a cor do assunto continua legível e a
            fotografia volta a mandar. Varri 100/60/50/45/40/35/30 em três artes
            (Ibovespa, Salário, Impostos) — abaixo de 40% o assunto perde a cor,
            acima de 60% a foto some de novo.

            Aqui, e não nas ~45 strings dos *Specs: a string diz QUAL é a cor do
            assunto, esta regra diz QUANTA cor o card aceita. Espalhar alfa por
            todas elas seria a mesma decisão repetida 45 vezes, pronta para
            divergir na primeira que alguém editasse.

            Vale para a foto que existe hoje: as artes já vêm com vinheta escura
            assada nas quatro bordas (medido: centro rgb(22,27,37), bordas
            rgb(3,5,7)), então a dissolução das quebradas não depende mais desta
            camada — ela é só cor. */}
        <div className={`absolute inset-0 bg-linear-to-br ${gradient} opacity-50`} />

        {img && (
          <img
            src={img}
            alt=""
            role="presentation"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            // Máscara radial: a imagem "emerge" do gradiente em vez de cobri-lo.
            //
            // As paradas foram de `80% 80%, black 20% → transparent 70%` para
            // `100% 100%, black 45% → transparent 88%`: vinheta MENOR e mais
            // fraca, a pedido. O anel escuro deixa de comer metade do painel e
            // vira uma orla fina.
            //
            // Isso tem um efeito colateral que não é bug: a paleta do assunto
            // aparecia justamente PELO buraco que esta máscara abria, então
            // encolher o buraco apaga quase toda a cor. Medido no canto do card
            // do Salário: rgb(13,33,40) com a máscara antiga contra rgb(30,22,41)
            // com esta — o verde deixa de existir e sobra o magenta da própria
            // foto. Se um dia a cor do assunto precisar voltar sem trazer a
            // vinheta junto, o lugar é uma camada de tinta POR CIMA da imagem,
            // em alfa baixo, e não um buraco por baixo dela.
            style={{
              WebkitMaskImage:
                "radial-gradient(ellipse 100% 100% at 50% 50%, black 45%, transparent 88%)",
              maskImage:
                "radial-gradient(ellipse 100% 100% at 50% 50%, black 45%, transparent 88%)",
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}

        {/* Gradiente para baixo para legibilidade do título no canto inferior. */}
        <div className="absolute inset-0 bg-linear-to-t from-[#020617] via-[#020617]/60 to-transparent" />

        <div className="absolute bottom-0 left-0 p-card flex flex-col gap-2 z-10">
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
      <div className="flex-1 min-w-0 flex flex-col p-card gap-5">
        <div
          className="min-h-32.5 flex flex-col justify-center"
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
