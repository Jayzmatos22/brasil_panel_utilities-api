import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Save, LoaderCircle } from "lucide-react";

import { ProfileFields } from "../../components/forms/ProfileFields";
import { useProfileOptions, useUpdateProfile } from "../../hooks/UseProfile";
import {
  EMPTY_PROFILE_FORM,
  formToRequest,
  type ProfileFormState,
} from "../../lib/profile/profileForm";
import { findOnboardingImage } from "./images";

/**
 * Onboarding de perfil — profissão e formação.
 *
 * Substitui o antigo par endereço + dados bancários, que coletava CEP, conta e
 * cartão sem que nada disso existisse no Postgres. Agora persiste de verdade em
 * `user_profiles` via PUT /api/profile/me. O usuário pode pular e completar
 * depois nas configurações — nenhum campo é obrigatório.
 *
 * Composição: a arte NÃO é uma coluna recortada dentro de um painel
 * compartilhado. Ela nasce do próprio fundo da página e adensa até encontrar o
 * formulário, que é o único elemento com borda, superfície e sombra. A
 * hierarquia fica explícita na estrutura: um card, uma imagem ambiente.
 *
 * Até lg a arte é uma faixa no topo que desce para dentro do card; a partir de
 * lg vira coluna à esquerda que entra pela lateral. Em ambos os casos o vetor
 * da máscara aponta para o formulário.
 */

const DESTINO = "/dashboard/economia";

// Escopo de módulo, como em Hero.tsx: o glob resolve em tempo de build, então
// não há motivo para recalcular a cada render.
const arte = findOnboardingImage("universidade");

/**
 * A dissolução da arte no fundo.
 *
 * Uma única radial cobre os dois eixos: o centro fica junto ao formulário
 * (embaixo até lg, à direita a partir de lg) e o alpha cai em direção às bordas
 * externas. Duas linear-gradients dariam o mesmo desenho, mas só combinadas com
 * `mask-composite: intersect` — suporte mais recente e mais fácil de errar.
 *
 * As paradas são deliberadamente tardias (44–46%) para que a maior parte da
 * foto permaneça sólida: a transparência é acabamento de borda, não efeito.
 *
 * `mask-image` sem prefixo cobre Chrome, Firefox e Safari 15.4+. Em navegador
 * sem suporte a máscara a imagem aparece inteira, com borda reta sobre o fundo
 * — degrada feio, mas não quebra layout nem esconde conteúdo.
 */
const MASCARA_ARTE =
  "[mask-image:radial-gradient(115%_130%_at_50%_100%,#000_46%,transparent_78%),linear-gradient(to_bottom,transparent_0%,#000_24%,#000_100%)] " +
  "lg:[mask-image:radial-gradient(125%_115%_at_100%_50%,#000_44%,transparent_76%),linear-gradient(to_bottom,transparent_0%,#000_20%,#000_80%,transparent_100%)] " +
  "[mask-composite:intersect]";

const BOTAO_SECUNDARIO =
  "flex h-12 cursor-pointer items-center justify-center rounded-control border " +
  "border-hairline-strong px-6 text-sm text-slate-300 transition-all " +
  "hover:border-slate-500 hover:text-white disabled:opacity-50 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60";

