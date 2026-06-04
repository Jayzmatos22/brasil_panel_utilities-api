import { apiClient } from '../client/Client';
import type {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  ResendCodeRequest,
  AuthResponse,
  VerifyEmailRequest,
} from '../../types/UserType';

export const authService = {
  register: (data: RegisterRequest) =>
    apiClient.post<RegisterResponse>('/auth/register', data).then((r) => r.data),

  verifyEmail: (data: VerifyEmailRequest) =>
    apiClient.post<AuthResponse>('/auth/verify-email', data).then((r) => r.data),

  resendCode: (data: ResendCodeRequest) =>
    apiClient.post<RegisterResponse>('/auth/resend-code', data).then((r) => r.data),

  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),
};