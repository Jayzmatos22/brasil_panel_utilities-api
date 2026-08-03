// Número-chave da faixa de métricas.
//
// tabular-nums trava a largura dos dígitos: sem isso os quatro valores
// desalinham entre si e o "1994" dança em relação ao "40+" quando a fonte
// aplica largura proporcional.
interface MetricItemProps {
  value: string;
  label: string;
  description: string;
}

export function MetricItem({ value, label, description }: MetricItemProps) {
  return (
    <div className="flex flex-col">
      <span className="text-metric font-semibold tabular-nums text-accent">
        {value}
      </span>

      <span className="mt-3 text-sm font-medium text-fg">{label}</span>

      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
        {description}
      </p>
    </div>
  );
}