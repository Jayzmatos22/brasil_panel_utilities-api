import axios from 'axios';
import { ApiError } from '../../lib/errors/ErrorsHttp';
import { clearSession } from '../../lib/auth/jwt';



// 15s cobre com folga uma resposta normal da API, inclusive as que passam por
// fonte externa.
//
// Já foi configurável por causa da hibernação do plano gratuito do Render, que
// fazia o primeiro acesso levar ~150s e exigia um teto de 180s em produção. A
// instância agora é paga e não hiberna, então esse teto não tem mais motivo —
// e teto alto demais é ruim: faz um backend genuinamente travado prender a
// interface por minutos em vez de falhar rápido.
//
// A variável continua sendo lida para não quebrar um ambiente que ainda a
// defina, mas produção não deve mais defini-la.
const DEFAULT_TIMEOUT_MS = 15_000;

const timeoutMs = Number(import.meta.env.VITE_API_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  timeout: timeoutMs,
  // O JWT vai num cookie httpOnly: o navegador o anexa sozinho.
  // Não há token em localStorage para injetar num header.
  withCredentials: true,
});


// Interceptor único: trata 401 (redireciona para login) e converte erros em ApiError.
// Ordem importa: 401 é capturado antes da conversão para ApiError.
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url ?? '';

    // Um 401 vindo do próprio login/verificação é credencial inválida, não sessão
    // expirada: redirecionar aqui recarregaria a página e apagaria o formulário.
    const isAuthAttempt = url.includes('/auth/');

    if (error.response?.status === 401 && !isAuthAttempt) {
      clearSession();
      window.location.href = '/login-usuario';
      return Promise.reject(error);
    }
    // Backend retorna strings simples como body — não como {message: ...}
    const status  = error.response?.status ?? 0;
    const message = typeof error.response?.data === 'string'
      ? error.response.data
      : (error.response?.data?.message ?? 'Erro de conexão');
    return Promise.reject(new ApiError(message, status));
  }
);