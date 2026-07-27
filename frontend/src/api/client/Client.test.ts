import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './Client';
import { ApiError } from '../../lib/errors/ErrorsHttp';
import { saveSession } from '../../lib/auth/jwt';

/**
 * O interceptor de resposta decide duas coisas críticas: quando derrubar a
 * sessão e como a mensagem de erro chega à tela. A distinção entre "sessão
 * expirou" e "credencial inválida" é o U2 — antes, errar a senha recarregava a
 * página e apagava o formulário.
 */
describe('interceptor do cliente HTTP', () => {
  const UM_DIA_MS = 86_400_000;

  /** Executa o handler de erro do interceptor sem fazer requisição real. */
  const dispararErro = (status: number, url: string, data: unknown = 'Erro') => {
    const handlers = (apiClient.interceptors.response as unknown as {
      handlers: { rejected: (e: unknown) => Promise<never> }[];
    }).handlers;

    const onRejected = handlers.find((h) => h?.rejected)!.rejected;
    return onRejected({ config: { url }, response: { status, data } });
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('configuração', () => {
    it('envia cookies em requisições cross-origin', () => {
      // Sem withCredentials, o cookie httpOnly de sessão nunca chegaria à API.
      expect(apiClient.defaults.withCredentials).toBe(true);
    });

    it('não injeta cabeçalho Authorization', () => {
      // O token não está mais acessível ao JavaScript — quem o envia é o navegador.
      expect(apiClient.defaults.headers.common.Authorization).toBeUndefined();
    });

    it('tem timeout definido', () => {
      expect(apiClient.defaults.timeout).toBeGreaterThan(0);
    });
  });

  describe('401 em rota de autenticação', () => {
    it('não limpa a sessão nem redireciona', async () => {
      saveSession('usuario@exemplo.com', 'USER', UM_DIA_MS);

      await expect(dispararErro(401, '/auth/login', 'E-mail ou senha inválidos.'))
        .rejects.toBeInstanceOf(ApiError);

      // Era o próprio login falhando: derrubar a sessão apagaria o formulário.
      expect(localStorage.getItem('session')).not.toBeNull();
    });

    it('preserva a mensagem vinda do backend', async () => {
      await expect(dispararErro(401, '/auth/login', 'E-mail ou senha inválidos.'))
        .rejects.toMatchObject({ message: 'E-mail ou senha inválidos.', status: 401 });
    });
  });

  describe('401 em rota protegida', () => {
    // jsdom não implementa navegação; sem substituir location, o redirecionamento
    // emite "Not implemented: navigation to another Document" e polui a saída.
    // Substituindo, o destino vira algo que dá para afirmar.
    const stubLocation = () => {
      const stub = { href: '' };
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: stub,
      });
      return stub;
    };

    it('limpa o hint de sessão e manda para o login', async () => {
      saveSession('usuario@exemplo.com', 'USER', UM_DIA_MS);
      const location = stubLocation();

      await dispararErro(401, '/bcb/selic').catch(() => { /* esperado */ });

      // Sessão expirou de fato: o hint precisa sumir para o guard barrar a rota.
      expect(localStorage.getItem('session')).toBeNull();
      expect(location.href).toBe('/login-usuario');
    });
  });

  describe('conversão de erros', () => {
    it('usa o corpo em texto como mensagem', async () => {
      await expect(dispararErro(429, '/bcb/selic', 'Muitas tentativas de login.'))
        .rejects.toMatchObject({ message: 'Muitas tentativas de login.', status: 429 });
    });

    it('extrai message quando o corpo é objeto', async () => {
      await expect(dispararErro(400, '/bcb/selic', { message: 'Parâmetro inválido' }))
        .rejects.toMatchObject({ message: 'Parâmetro inválido', status: 400 });
    });

    it('usa mensagem genérica quando não há corpo reconhecível', async () => {
      await expect(dispararErro(502, '/bcb/selic', null))
        .rejects.toMatchObject({ message: 'Erro de conexão' });
    });
  });
});