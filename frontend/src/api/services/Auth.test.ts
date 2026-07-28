import { beforeEach, describe, expect, it, vi } from 'vitest';

// O cliente é substituído por mock: aqui interessa o contrato com a API
// (método, caminho e desempacotamento), não a camada de rede.
vi.mock('../client/Client', () => ({
  apiClient: {
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '../client/Client';
import { authService } from './Auth';

const mocked = apiClient as unknown as {
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.post.mockResolvedValue({ data: { ok: true } });
    mocked.patch.mockResolvedValue({ data: undefined });
    mocked.delete.mockResolvedValue({ data: undefined });
  });

  describe('caminhos dos endpoints', () => {
    it('register aponta para /auth/register', async () => {
      const dados = { name: 'Fulano', email: 'a@b.com', password: 'Senha@123' };

      await authService.register(dados);

      expect(mocked.post).toHaveBeenCalledWith('/auth/register', dados);
    });

    it('verifyEmail aponta para /auth/verify-email', async () => {
      await authService.verifyEmail({ email: 'a@b.com', code: '123456' });

      expect(mocked.post).toHaveBeenCalledWith('/auth/verify-email', {
        email: 'a@b.com',
        code: '123456',
      });
    });

    it('resendCode aponta para /auth/resend-code', async () => {
      await authService.resendCode({ email: 'a@b.com' });

      expect(mocked.post).toHaveBeenCalledWith('/auth/resend-code', { email: 'a@b.com' });
    });

    it('login aponta para /auth/login', async () => {
      await authService.login({ email: 'a@b.com', password: 'Senha@123' });

      expect(mocked.post).toHaveBeenCalledWith('/auth/login', {
        email: 'a@b.com',
        password: 'Senha@123',
      });
    });

    it('logout usa POST e não envia corpo', async () => {
      await authService.logout();

      // É o único jeito de apagar o cookie httpOnly — só o servidor consegue.
      expect(mocked.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('updateName usa PATCH', async () => {
      await authService.updateName({ name: 'Novo Nome' });

      expect(mocked.patch).toHaveBeenCalledWith('/auth/update-name', { name: 'Novo Nome' });
    });

    it('updatePassword usa PATCH', async () => {
      const dados = { currentPassword: 'antiga', newPassword: 'nova' };

      await authService.updatePassword(dados);

      expect(mocked.patch).toHaveBeenCalledWith('/auth/update-password', dados);
    });

    it('deleteAccount envia a senha no corpo do DELETE', async () => {
      await authService.deleteAccount({ password: 'Senha@123' });

      // DELETE com corpo exige a forma { data }, fácil de quebrar sem perceber:
      // passar o objeto direto viraria querystring e o backend recusaria.
      expect(mocked.delete).toHaveBeenCalledWith('/auth/delete-account', {
        data: { password: 'Senha@123' },
      });
    });
  });

  describe('desempacotamento da resposta', () => {
    it('devolve o corpo, não o envelope do axios', async () => {
      mocked.post.mockResolvedValue({
        data: { email: 'a@b.com', role: 'USER', expiresInMs: 86_400_000 },
        status: 200,
        headers: {},
      });

      const resposta = await authService.login({ email: 'a@b.com', password: 'x' });

      expect(resposta).toEqual({ email: 'a@b.com', role: 'USER', expiresInMs: 86_400_000 });
    });

    it('propaga a falha para quem chamou', async () => {
      mocked.post.mockRejectedValue(new Error('rede fora'));

      await expect(authService.login({ email: 'a@b.com', password: 'x' }))
        .rejects.toThrow('rede fora');
    });
  });
});