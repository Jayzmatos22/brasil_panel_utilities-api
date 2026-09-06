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
    // A seção assume a PROPORÇÃO da arte — 2:3 no celular, 16:9 de md para cima.
    // Sem isso a altura vinha do texto, o `object-cover` cortava a imagem no meio
    // da névoa e sobrava um retângulo visível: a arte dissolve nas bordas DELA,
    // não numa borda arbitrária. Com as proporções casando, o cover não corta
    // nada e o desenho chega inteiro.
    // SEM `isolate`, de propósito. Ele criaria contexto de empilhamento, e aí o
    // `mix-blend-screen` da arte passaria a compor só com o que está DENTRO
    // desta seção — ou seja, com nada — e o retângulo voltaria. Sem ele a arte
    // compõe com a página inteira, que é o que se quer.
    //
    // Tirar o isolate é seguro: o ::before do abyss vive em z-index -1 e a arte
    // em z-0, e num mesmo contexto de empilhamento o negativo pinta antes. A
    // ordem continua abyss → arte → conteúdo.
    <section className="relative w-full max-w-5xl aspect-[2/3] md:aspect-[16/9]">
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

          É por isso também que não há máscara aqui, ao contrário da foto do
          auth: aquela era uma foto opaca com retângulo para esconder, esta se
          dissolve sozinha pela própria natureza. */}
      {(arteMobile !== undefined || arteWide !== undefined) && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <picture>
            {arteWide !== undefined && (
              <source media={`(min-width: ${MD}px)`} srcSet={arteWide} />
            )}
            <img
              src={arteMobile ?? arteWide}
              alt=""
              className="h-full w-full object-cover mix-blend-screen"
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
      <div
        className="absolute inset-0 z-10 flex flex-col
                   md:flex-row-reverse md:items-center md:gap-8 md:px-8"
      >
        {/* O lockup pousa na NÉVOA da arte, que é onde a luz dos vaga-lumes tem
            para onde derramar: no retrato ela fica a ~33% da altura, no 16:9 a
            ~45% e à direita. Daí o `pt-[24%]` do celular e o `items-center` com
            ordem invertida no desktop. */}
        <div className="flex justify-center pt-[24%] md:flex-1 md:pt-0">
          <Erro404Vagalume size={size} />
        </div>

        <div className="mt-auto pb-[10%] md:mt-0 md:flex-1 md:pb-0">
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
