

import { apiClient } from '../client/Client';
import type {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  ResendCodeRequest,
  AuthResponse,
  VerifyEmailRequest,
  UpdateNameRequest,
  DeleteAccountRequest,
  UpdatePasswordRequest,
  ProfileRequest,
  ProfileResponse
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

  // Só o backend consegue apagar o cookie httpOnly — daí o endpoint dedicado.
  logout: () => apiClient.post<void>('/auth/logout').then((r) => r.data),

  updateName: (data: UpdateNameRequest) =>
  apiClient.patch<void>('/auth/update-name', data).then((r) => r.data),

  updatePassword: (data: UpdatePasswordRequest) =>
    apiClient.patch<void>('/auth/update-password', data).then((r) => r.data),

  deleteAccount: (data: DeleteAccountRequest) =>
  apiClient.delete<void>('/auth/delete-account', { data }).then((r) => r.data),

  // ── Perfil profissional (onboarding) ──────────────────────────────────────
  // A identidade vem do cookie de sessão; nenhum destes envia e-mail ou id.

  getProfile: () =>
    apiClient.get<ProfileResponse>('/auth/profile').then((r) => r.data),

  updateProfile: (data: ProfileRequest) =>
    apiClient.patch<ProfileResponse>('/auth/update-profile', data).then((r) => r.data),

  skipOnboarding: () =>
    apiClient.post<void>('/auth/skip-onboarding').then((r) => r.data),
};