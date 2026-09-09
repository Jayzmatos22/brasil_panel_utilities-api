import { describe, expect, it } from 'vitest';
import { limparNome, nomeValido } from './nome';

describe('nomeValido', () => {

  // O que mais irritava na prática: teclado de celular adiciona um espaço ao
  // autocompletar, e o campo não era normalizado antes de validar. A pessoa
  // digitava um nome perfeitamente válido e levava um erro.
  it.each([
    'Jailton Matos ',
    ' Jailton Matos',
    'José  Carlos',
  ])('aceita espaço sobrando ou repetido: %j', (entrada) => {
    expect(nomeValido(entrada)).toBe(true);
  });

  // Nomes brasileiros correntes que a regra anterior recusava.
  it.each([
    'Ana-Maria Souza',
    "Maria D'Ávila",
    "Sant'Anna Costa",
    'José Ñuñez',
    'João da Silva',
  ])('aceita hífen, apóstrofo e acento: %j', (entrada) => {
    expect(nomeValido(entrada)).toBe(true);
  });

  it('exige sobrenome', () => {
    expect(nomeValido('Jailton')).toBe(false);
  });

  it('recusa vazio e só espaços', () => {
    expect(nomeValido('')).toBe(false);
    expect(nomeValido('    ')).toBe(false);
  });

  it('recusa dígitos no nome', () => {
    expect(nomeValido('Jailton 123')).toBe(false);
  });

  // A faixa `À-ÿ` da regra anterior era de code points, não de letras: englobava
  // × (U+00D7) e ÷ (U+00F7). "A×B C" passava.
  it('recusa os sinais de multiplicação e divisão que a faixa antiga deixava passar', () => {
    expect(nomeValido('A×B C')).toBe(false);
    expect(nomeValido('A÷B C')).toBe(false);
  });

  it('limparNome tira as pontas e colapsa os espaços do meio', () => {
    expect(limparNome('  José   Carlos  ')).toBe('José Carlos');
  });
});
