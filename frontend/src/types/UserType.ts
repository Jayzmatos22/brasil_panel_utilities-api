import type { DataBank } from './BankDataType';
import type { UserAddress } from './AddressUserType';

// ─── Auth — POST /api/auth/login ─────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

// ─── Auth — POST /api/auth/register ──────────────────────────────────────────
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
}

// ─── Auth — POST /api/auth/verify-email ──────────────────────────────────────
export interface VerifyEmailRequest {
  email: string;
  code:  string;
}

// ─── Auth — POST /api/auth/resend-code ───────────────────────────────────────
export interface ResendCodeRequest {
  email: string;
}

// ─── Usuário — GET /api/auth/me (ou similar) ─────────────────────────────────
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

// ─── Modelo completo do usuário no app (inclui dados locais) ─────────────────
export interface User {
  idUserAccount: string;
  name: string;
  email: string;
  address: UserAddress;
  bank: DataBank;
}