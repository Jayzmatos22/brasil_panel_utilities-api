import { describe, expect, it } from 'vitest';
import { senhaForte } from './senha';

describe('senhaForte', () => {

  // A regra anterior terminava em [A-Za-z\d@$!%*?&]{8,} — lista BRANCA de símbolos.
  // Todas estas são fortes e eram recusadas por usarem um símbolo fora daqueles sete.
  it.each([
    'Senha#Forte1',
    'Xk7#mQ2p!Lz',
    'Brasil_Panel1!',
    'Minha-Senha1!',
    'Senha.Forte1@',
    'Senha+Forte1!',
  ])('aceita símbolo fora da lista branca antiga: %j', (senha) => {
    expect(senhaForte(senha)).toBe(true);
  });

  it('aceita espaço como símbolo, sem normalizar', () => {
    // Normalizar seria pior que aceitar: a senha gravada no cadastro e a digitada no
    // login precisam ser byte a byte a mesma coisa.
    expect(senhaForte('Senha Forte1')).toBe(true);
  });

  it.each([
    ['sem maiúscula', 'senha@123'],
    ['sem minúscula', 'SENHA@123'],
    ['sem número', 'Senha@abc'],
    ['sem símbolo', 'Senha1234'],
    ['curta demais', 'Ab1@cde'],
  ])('recusa quando falta %s', (_motivo, senha) => {
    expect(senhaForte(senha)).toBe(false);
  });

  it('continua aceitando as que já passavam', () => {
    expect(senhaForte('Senha@123')).toBe(true);
    expect(senhaForte('Kf8$vN2wQ9xR')).toBe(true);
  });
});
