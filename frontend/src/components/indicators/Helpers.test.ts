import { describe, expect, it } from 'vitest';
import type { IpeaItem, IpeaSerie } from '../../types/IpeaType';
import {
  computeAggregatedTotal,
  computeClosingsWithVariation,
  computeLatestSummary,
  computeMetrics,
  describeAmplitude,
  describeFiveYearReturn,
  describeLast5Trend,
  describeSelicCorrelation,
  describeSixMonthReturn,
  describeVolatility,
  filterByRecentWindow,
  filterValid,
  sortAsc,
  toLinePoints,
} from './Helpers';

const item = (data: string, valor: number | null): IpeaItem => ({ data, valor });

describe('processamento de séries do IPEA', () => {
  describe('filterValid', () => {
    it('descarta buracos da série', () => {
      // O IPEA envia null em feriados; deixar passar quebraria os cálculos.
      const entrada = [
        item('2026-01-01', 10),
        item('2026-01-02', null),
        item('2026-01-03', 12),
      ];

      expect(filterValid(entrada)).toHaveLength(2);
    });

    it('descarta NaN', () => {
      const entrada = [item('2026-01-01', NaN), item('2026-01-02', 5)];

      expect(filterValid(entrada)).toEqual([item('2026-01-02', 5)]);
    });

    it('preserva o zero, que é valor legítimo', () => {
      const entrada = [item('2026-01-01', 0)];

      expect(filterValid(entrada)).toHaveLength(1);
    });
  });

  describe('sortAsc', () => {
    it('ordena por data crescente', () => {
      const entrada = [
        item('2026-03-01', 3),
        item('2026-01-01', 1),
        item('2026-02-01', 2),
      ];

      expect(sortAsc(entrada).map((i) => i.valor)).toEqual([1, 2, 3]);
    });

    it('não muta o array recebido', () => {
      const entrada = [item('2026-03-01', 3), item('2026-01-01', 1)];
      sortAsc(entrada);

      // Mutação silenciosa aqui reordenaria dados de outros componentes.
      expect(entrada[0].data).toBe('2026-03-01');
    });
  });

  describe('toLinePoints', () => {
    it('corta a data em YYYY-MM-DD', () => {
      const pontos = toLinePoints([item('2026-07-24T00:00:00-03:00', 42)]);

      expect(pontos).toEqual([{ date: '2026-07-24', value: 42 }]);
    });
  });

  describe('filterByRecentWindow', () => {
    const UM_DIA = 86_400_000;

    it('mantém apenas o que está dentro da janela', () => {
      const entrada = [
        item('2026-01-01', 1),
        item('2026-01-05', 2),
        item('2026-01-10', 3),
      ];

      // Janela de 5 dias contados a partir do ÚLTIMO ponto (10/01).
      const resultado = filterByRecentWindow(entrada, 5 * UM_DIA);

      expect(resultado.map((i) => i.valor)).toEqual([2, 3]);
    });

    it('devolve vazio para entrada vazia', () => {
      expect(filterByRecentWindow([], UM_DIA)).toEqual([]);
    });
  });

  describe('computeClosingsWithVariation', () => {
    it('deixa o primeiro ponto sem variação', () => {
      const linhas = computeClosingsWithVariation([item('2026-01-01', 100)]);

      // Não há ponto anterior: exibir 0% sugeriria estabilidade que não se mediu.
      expect(linhas[0].variation).toBeNull();
    });

    it('calcula a variação percentual frente ao ponto anterior', () => {
      const linhas = computeClosingsWithVariation([
        item('2026-01-01', 100),
        item('2026-01-02', 110),
      ]);

      expect(linhas[1].variation).toBeCloseTo(10, 5);
    });

    it('calcula queda como variação negativa', () => {
      const linhas = computeClosingsWithVariation([
        item('2026-01-01', 200),
        item('2026-01-02', 150),
      ]);

      expect(linhas[1].variation).toBeCloseTo(-25, 5);
    });

    it('ordena antes de calcular, mesmo com entrada fora de ordem', () => {
      const linhas = computeClosingsWithVariation([
        item('2026-01-02', 110),
        item('2026-01-01', 100),
      ]);

      expect(linhas[0].value).toBe(100);
      expect(linhas[1].variation).toBeCloseTo(10, 5);
    });

    it('ignora buracos da série no cálculo', () => {
      const linhas = computeClosingsWithVariation([
        item('2026-01-01', 100),
        item('2026-01-02', null),
        item('2026-01-03', 110),
      ]);

      expect(linhas).toHaveLength(2);
      expect(linhas[1].variation).toBeCloseTo(10, 5);
    });
  });

  // ─── Resumo do último ponto ───────────────────────────────────────────────

  describe('computeLatestSummary', () => {
    const serie = (itens: IpeaItem[]): IpeaSerie[] => [
      { codigo: 'X', nome: 'Série X', dados: itens },
    ];

    it('devolve null sem dados', () => {
      expect(computeLatestSummary(undefined)).toBeNull();
      expect(computeLatestSummary([])).toBeNull();
      expect(computeLatestSummary(serie([]))).toBeNull();
    });

    it('devolve null quando todos os pontos são inválidos', () => {
      expect(computeLatestSummary(serie([item('2026-01-01', null)]))).toBeNull();
    });

    it('usa o último ponto por data, não o último do array', () => {
      const resumo = computeLatestSummary(
        serie([item('2026-03-01', 30), item('2026-01-01', 10)]),
      );

      expect(resumo?.value).toBe(30);
      expect(resumo?.date).toBe('2026-03-01');
    });

    it('calcula a variação contra o ponto imediatamente anterior', () => {
      const resumo = computeLatestSummary(
        serie([item('2026-01-01', 100), item('2026-01-02', 110)]),
      );

      expect(resumo?.variationDD1).toBeCloseTo(10, 5);
    });

    it('não calcula variação diária com um único ponto', () => {
      const resumo = computeLatestSummary(serie([item('2026-01-01', 100)]));

      expect(resumo?.variationDD1).toBeNull();
    });

    it('a variação mensal compara com o último ponto de outro mês', () => {
      // Dois pontos em março: a comparação M/M deve pular ambos e usar fevereiro.
      const resumo = computeLatestSummary(
        serie([
          item('2026-02-28', 100),
          item('2026-03-01', 110),
          item('2026-03-15', 120),
        ]),
      );

      expect(resumo?.variationMM).toBeCloseTo(20, 5);
    });

    it('a variação anual compara com o mesmo mês do ano anterior', () => {
      const resumo = computeLatestSummary(
        serie([
          item('2025-03-10', 100),
          item('2025-09-10', 500),
          item('2026-03-10', 150),
        ]),
      );

      // 150 vs 100 (março do ano anterior) = +50%, ignorando setembro.
      expect(resumo?.variationYoY).toBeCloseTo(50, 5);
    });

    it('a variação anual é nula quando não há o mesmo mês do ano anterior', () => {
      const resumo = computeLatestSummary(
        serie([item('2025-07-10', 100), item('2026-03-10', 150)]),
      );

      expect(resumo?.variationYoY).toBeNull();
    });

    it('evita divisão por zero na variação', () => {
      const resumo = computeLatestSummary(
        serie([item('2026-01-01', 0), item('2026-01-02', 50)]),
      );

      expect(resumo?.variationDD1).toBeNull();
    });
  });

  // ─── Métricas de janela ───────────────────────────────────────────────────

  describe('computeMetrics', () => {
    const serie = (itens: IpeaItem[]): IpeaSerie[] => [
      { codigo: 'X', nome: 'Série X', dados: itens },
    ];

    it('devolve null sem dados', () => {
      expect(computeMetrics(undefined)).toBeNull();
      expect(computeMetrics(serie([]))).toBeNull();
    });

    it('calcula o retorno do período de cinco anos', () => {
      const m = computeMetrics(
        serie([item('2024-01-01', 100), item('2026-01-01', 150)]),
      );

      expect(m?.fiveYearReturn).toBeCloseTo(50, 5);
    });

    it('descarta pontos fora da janela de cinco anos', () => {
      // O ponto de 2010 está muito além da janela contada a partir de 2026.
      const m = computeMetrics(
        serie([
          item('2010-01-01', 1),
          item('2024-01-01', 100),
          item('2026-01-01', 150),
        ]),
      );

      expect(m?.fiveYearPoints).toHaveLength(2);
      expect(m?.fiveYearReturn).toBeCloseTo(50, 5);
    });

    it('identifica máxima e mínima do período com suas datas', () => {
      const m = computeMetrics(
        serie([
          item('2026-01-01', 100),
          item('2026-02-01', 180),
          item('2026-03-01', 90),
          item('2026-04-01', 120),
        ]),
      );

      expect(m?.fiveYearHigh).toEqual({ date: '2026-02-01', value: 180 });
      expect(m?.fiveYearLow).toEqual({ date: '2026-03-01', value: 90 });
    });

    it('conta dias de alta e de baixa separadamente', () => {
      const m = computeMetrics(
        serie([
          item('2026-01-01', 100),
          item('2026-01-02', 110), // +
          item('2026-01-03', 105), // -
          item('2026-01-04', 115), // +
        ]),
      );

      expect(m?.positiveDays6m).toBe(2);
      expect(m?.negativeDays6m).toBe(1);
    });

    it('a volatilidade média usa o valor absoluto das variações', () => {
      const m = computeMetrics(
        serie([
          item('2026-01-01', 100),
          item('2026-01-02', 110), // +10%
          item('2026-01-03', 99),  // -10%
        ]),
      );

      // Média de |+10| e |-10| é 10 — se o sinal não fosse descartado, daria 0.
      expect(m?.avgDailyAbsVar6m).toBeCloseTo(10, 1);
    });

    it('classifica a tendência dos últimos pontos como alta', () => {
      const m = computeMetrics(
        serie([
          item('2026-01-01', 100),
          item('2026-01-02', 105),
          item('2026-01-03', 110),
        ]),
      );

      expect(m?.last5Trend).toBe('up');
      expect(m?.last5NetPct).toBeCloseTo(10, 5);
    });

    it('classifica a tendência como baixa', () => {
      const m = computeMetrics(
        serie([item('2026-01-01', 110), item('2026-01-02', 100)]),
      );

      expect(m?.last5Trend).toBe('down');
    });

    it('trata variação ínfima como lateral', () => {
      // Variação de 0,05% — abaixo do limiar de 0,1% que define "flat".
      const m = computeMetrics(
        serie([item('2026-01-01', 100), item('2026-01-02', 100.05)]),
      );

      expect(m?.last5Trend).toBe('flat');
    });

    it('expõe a série válida completa para reuso', () => {
      const m = computeMetrics(
        serie([
          item('2026-01-02', 110),
          item('2026-01-01', 100),
          item('2026-01-03', null),
        ]),
      );

      // validAsc evita que o PeriodExplorer reprocesse a série original.
      expect(m?.validAsc.map((i) => i.valor)).toEqual([100, 110]);
    });
  });

  // ─── Textos interpretativos ───────────────────────────────────────────────
  //
  // São funções de limiar: o que importa é a faixa em que cada valor cai, e
  // sobretudo o comportamento nas fronteiras, onde erros de < versus <= moram.

  describe('describeFiveYearReturn', () => {
    it('classifica alta expressiva a partir de 80%', () => {
      expect(describeFiveYearReturn(80)).toContain('forte valorização nominal');
      expect(describeFiveYearReturn(79.99)).not.toContain('forte');
    });

    it('classifica como consistente a partir de 40%', () => {
      expect(describeFiveYearReturn(40)).toContain('consistente');
    });

    it('classifica como moderada a partir de 15%', () => {
      expect(describeFiveYearReturn(15)).toContain('moderada');
    });

    it('trata variação abaixo de 0,5% como estável', () => {
      expect(describeFiveYearReturn(0.4)).toContain('praticamente estável');
    });

    it('usa a magnitude para classificar quedas', () => {
      // -85% é "forte", mesmo sendo negativo: o limiar olha o valor absoluto.
      expect(describeFiveYearReturn(-85)).toContain('forte desvalorização nominal');
    });
  });

  describe('describeSixMonthReturn', () => {
    it('reconhece forte alta a partir de 15%', () => {
      expect(describeSixMonthReturn(15)).toContain('forte alta');
    });

    it('reconhece forte queda a partir de -15%', () => {
      expect(describeSixMonthReturn(-15)).toContain('forte queda');
    });

    it('trata a faixa entre -0,5% e +0,5% como lateral', () => {
      expect(describeSixMonthReturn(0)).toContain('lateralizado');
      expect(describeSixMonthReturn(0.4)).toContain('lateralizado');
      expect(describeSixMonthReturn(-0.4)).toContain('lateralizado');
    });

    it('põe sinal explícito nos valores positivos', () => {
      expect(describeSixMonthReturn(7)).toContain('+7.00%');
    });
  });

  describe('describeVolatility', () => {
    it('classifica o nível pela variação absoluta média', () => {
      expect(describeVolatility(2.0, 10, 10)).toContain('alta volatilidade');
      expect(describeVolatility(1.0, 10, 10)).toContain('volatilidade moderada');
      expect(describeVolatility(0.5, 10, 10)).toContain('volatilidade contida');
      expect(describeVolatility(0.1, 10, 10)).toContain('baixa volatilidade');
    });

    it('aponta predomínio quando um lado supera o outro em 50%', () => {
      expect(describeVolatility(1.0, 20, 10)).toContain('predomínio de dias de alta');
      expect(describeVolatility(1.0, 10, 20)).toContain('predomínio de dias de baixa');
    });

    it('considera equilibrado quando a diferença é pequena', () => {
      expect(describeVolatility(1.0, 11, 10)).toContain('distribuição equilibrada');
    });

    it('informa a contagem de períodos', () => {
      expect(describeVolatility(1.0, 7, 3)).toContain('7 períodos positivos e 3 negativos');
    });
  });

  describe('describeLast5Trend', () => {
    it('descreve cada uma das três tendências', () => {
      expect(describeLast5Trend('flat', 0.02)).toContain('lateralizada');
      expect(describeLast5Trend('up', 3)).toContain('ascendente');
      expect(describeLast5Trend('down', -3)).toContain('descendente');
    });
  });

  describe('describeAmplitude', () => {
    const formatador = (v: number) => `R$ ${v.toFixed(2)}`;

    it('classifica a amplitude entre mínima e máxima', () => {
      const alta = { date: '2026-02-01', value: 200 };
      const baixa = { date: '2026-01-01', value: 100 };

      // (200-100)/100 = 100% → muito ampla
      expect(describeAmplitude(alta, baixa, formatador)).toContain('muito ampla');
    });

    it('usa o formatador recebido para os valores', () => {
      const texto = describeAmplitude(
        { date: '2026-02-01', value: 150 },
        { date: '2026-01-01', value: 100 },
        formatador,
      );

      expect(texto).toContain('R$ 150.00');
      expect(texto).toContain('R$ 100.00');
    });

    it('exibe as datas no formato brasileiro', () => {
      const texto = describeAmplitude(
        { date: '2026-02-15', value: 150 },
        { date: '2026-01-05', value: 100 },
        formatador,
      );

      expect(texto).toContain('15/02/2026');
      expect(texto).toContain('05/01/2026');
    });
  });

  describe('describeSelicCorrelation', () => {
    it('associa queda no curto prazo com aperto monetário', () => {
      expect(describeSelicCorrelation(-5, 50)).toContain('aperto monetário');
    });

    it('associa alta com valorização a afrouxamento monetário', () => {
      expect(describeSelicCorrelation(5, 50)).toContain('afrouxamento monetário');
    });

    it('reconhece queda em ambos os prazos', () => {
      expect(describeSelicCorrelation(-5, -50)).toContain('Selic elevada');
    });

    it('reconhece recuperação técnica', () => {
      expect(describeSelicCorrelation(5, -50)).toContain('recuperação técnica');
    });

    it('cai no texto genérico quando falta algum dado', () => {
      expect(describeSelicCorrelation(null, 50)).toContain('Historicamente');
      expect(describeSelicCorrelation(5, null)).toContain('Historicamente');
    });
  });

  // ─── Agregação multi-série ────────────────────────────────────────────────

  describe('computeAggregatedTotal', () => {
    const entrada = (key: string, itens: IpeaItem[]) => ({
      key,
      label: key.toUpperCase(),
      data: [{ codigo: key, nome: key, dados: itens }] as IpeaSerie[],
    });

    it('devolve null quando nenhuma série tem dado válido', () => {
      expect(computeAggregatedTotal([])).toBeNull();
      expect(computeAggregatedTotal([entrada('a', [])])).toBeNull();
      expect(computeAggregatedTotal([entrada('a', [item('2026-01-01', null)])])).toBeNull();
    });

    it('soma o valor corrente de cada série', () => {
      const total = computeAggregatedTotal([
        entrada('a', [item('2026-03-01', 100)]),
        entrada('b', [item('2026-03-01', 50)]),
      ]);

      expect(total?.totalCurrent).toBe(150);
      expect(total?.referenceMonth).toBe('2026-03');
    });

    it('o mês de referência é o mais recente entre as séries', () => {
      const total = computeAggregatedTotal([
        entrada('a', [item('2026-01-01', 100)]),
        entrada('b', [item('2026-05-01', 50)]),
      ]);

      expect(total?.referenceMonth).toBe('2026-05');
    });

    it('série sem ponto no mês de referência usa o último que tiver', () => {
      // 'a' parou em janeiro, mas continua entrando no total com seu último valor.
      const total = computeAggregatedTotal([
        entrada('a', [item('2026-01-01', 100)]),
        entrada('b', [item('2026-05-01', 50)]),
      ]);

      expect(total?.totalCurrent).toBe(150);
    });

    it('calcula participação percentual e ordena da maior para a menor', () => {
      const total = computeAggregatedTotal([
        entrada('pequena', [item('2026-03-01', 25)]),
        entrada('grande', [item('2026-03-01', 75)]),
      ]);

      expect(total?.shares.map((s) => s.key)).toEqual(['grande', 'pequena']);
      expect(total?.shares[0].pct).toBeCloseTo(75, 5);
      expect(total?.shares[1].pct).toBeCloseTo(25, 5);
    });

    it('calcula a variação mensal quando todas as séries têm mês anterior', () => {
      const total = computeAggregatedTotal([
        entrada('a', [item('2026-02-01', 100), item('2026-03-01', 110)]),
        entrada('b', [item('2026-02-01', 100), item('2026-03-01', 130)]),
      ]);

      // (240 - 200) / 200 = +20%
      expect(total?.variationMM).toBeCloseTo(20, 5);
    });

    it('anula a variação mensal se qualquer série não tiver mês anterior', () => {
      const total = computeAggregatedTotal([
        entrada('a', [item('2026-02-01', 100), item('2026-03-01', 110)]),
        entrada('b', [item('2026-03-01', 130)]), // sem histórico
      ]);

      // Comparar um total parcial contra outro completo daria um número enganoso.
      expect(total?.variationMM).toBeNull();
    });

    it('calcula a variação anual comparando o mesmo mês do ano anterior', () => {
      const total = computeAggregatedTotal([
        entrada('a', [item('2025-03-01', 100), item('2026-03-01', 150)]),
        entrada('b', [item('2025-03-01', 100), item('2026-03-01', 150)]),
      ]);

      // (300 - 200) / 200 = +50%
      expect(total?.variationYoY).toBeCloseTo(50, 5);
    });

    it('anula a variação anual se faltar o mês correspondente em alguma série', () => {
      const total = computeAggregatedTotal([
        entrada('a', [item('2025-03-01', 100), item('2026-03-01', 150)]),
        entrada('b', [item('2025-07-01', 100), item('2026-03-01', 150)]),
      ]);

      expect(total?.variationYoY).toBeNull();
    });

    it('ignora séries sem dado, sem descartar as demais', () => {
      const total = computeAggregatedTotal([
        entrada('vazia', []),
        entrada('cheia', [item('2026-03-01', 80)]),
      ]);

      expect(total?.totalCurrent).toBe(80);
      expect(total?.shares).toHaveLength(1);
    });
  });
});