// Página 404.
//
// Três camadas: a arte de fundo (série temporal interrompida), o lockup animado
// dos vaga-lumes por cima dela, e a coluna de texto com as ações.
//
// Serve DOIS contextos e por isso é um bloco, não um casco de página: o
// catch-all de fora do painel a renderiza dentro do OnboardingLayout, e a rota
// curinga de /dashboard a renderiza dentro do <main>, com a sidebar montada ao
// lado. Nada aqui é `fixed` nem `min-h-screen` — se fosse, no painel a arte
// passaria por cima da sidebar.
import { Link } from 'react-router-dom';

import Erro404Vagalume from './Erro404Vagalume';
import { findErrorImage } from './images';
import { isAuthenticated } from '../../lib/auth/jwt';
import { useResponsiveValue } from '../../hooks/UseResponsiveValue';

const arteMobile = findErrorImage('404-mobile');
const arteWide = findErrorImage('404-desktop');

/** Onde o <picture> troca de arte. Igual ao `md` do tema (48rem = 768px). */
const MD = 768;

/**
 * Corpo dos dígitos, em px.
 *
 * O lockup mede cerca de 5,5x este valor de largura ("Erro" + gap + os três
 * dígitos). Com o padrão 96 do componente ele dá ~530px: cabe folgado no
 * desktop e ESTOURA num celular de 390px, que tem ~350px úteis depois do
 * gutter. 56 devolve ~310px e cabe.
 *
 * O tamanho é passado por prop, e não por CSS: `size` é a API que o próprio
 * componente publica para isso ("Escala tudo: serif, halo, glow, gaps"), e ela
 * escala junto o halo e o blur. Mexer por `transform: scale` deformaria o blur.
 *
 * Efeito colateral que justifica o número menor no celular: o halo é
 * `size * 3.4`, então são três círculos borrados animando sem parar — 326px
 * cada no desktop, 190px no celular. É a mesma classe de custo de composição
 * que já causou a faixa branca na rolagem do painel.
 */
const tamanhoLockup = () => (window.innerWidth >= MD ? 96 : 56);

