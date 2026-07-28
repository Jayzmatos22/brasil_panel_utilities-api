import { describe, expect, it } from 'vitest';
import { ApiError } from './ErrorsHttp';

/**
 * É o tipo que o interceptor produz e que as telas capturam para decidir a
 * mensagem — por isso precisa continuar sendo um Error de verdade.
 */
describe('ApiError', () => {
  it('guarda mensagem e status', () => {
    const erro = new ApiError('E-mail ou senha inválidos.', 401);

    expect(erro.message).toBe('E-mail ou senha inválidos.');
    expect(erro.status).toBe(401);
  });

  it('continua sendo um Error', () => {
    const erro = new ApiError('falhou', 500);

    // As mutations do TanStack Query tipam onError como Error; se a herança
    // quebrasse, o instanceof usado nas telas deixaria de funcionar.
    expect(erro).toBeInstanceOf(Error);
    expect(erro).toBeInstanceOf(ApiError);
  });

  it('é reconhecível por status ao diferenciar limite de cota', () => {
    const limite = new ApiError('Busca esgotada por hoje', 429);

    expect(limite instanceof ApiError && limite.status === 429).toBe(true);
  });

  it('preserva a pilha de chamadas', () => {
    expect(new ApiError('falhou', 500).stack).toBeDefined();
  });
});