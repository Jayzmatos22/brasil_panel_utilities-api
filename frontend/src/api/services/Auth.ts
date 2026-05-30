import { apiClient } from '../client/Client';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../../types/UserType';

export const authService = {
  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((res) => res.data),

  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((res) => res.data),
};