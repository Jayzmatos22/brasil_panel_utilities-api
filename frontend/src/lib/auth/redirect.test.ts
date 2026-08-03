import { describe, expect, it } from 'vitest';
import { DEFAULT_REDIRECT, resolveRedirect } from './redirect';

/**
 * O destino pós-login vem do state da navegação, que é dado de entrada. Se
 * esta função aceitar o que não deve, o login vira trampolim para fora do
 * site; se recusar o que devia aceitar, o usuário perde o destino a cada
 * sessão expirada.
 */
describe('resolveRedirect', () => {
  describe('devolve o destino pretendido', () => {
    it('aceita caminho interno simples', () => {
      expect(resolveRedirect({ from: '/dashboard/moedas/cambio' })).toBe(
        '/dashboard/moedas/cambio',
      );
    });

    it('preserva query string e hash', () => {
      const destino = '/dashboard/economia?periodo=5a#sec-selic';

      expect(resolveRedirect({ from: destino })).toBe(destino);
    });
  });

  describe('cai no padrão quando não há destino utilizável', () => {
    it.each([
      ['state ausente', undefined],
      ['state nulo', null],
      ['state sem a chave from', {}],
      ['from vazio', { from: '' }],
      ['from não-string', { from: 42 }],
    ])('%s', (_caso, state) => {
      expect(resolveRedirect(state)).toBe(DEFAULT_REDIRECT);
    });
  });

  describe('recusa destino externo', () => {
    it.each([
      ['URL absoluta', 'https://evil.com'],
      ['protocolo-relativa', '//evil.com'],
      ['barra invertida', '/\\evil.com'],
      ['caminho relativo', 'dashboard/economia'],
      ['javascript:', 'javascript:alert(1)'],
    ])('%s', (_caso, from) => {
      expect(resolveRedirect({ from })).toBe(DEFAULT_REDIRECT);
    });
  });

  describe('recusa as próprias telas de autenticação', () => {
    it.each([
      ['login', '/login-usuario'],
      ['login com query', '/login-usuario?erro=1'],
      ['cadastro', '/registro-usuario'],
      ['verificação de e-mail', '/verificar-email'],
    ])('%s', (_caso, from) => {
      // Devolver a pessoa ao login recém-concluído a prenderia num laço.
      expect(resolveRedirect({ from })).toBe(DEFAULT_REDIRECT);
    });
  });
});