// A hierarquia do câmbio contratado é o contrato que o painel agregado assume.
//
// Existe porque `isAggregate` já esteve errado: 'financeiro' é "Financeiro
// (Total)" — a soma de compras e vendas — e estava marcado como folha. Com esse
// erro, somar as folhas contava o financeiro DUAS vezes: o total inflava e cada
// fatia da barra de participação encolhia junto, sem nada quebrar.
//
// É um erro silencioso: nada estoura, o número só fica errado. Daí o teste.
import { describe, it, expect } from 'vitest';
import { CAMBIO_SPECS } from './CambioSpecs';

const folhas = () => CAMBIO_SPECS.filter((s) => !s.isAggregate).map((s) => s.key);
const totais = () => CAMBIO_SPECS.filter((s) => s.isAggregate).map((s) => s.key);

describe('CAMBIO_SPECS — hierarquia de agregação', () => {
  it('as folhas são exatamente os quatro componentes elementares', () => {
    expect(folhas().sort()).toEqual(
      [
        'comercial-exportacoes',
        'comercial-importacoes',
        'financeiro-compras',
        'financeiro-vendas',
      ].sort(),
    );
  });

  it('as três séries que já são soma de outras estão marcadas como agregado', () => {
    expect(totais().sort()).toEqual(
      ['comercial', 'comercial-financeiro', 'financeiro'].sort(),
    );
  });

  it('nenhuma folha é, ela própria, um "(Total)"', () => {
    // Guarda de nomenclatura: se alguém adicionar uma série "X (Total)" e
    // esquecer o isAggregate, o agregado volta a contar duas vezes.
    const folhasComNomeDeTotal = CAMBIO_SPECS.filter(
      (s) => !s.isAggregate && /total/i.test(s.shortName),
    );
    expect(folhasComNomeDeTotal).toEqual([]);
  });

  it('toda folha tem accent próprio, senão a barra sai monocromática', () => {
    const cores = CAMBIO_SPECS.filter((s) => !s.isAggregate).map((s) => s.accent);
    expect(cores.every((c) => /^#[0-9a-f]{6}$/i.test(c))).toBe(true);
    expect(new Set(cores).size).toBe(cores.length);
  });
});
