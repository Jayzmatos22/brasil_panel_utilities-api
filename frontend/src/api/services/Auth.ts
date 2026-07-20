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
  UpdatePasswordRequest
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

  updateName: (data: UpdateNameRequest) =>
  apiClient.patch<void>('/auth/update-name', data).then((r) => r.data),

updatePassword: (data: UpdatePasswordRequest) =>
  apiClient.patch<void>('/auth/update-password', data).then((r) => r.data),

deleteAccount: (data: DeleteAccountRequest) =>
  apiClient.delete<void>('/auth/delete-account', { data }).then((r) => r.data),
};