export default function PerfilPage() {
  const navigate = useNavigate();

  const { data: options, isLoading, isError } = useProfileOptions();
  const [form, setForm] = useState<ProfileFormState>(EMPTY_PROFILE_FORM);

  const { mutate: save, isPending } = useUpdateProfile(() =>
    navigate(DESTINO, { replace: true }),
  );

  const patch = (p: Partial<ProfileFormState>) =>
    setForm((prev) => ({ ...prev, ...p }));

  const pular = () => navigate(DESTINO, { replace: true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save(formToRequest(form));
  };

  return (
    /**
     * Camada de altura. Só existe para dar ao conjunto um espaço maior que ele
     * mesmo, dentro do qual possa se centrar.
     *
     * `svh` e não `vh`: no iOS a barra de endereço retrátil faz `100vh` medir a
     * viewport expandida, e o bloco nasceria empurrado para fora da tela.
     *
     * O 4.5rem é a altura do header. Se já existir token para isso no projeto,
     * troque por ele — duplicar a medida aqui é dívida esperando o dia em que o
     * header mudar de altura.
     */
    <div className="@container/page relative z-10 mx-auto mb-auto w-full max-w-5xl">
      {/**
       * `m-auto` — nos dois eixos — é o que de fato centra.
       *
       * Poderia ser `justify-center`/`items-center` no pai, e o resultado é
       * idêntico enquanto o conteúdo cabe na tela. Divergem quando ele não
       * cabe: com centragem por flex o excedente transborda para os DOIS lados
       * e o topo do card fica inalcançável, porque o scroll não sobe além do
       * início do container. Com margem automática, ela colapsa a zero assim
       * que falta espaço e o bloco volta ao fluxo normal. Importa aqui porque
       * os selects abertos e o teclado virtual encurtam a altura útil
       * justamente no mobile.
       */}
      <div className="@container/page m-auto w-full max-w-5xl">
        <div className="flex flex-col lg:min-h-100 lg:flex-row lg:items-stretch">
          {arte !== undefined && (
            <div
              // A arte avança 2.5rem para dentro do formulário para que não
              // exista uma linha onde uma termina e o outro começa. Como
              // `bg-surface-2` vem com backdrop-blur, o trecho sobreposto
              // aparece desfocado atrás do vidro — e se a superfície for opaca
              // no seu tema, a sobreposição apenas some, sem prejuízo.
              //
              // 38% em vez de 1/3 porque a máscara come a borda externa: a
              // largura *percebida* da arte é menor que a caixa. Mesmo assim a
              // restrição original continua satisfeita — 38% de 1024px deixa
              // ~635px ao formulário, mais os 40px da sobreposição, bem acima
              // dos 568px que o `grid-auto-cards [--card-min:17rem]` do
              // ProfileFields exige para abrir duas trilhas.
              className="relative -mb-8 aspect-[16/9] shrink-0 sm:aspect-[3/1]
                         lg:mb-0 lg:-me-10 lg:aspect-auto lg:w-[38%]"
            >
              {/* A máscara vive neste invólucro, e não na <img>, para que o véu
                  da legenda dissolva junto com a foto. Fora da máscara, ele
                  sobraria como uma mancha escura sobre o fundo gradiente da
                  página exatamente onde a imagem já sumiu. */}
              <div className={`absolute inset-0 ${MASCARA_ARTE}`}>
                <img
                  src={arte}
                  alt="Fachada neoclássica de um prédio universitário fotografada de baixo, com quatro colunas jônicas e frontão triangular, em preto e branco."
                  width={6000}
                  height={3582}
                  // Sem lazy: é o primeiro elemento da rota e está acima da
                  // dobra em qualquer largura — mesmo critério do hero da
                  // landing.
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover"
                />

                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent"
                />
              </div>

              {/* Legenda fora da máscara: onde a foto já dissolveu, o texto
                  passa a se apoiar no fundo da página — branco sobre
                  quase-preto segue com contraste de sobra. `bottom-8` a levanta
                  acima do trecho que o formulário cobre no mobile. */}
              <div className="absolute inset-x-0 bottom-8 flex flex-col gap-1 p-card lg:bottom-0">
                <span className="text-eyebrow font-semibold uppercase tracking-[0.2em] text-amber-400">
                  Quase lá
                </span>
                <p className="text-sm leading-snug text-white">
                  Seu painel, ajustado ao que você faz.
                </p>
              </div>
            </div>
          )}

          {/* ── Formulário ────────────────────────────────────────────────────
              Único portador de superfície. `relative z-10` o mantém sobre a
              arte na região de sobreposição. Segue sem overflow-hidden: os
              selects abrem painel absoluto e um clip aqui os deceparia. */}
          <form
            onSubmit={handleSubmit}
            className="relative z-10 flex min-w-0 flex-1 flex-col gap-6 rounded-panel
                       border border-hairline-strong bg-surface-2 p-card shadow-panel
                       backdrop-blur-sm"
          >
            <div className="flex flex-col gap-2">
              <h1 className="flex items-center gap-3 text-title font-bold text-white">
                <Briefcase
                  size={24}
                  aria-hidden="true"
                  className="shrink-0 text-amber-400"
                />
                Perfil profissional
              </h1>
              <p className="text-sm leading-relaxed text-slate-400">
                Usamos essas informações para destacar os indicadores mais
                relevantes para você. Você pode alterá-las depois nas
                configurações.
              </p>
            </div>

            {isLoading && (
              <div className="flex flex-1 items-center justify-center gap-2 py-12 text-slate-400">
                <LoaderCircle
                  size={18}
                  aria-hidden="true"
                  className="animate-spin"
                />
                Carregando opções…
              </div>
            )}

            {isError && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center">
                <p className="text-sm text-slate-400">
                  Não foi possível carregar as opções agora.
                </p>
                <button
                  type="button"
                  onClick={pular}
                  className={BOTAO_SECUNDARIO}
                >
                  Continuar para o painel
                </button>
              </div>
            )}

            {options && (
              <>
                <ProfileFields
                  options={options}
                  value={form}
                  onChange={patch}
                  disabled={isPending}
                />

                {/* Foco primário único: o âmbar preenchido é o mesmo primário
                    das telas de auth. "Pular" fica ghost — legível, sem peso. */}
                <div className="mt-auto flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex h-14 w-full cursor-pointer items-center justify-center gap-2
                               rounded-control bg-amber-500 text-sm font-bold text-slate-950
                               transition-all hover:bg-amber-400 active:scale-[0.98]
                               disabled:cursor-not-allowed disabled:opacity-50
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-amber-400/60 sm:h-12 sm:flex-1"
                  >
                    {isPending ? (
                      <>
                        <LoaderCircle
                          size={16}
                          aria-hidden="true"
                          className="animate-spin"
                        />
                        Salvando…
                      </>
                    ) : (
                      <>
                        <Save size={16} aria-hidden="true" />
                        Salvar perfil
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={pular}
                    disabled={isPending}
                    className={`w-full sm:w-auto ${BOTAO_SECUNDARIO}`}
                  >
                    Pular por agora
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}