import { describe, expect, it } from 'vitest';
import { usaEscalaLog } from './chartTheme';
import type { LinePoint } from './LineChartEcharts';

const pts = (...valores: number[]): LinePoint[] =>
  valores.map((value, i) => ({ date: `2020-01-${String(i + 1).padStart(2, '0')}`, value }));

describe('usaEscalaLog', () => {
  // O caso que motivou a mudança: a Selic overnight anualizada do IPEA
  // (PAN12_TJOVER12) vai de ~1,9 hoje a mais de 100.000 durante a
  // hiperinflação. Num eixo linear os últimos trinta anos somem no zero.
  it('liga em série que atravessa a hiperinflação', () => {
    expect(usaEscalaLog(pts(1.94, 42, 850, 17_000, 100_591, 38, 13.75))).toBe(true);
  });

  it('não liga na Selic pós-Plano Real, que cabe no eixo linear', () => {
    expect(usaEscalaLog(pts(7.25, 14.25, 13.75, 10.5, 2, 25))).toBe(false);
  });

  it('não liga no salário mínimo nominal desde 1994', () => {
    // ~23x entre o primeiro e o último: longe das 3 ordens de grandeza.
    expect(usaEscalaLog(pts(70, 240, 622, 1100, 1518, 1621))).toBe(false);
  });

  it('exige três ordens de grandeza cheias', () => {
    expect(usaEscalaLog(pts(1, 999))).toBe(false);
    expect(usaEscalaLog(pts(1, 1000))).toBe(true);
  });

  // Log de zero é -infinito e log de negativo não existe. Séries com esses
  // valores — saldo da balança comercial, por exemplo — seguem no eixo linear
  // mesmo com amplitude grande.
  it('não liga quando a série toca o zero', () => {
    expect(usaEscalaLog(pts(0, 5000, 90_000))).toBe(false);
  });

  it('não liga quando a série tem valor negativo', () => {
    expect(usaEscalaLog(pts(-1200, 3, 40_000))).toBe(false);
  });

  it('ignora valores não finitos ao medir a amplitude', () => {
    expect(usaEscalaLog(pts(2, Number.NaN, 8000))).toBe(true);
  });

  it('não liga sem pontos suficientes para haver amplitude', () => {
    expect(usaEscalaLog([])).toBe(false);
    expect(usaEscalaLog(pts(50_000))).toBe(false);
  });
});
