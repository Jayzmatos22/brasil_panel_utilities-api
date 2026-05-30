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


apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status ?? 0;
    const message = error.response?.data?.message ?? 'Erro de conexão';
    return Promise.reject(new ApiError(message, status));
  }
);