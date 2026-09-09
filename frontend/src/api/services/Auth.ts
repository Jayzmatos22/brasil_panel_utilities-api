

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
  UpdatePasswordResult,
  LoginResult,
  ConfirmAdminLoginRequest,
  ConfirmAdminPasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from '../../types/UserType';

export const authService = {
  register: (data: RegisterRequest) =>
    apiClient.post<RegisterResponse>('/auth/register', data).then((r) => r.data),

  verifyEmail: (data: VerifyEmailRequest) =>
    apiClient.post<AuthResponse>('/auth/verify-email', data).then((r) => r.data),

  resendCode: (data: ResendCodeRequest) =>
    apiClient.post<RegisterResponse>('/auth/resend-code', data).then((r) => r.data),

  // 202 = credenciais aceitas, sessão ainda não: falta o segundo fator do admin.
  // O status é a única fonte confiável aqui — o corpo do 202 nem tem os campos
  // de AuthResponse.
  login: (data: LoginRequest): Promise<LoginResult> =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) =>
      r.status === 202
        ? { twoFactorRequired: true as const, message: (r.data as unknown as { message: string }).message }
        : { twoFactorRequired: false as const, auth: r.data },
    ),

  confirmAdminLogin: (data: ConfirmAdminLoginRequest) =>
    apiClient.post<AuthResponse>('/auth/admin/confirm-login', data).then((r) => r.data),

  confirmAdminPasswordChange: (data: ConfirmAdminPasswordRequest) =>
    apiClient.post<void>('/auth/admin/confirm-password', data).then((r) => r.data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    apiClient.post<RegisterResponse>('/auth/forgot-password', data).then((r) => r.data),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post<void>('/auth/reset-password', data).then((r) => r.data),

  // Só o backend consegue apagar o cookie httpOnly — daí o endpoint dedicado.
  logout: () => apiClient.post<void>('/auth/logout').then((r) => r.data),

  updateName: (data: UpdateNameRequest) =>
  apiClient.patch<void>('/auth/update-name', data).then((r) => r.data),

  // 204 = trocada; 202 = retida à espera do código (admin).
  updatePassword: (data: UpdatePasswordRequest): Promise<UpdatePasswordResult> =>
    apiClient.patch<void>('/auth/update-password', data).then((r) => ({ pending: r.status === 202 })),

  deleteAccount: (data: DeleteAccountRequest) =>
  apiClient.delete<void>('/auth/delete-account', { data }).then((r) => r.data),
};