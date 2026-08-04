// Número-chave da faixa de métricas, com contagem ao entrar em tela.
//
// tabular-nums trava a largura dos dígitos. Sem isso os quatro valores
// desalinham entre si e — pior durante a contagem — o número muda de largura
// a cada quadro, empurrando o sufixo de um lado para o outro.
import { AnimatedNumber } from '../../../components/AnimatedNumber';
import { useReveal } from '../../../hooks/UseReveal';

interface MetricItemProps {
  value: number;
  label: string;
  description: string;
  /** Colado ao número, fora da contagem: '+', 'h'. */
  suffix?: string;
}

/** Inteiro puro: 1994 é ano, não quantidade — separador de milhar estaria errado. */
const formatar = (v: number): string => String(Math.round(v));

export function MetricItem({
  value,
  label,
  description,
  suffix = '',
}: MetricItemProps) {
  // Observer próprio, e não o do <Reveal> que envolve este componente. Os dois
  // observam quase o mesmo retângulo, mas separá-los mantém cada peça com uma
  // responsabilidade só: o Reveal cuida do fade, o MetricItem da contagem.
  // Custo real: quatro observers de disparo único na página inteira.
  //
  // O useReveal também já respeita prefers-reduced-motion — com movimento
  // reduzido ele nasce revelado, então o número aparece direto no valor final
  // em vez de contar.
  const { ref, isRevealed } = useReveal<HTMLDivElement>();

  // Derivado no render, sem estado nem efeito. O AnimatedNumber nasce com 0,
  // e quando isRevealed vira true o valor muda — é essa troca que o spring
  // interpola. Guardar isso em useState exigiria um efeito para sincronizar,
  // que é justamente o padrão que o react-hooks/set-state-in-effect proíbe:
  // renderiza uma vez com o valor errado e corrige em cascata.
  const alvo = isRevealed ? value : 0;

  return (
    <div ref={ref} className="flex flex-col">
      <span className="text-metric font-semibold tabular-nums text-accent">
        <AnimatedNumber value={alvo} format={formatar} />
        {suffix}
      </span>

      <span className="mt-3 text-sm font-medium text-fg">{label}</span>

      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
        {description}
      </p>
    </div>
  );
}
