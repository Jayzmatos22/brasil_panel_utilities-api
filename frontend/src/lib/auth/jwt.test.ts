import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSession,
  getTokenEmail,
  getTokenName,
  getTokenRole,
  isAdmin,
  isAuthenticated,
  saveSession,
  updateSessionName,
} from './jwt';

/**
 * O hint de sessão é o que sustenta os guards de rota. Ele não autentica nada —
 * a credencial real é o cookie httpOnly — mas se a leitura quebrar, o usuário
 * fica preso fora do painel mesmo com sessão válida.
 */
describe('sessão do cliente', () => {
  const UM_DIA_MS = 86_400_000;

  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveSession', () => {
    it('grava e-mail, role e expiração', () => {
      saveSession('usuario@exemplo.com', 'ADMIN', UM_DIA_MS);

      expect(getTokenEmail()).toBe('usuario@exemplo.com');
      expect(getTokenRole()).toBe('ADMIN');
      expect(isAuthenticated()).toBe(true);
    });

    it('não guarda nenhum token', () => {
      saveSession('usuario@exemplo.com', 'USER', UM_DIA_MS);

      // O ponto do S12: mesmo lido por XSS, o hint não autentica requisição alguma.
      const bruto = localStorage.getItem('session') ?? '';
      expect(bruto).not.toContain('token');
      expect(Object.keys(JSON.parse(bruto))).toEqual(['email', 'role', 'exp']);
    });

    it('converte a duração em epoch de segundos', () => {
      const antes = Math.floor(Date.now() / 1000);
      saveSession('usuario@exemplo.com', 'USER', UM_DIA_MS);

      const { exp } = JSON.parse(localStorage.getItem('session')!);
      expect(exp).toBeGreaterThanOrEqual(antes + 86_400 - 2);
      expect(exp).toBeLessThanOrEqual(antes + 86_400 + 2);
    });
  });

  describe('isAuthenticated', () => {
    it('é falso quando não há sessão', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('é falso quando a sessão expirou', () => {
      saveSession('usuario@exemplo.com', 'USER', -1000);

      expect(isAuthenticated()).toBe(false);
    });

    it('é falso quando o conteúdo está corrompido', () => {
      localStorage.setItem('session', 'isto-não-é-json');

      // Não pode lançar: o usuário ficaria com a aplicação quebrada na inicialização.
      expect(isAuthenticated()).toBe(false);
      expect(getTokenRole()).toBeNull();
    });
  });

  describe('isAdmin', () => {
    it('é verdadeiro apenas para ADMIN', () => {
      saveSession('admin@exemplo.com', 'ADMIN', UM_DIA_MS);
      expect(isAdmin()).toBe(true);
    });

    it('é falso para USER', () => {
      saveSession('usuario@exemplo.com', 'USER', UM_DIA_MS);
      expect(isAdmin()).toBe(false);
    });

    it('é falso sem sessão', () => {
      expect(isAdmin()).toBe(false);
    });
  });

  describe('clearSession', () => {
    it('remove o hint', () => {
      saveSession('usuario@exemplo.com', 'USER', UM_DIA_MS);
      clearSession();

      expect(localStorage.getItem('session')).toBeNull();
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('getTokenEmail', () => {
    it('devolve um rótulo genérico sem sessão', () => {
      expect(getTokenEmail()).toBe('Usuário');
    });
  });

  /**
   * O nome alimenta o cabeçalho do painel. A degradação em três degraus é o que
   * permite ligar isto sem deslogar ninguém: quem já estava logado tem um hint
   * gravado antes de o campo existir.
   */
  describe('getTokenName', () => {
    it('devolve o nome quando a sessão o tem', () => {
      saveSession('usuario@exemplo.com', 'USER', UM_DIA_MS, 'Fulano de Tal');

      expect(getTokenName()).toBe('Fulano de Tal');
      // O e-mail continua disponível para quem precisa da identidade real —
      // AdminUsersPage compara por ele.
      expect(getTokenEmail()).toBe('usuario@exemplo.com');
    });

    it('cai para o trecho antes do @ em sessão gravada sem nome', () => {
      saveSession('usuario@exemplo.com', 'USER', UM_DIA_MS);

      expect(getTokenName()).toBe('usuario');
    });

    it('ignora nome só de espaços e usa o e-mail', () => {
      saveSession('usuario@exemplo.com', 'USER', UM_DIA_MS, '   ');

      expect(getTokenName()).toBe('usuario');
    });

    it('devolve um rótulo genérico sem sessão', () => {
      expect(getTokenName()).toBe('Usuário');
    });
  });

  describe('updateSessionName', () => {
    it('troca o nome preservando e-mail, role e expiração', () => {
      saveSession('usuario@exemplo.com', 'ADMIN', UM_DIA_MS, 'Nome Antigo');
      const { exp } = JSON.parse(localStorage.getItem('session')!);

      updateSessionName('Nome Novo');

      expect(getTokenName()).toBe('Nome Novo');
      expect(getTokenEmail()).toBe('usuario@exemplo.com');
      expect(getTokenRole()).toBe('ADMIN');
      expect(JSON.parse(localStorage.getItem('session')!).exp).toBe(exp);
    });

    it('não inventa sessão quando não há nenhuma', () => {
      updateSessionName('Nome Novo');

      expect(localStorage.getItem('session')).toBeNull();
      expect(isAuthenticated()).toBe(false);
    });
  });
});