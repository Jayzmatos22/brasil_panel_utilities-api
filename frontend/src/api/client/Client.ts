import axios from 'axios';
import { ApiError } from '../../lib/errors/ErrorsHttp';
import { clearSession } from '../../lib/auth/jwt';



export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  timeout: 15000,
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