export default function NotFoundPage() {
  const size = useResponsiveValue(tamanhoLockup);

  // Quem tem sessão volta ao painel; quem não tem iria bater no PrivateRoute e
  // ser jogado no login sem explicação — para essa pessoa o destino honesto é a
  // landing. Mesma leitura que o Hero do /sobre já faz.
  const logado = isAuthenticated();

  return (
    // A altura vem do CONTEÚDO, não de `aspect-ratio`.
    //
    // Uma versão anterior amarrava a altura à largura (2:3 / 16:9) para o
    // object-cover não cortar a arte. Funcionava num celular estreito e quebrava
    // em tablet: a 562px de largura a seção virava 842px de altura, o texto
    // ficava preso no rodapé dessa caixa e sobravam 389px de vazio no meio —
    // além de estourar a tela e criar rolagem. Medido num Redmi Pad em retrato
    // (600x960) e também em paisagem (1000x600, +104px de rolagem).
    //
    // A proporção fixa não tinha relação nenhuma com a altura da JANELA, e é por
    // isso que quebrava. Agora o corte da arte é assumido e resolvido por
    // object-position; quem esconde a emenda é a máscara logo abaixo, que já
    // existe e dissolve as quatro bordas de qualquer jeito.
    //
    // SEM `isolate`, de propósito. Ele criaria contexto de empilhamento, e aí o
    // `mix-blend-screen` da arte passaria a compor só com o que está DENTRO
    // desta seção — ou seja, com nada — e o retângulo voltaria. Sem ele a arte
    // compõe com a página inteira, que é o que se quer.
    //
    // Tirar o isolate é seguro: o ::before do abyss vive em z-index -1 e a arte
    // em z-0, e num mesmo contexto de empilhamento o negativo pinta antes. A
    // ordem continua abyss → arte → conteúdo.
    <section className="relative w-full max-w-5xl">
      {/* ── Camada 1 — arte ─────────────────────────────────────────────────
          Container SEM z-index, e isso é a peça central. `position: absolute`
          COM z-index cria contexto de empilhamento, e aí o `mix-blend-screen`
          da imagem passa a compor só com o que está dentro dele — ou seja, com
          nada — e o preto da arte volta a pintar por cima dos halos. Medido: com
          `z-0` no container, o miolo da caixa lia rgb(2,2,2) enquanto a página
          ao redor lia rgb(6,8,13); sem ele, os halos atravessam.

          Sem z-index a camada continua acima do abyss: o ::before dos halos é
          z-index -1, e um elemento posicionado com z-index `auto` pinta depois
          dos negativos. A ordem segue abyss → arte → conteúdo (z-10).

          A arte é composta ADITIVAMENTE (`mix-blend-mode: screen`), e não
          sobreposta. Ela é luz sobre preto puro, e no screen o preto não
          contribui com nada: só a linha e a névoa somam. Sem isso o retângulo
          da imagem aparecia — não por ter borda, mas porque o preto puro dela é
          mais neutro que o fundo da página, que tem os halos azulados do
          .bg-smoke-abyss por baixo. Com o screen os halos atravessam a arte e
          não existe mais caixa nenhuma.

          O `screen` sozinho ainda deixava um retângulo, e a máscara existe por
          causa dele. A borda das duas artes não é preto PURO: é rgb(2,2,2). No
          screen isso soma 2 em cada canal, e o resultado medido era um degrau de
          rgb(2,3,10) para rgb(4,5,12) numa linha perfeitamente reta. Dois pontos
          de luz é pouco, mas borda reta o olho acha sempre.

          A máscara resolve fazendo o alfa cair nos quatro lados: os mesmos 2
          pontos passam a entrar por rampa em vez de degrau. `closest-side` faz a
          elipse tocar o meio de cada borda, e o corte só começa em 86% do raio —
          então o miolo, onde mora a série, fica intacto, e só as pontas se
          dissolvem. Um radial único, e não quatro lineares: `mask-composite`
          ainda diverge de prefixo entre navegadores, e um radial já cobre os
          quatro lados de uma vez.

          Nada disso toca o .bg-smoke-abyss — a fusão é toda do lado da arte. */}
      {(arteMobile !== undefined || arteWide !== undefined) && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <picture>
            {arteWide !== undefined && (
              <source media={`(min-width: ${MD}px)`} srcSet={arteWide} />
            )}
            <img
              src={arteMobile ?? arteWide}
              alt=""
              className="h-full w-full object-cover object-[50%_20%] mix-blend-screen md:object-[50%_50%]"
              style={{
                maskImage:
                  'radial-gradient(closest-side, #000 86%, transparent 100%)',
              }}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </div>
      )}

      {/* ── Camada 2 — lockup e texto ───────────────────────────────────────
          `flex-col-reverse` no celular e `md:flex-row` no desktop, e não duas
          ordens iguais, porque as duas artes foram compostas ao contrário uma
          da outra: no retrato a série corre no terço SUPERIOR, no 16:9 ela fica
          no quadrante superior DIREITO. O lockup segue a arte nos dois casos —
          em cima no celular, à direita no desktop — e o texto ocupa o vazio que
          sobra. */}
      {/* Conteúdo NO FLUXO, e não `absolute inset-0`. Absoluto ele herdava a
          altura da caixa, e o `mt-auto` que empurrava o texto para o rodapé
          virava um vão enorme assim que a caixa crescia. No fluxo, a distância
          entre o lockup e o texto é sempre o mesmo `gap`, em qualquer tela. */}
      {/* Abaixo de md a coluna ocupa a ALTURA VISÍVEL e distribui o conteúdo
          dentro dela: o lockup centrado no espaço livre (portanto um pouco acima
          do meio da tela, já que a mensagem ocupa a parte de baixo) e o bloco de
          texto ancorado a ~20% do rodapé.

          `svh`, e não `vh`: `100vh` mede a janela com a barra de endereço
          RECOLHIDA e criaria exatamente a rolagem que este arranjo existe para
          evitar. O desconto de 11rem cobre o header fixo mais o respiro
          vertical do casco.

          De md para cima nada disso vale: lá o layout é em linha e a altura
          volta a vir do conteúdo. */}
      <div
        className="relative z-10 flex min-h-[calc(100svh-11rem)] flex-col pb-[12svh] pt-8
                   md:min-h-0 md:flex-row-reverse md:items-center md:gap-8 md:px-8 md:py-16 md:pb-16"
      >
        {/* Dois vãos elásticos em 7:3 distribuem a altura livre: o lockup pousa
            a ~43% da tela — meio, levemente acima — e o bloco de mensagem fecha
            a ~80%, deixando a faixa de 20% de respiro embaixo. Proporção, e não
            pixel fixo, para os dois pontos caírem no mesmo lugar num celular de
            844px e num tablet de 960px.

            Somem de md para cima: lá o layout é em linha e não há altura livre
            para distribuir. Em `row-reverse` a ordem visual vira texto à
            esquerda, lockup à direita — que é o que a arte 16:9 pede. */}
        <div className="flex-[7] md:hidden" aria-hidden="true" />

        <div className="flex justify-center md:flex-1">
          <Erro404Vagalume size={size} />
        </div>

        <div className="flex-[3] md:hidden" aria-hidden="true" />

        <div className="md:flex-1">
          {/* O lockup já se anuncia como `role="img"` com rótulo "Erro 404", então
              este <h1> não repete o código — ele diz o que aconteceu, e o
              lockup diz o número. */}
          <h1 className="text-title font-semibold text-white sm:text-display">
            Página não encontrada
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            O endereço acessado não existe ou foi movido.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to={logado ? '/dashboard/economia' : '/sobre'}
              className="inline-flex items-center justify-center rounded-control bg-amber-500 px-6 py-3
                         text-sm font-bold text-slate-950 transition-colors hover:bg-amber-400
                         coarse:min-h-11 focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-amber-400/60"
            >
              {logado ? 'Ir para o painel' : 'Conhecer o projeto'}
            </Link>
            <Link
              to={logado ? '/sobre' : '/login-usuario'}
              className="inline-flex items-center justify-center rounded-control border
                         border-hairline-strong px-6 py-3 text-sm font-semibold text-slate-200
                         transition-colors hover:border-white/25 hover:bg-white/5
                         coarse:min-h-11 focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-amber-400/60"
            >
              {logado ? 'Conhecer o projeto' : 'Entrar'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
