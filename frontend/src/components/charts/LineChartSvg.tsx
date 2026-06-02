// Gráfico de linha em SVG puro — sem dependência externa.
export interface LinePoint {
  date: string;
  value: number;
}

export function LineChartSvg({ points }: { points: LinePoint[] }) {
  const W = 800, H = 300, PAD_X = 64, PAD_Y = 24;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const n = points.length;

  const x = (i: number) => PAD_X + (i / (n - 1 || 1)) * (W - PAD_X - 16);
  const y = (v: number) => PAD_Y + (1 - (v - min) / range) * (H - PAD_Y * 2);

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(' ');

  const yTicks = [max, min + range / 2, min];
  const fmt = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Histórico de preço">
      {yTicks.map((v, i) => {
        const yy = y(v);
        return (
          <g key={i}>
            <line x1={PAD_X} y1={yy} x2={W - 16} y2={yy} stroke="#334155" strokeDasharray="3 3" />
            <text x={PAD_X - 8} y={yy + 4} textAnchor="end" fill="#94a3b8" fontSize="12">{fmt(v)}</text>
          </g>
        );
      })}
      <text x={PAD_X} y={H - 4} textAnchor="start" fill="#94a3b8" fontSize="12">{points[0].date}</text>
      <text x={W - 16} y={H - 4} textAnchor="end" fill="#94a3b8" fontSize="12">{points[n - 1].date}</text>
      <path d={path} fill="none" stroke="#eab308" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}