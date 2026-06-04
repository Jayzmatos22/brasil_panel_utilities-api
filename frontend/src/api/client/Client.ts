import axios from 'axios';
import { ApiError } from '../../lib/errors/ErrorsHttp';



export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  timeout: 15000,
});

// Interceptor pra injetar o JWT automaticamente
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


// Interceptor único: trata 401 (redireciona para login) e converte erros em ApiError.
// Ordem importa: 401 é capturado antes da conversão para ApiError.
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
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