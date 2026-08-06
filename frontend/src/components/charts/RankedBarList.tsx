// Lista ranqueada com barra proporcional ao fundo.
//
// Existe para o caso em que um gráfico de barras deixa de funcionar: séries com
// razão de ordem de grandeza entre o maior e o menor item, em coluna estreita.
// O PIB por estado é isso — São Paulo é ~230× o menor estado, e em 320px as
// barras dos vinte e poucos estados menores caem abaixo de 2px.
//
// A inversão que faz funcionar: aqui o NÚMERO carrega a informação e a barra é
// apoio visual. Num gráfico de barras é o contrário, e é por isso que ele
// quebra — barra de 1px não comunica nada, enquanto "R$ 15 bi" comunica tudo.
//
// Também é o que dispensa a escala logarítmica, tentada antes e revertida: log
// comprime as diferenças, então as barras ficavam todas do mesmo tamanho e a
// comparação — única função do gráfico — sumia de vez.
import { formatNumber } from './chartTheme';

export interface RankedItem {
  label: string;
  value: number;
}

interface RankedBarListProps {
  items: RankedItem[];
  color?: string;
  valueFormatter?: (v: number) => string;
  /** Quantos itens mostrar antes de cortar. Sem limite por padrão. */
  limit?: number;
}

export function RankedBarList({
  items,
  color = '#009C3B',
  valueFormatter,
  limit,
}: RankedBarListProps) {
  const fmt = valueFormatter ?? formatNumber;

  const ordered = [...items].sort((a, b) => b.value - a.value);
  const shown = limit ? ordered.slice(0, limit) : ordered;

  // A barra é proporcional ao MAIOR valor, não à soma: a leitura pretendida é
  // "quanto este estado é em relação ao líder", não participação no total.
  const max = Math.max(...shown.map((i) => i.value), 0);

  return (
    <ol className="flex list-none flex-col gap-1.5">
      {shown.map((entry) => {
        const proporcao = max > 0 ? (entry.value / max) * 100 : 0;

        return (
          <li
            key={entry.label}
            className="flex items-center gap-3 text-xs text-slate-300"
          >
            <span className="w-8 shrink-0 font-medium text-slate-400">
              {entry.label}
            </span>

            {/* min-w-0 é o que permite esta coluna encolher: sem ele o flex usa
                a largura do conteúdo como mínimo e empurra o valor para fora da
                tela — exatamente o corte que acontecia no gráfico. */}
            <span className="relative h-5 min-w-0 flex-1 overflow-hidden rounded-sm bg-slate-800/40">
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 rounded-sm"
                style={{
                  width: `${proporcao}%`,
                  backgroundColor: color,
                  // Piso de opacidade para a barra do menor estado continuar
                  // perceptível: sem isso ela seria uma lasca invisível.
                  opacity: 0.35 + (proporcao / 100) * 0.65,
                }}
              />
            </span>

            {/* tabular-nums alinha os dígitos entre as linhas; whitespace-nowrap
                impede a quebra de "R$ 3,44 tri" no meio. */}
            <span className="shrink-0 whitespace-nowrap text-right font-medium tabular-nums text-slate-200">
              {fmt(entry.value)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
