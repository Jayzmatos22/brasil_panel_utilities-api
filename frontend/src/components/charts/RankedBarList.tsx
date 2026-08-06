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
    <ol className="flex list-none flex-col gap-3">
      {shown.map((entry) => {
        const proporcao = max > 0 ? (entry.value / max) * 100 : 0;

        return (
          <li key={entry.label} className="flex flex-col gap-1.5">
            {/* Nome e valor dividem a primeira linha; a barra ocupa a segunda.
                Em coluna única os três não cabem lado a lado: a fonte é o
                campo D1N do SIDRA, que traz o nome por extenso ("Rio Grande
                do Sul", 17 caracteres), e não a sigla. Numa linha só, ou o
                nome atropela a barra ou a barra fica sem largura para
                diferenciar nada — que era justamente o defeito a corrigir. */}
            <div className="flex items-baseline justify-between gap-3 text-xs">
              {/* min-w-0 permite o truncate agir: sem ele o flex adota a
                  largura do texto como mínimo e empurra o valor para fora. O
                  truncate é rede de segurança para nome atípico, não o
                  comportamento esperado — nome de estado cabe. */}
              <span className="min-w-0 truncate text-slate-300">
                {entry.label}
              </span>

              {/* tabular-nums alinha os dígitos entre as linhas;
                  whitespace-nowrap impede a quebra de "R$ 3,44 tri". */}
              <span className="shrink-0 whitespace-nowrap font-medium tabular-nums text-slate-200">
                {fmt(entry.value)}
              </span>
            </div>

            <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-slate-800/40">
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${proporcao}%`,
                  backgroundColor: color,
                  // Piso de opacidade para a barra do menor estado continuar
                  // perceptível: sem isso ela seria uma lasca invisível.
                  opacity: 0.35 + (proporcao / 100) * 0.65,
                }}
              />
            </span>
          </li>
        );
      })}
    </ol>
  );
}
