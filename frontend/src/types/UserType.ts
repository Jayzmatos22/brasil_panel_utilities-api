// ─── Auth — POST /api/auth/login ─────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

/** O JWT não vem aqui: ele chega em cookie httpOnly, inacessível ao JavaScript. */
export interface AuthResponse {
  /** Nome do usuário — o cabeçalho do painel o exibe no lugar do e-mail. */
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  expiresInMs: number;
}

/**
 * Login de admin não devolve sessão: o backend responde 202 e o acesso só se
 * completa depois do código enviado por e-mail. O flag distingue as duas saídas
 * sem obrigar o cliente a interpretar o código HTTP.
 */
export interface TwoFactorRequired {
  twoFactorRequired: true;
  message: string;
}

export type LoginResult =
  | { twoFactorRequired: false; auth: AuthResponse }
  | TwoFactorRequired;

// ─── Auth — POST /api/auth/admin/confirm-login ───────────────────────────────
//
// A senha vai de novo junto do código. Sem ela, bastaria conhecer o e-mail do
// admin para queimar as 5 tentativas de um desafio legítimo e trancar o login
// do dono. Como o formulário de login já a tem em memória, não custa nada.
export interface ConfirmAdminLoginRequest {
  email: string;
  password: string;
  code: string;
}

// ─── Auth — POST /api/auth/admin/confirm-password ────────────────────────────
export interface ConfirmAdminPasswordRequest {
  code: string;
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

// ─── Modelo do usuário no app ────────────────────────────────────────────────
//
// `address` e `bank` saíram daqui: eram obrigatórios no tipo mas o backend nunca
// os enviava — nenhuma dessas informações é persistida no Postgres. Quem lia
// `currentUser.bank.idAccount` quebrava com TypeError sempre que o localStorage
// estivesse limpo.
export interface User {
  idUserAccount: string;
  name: string;
  email: string;
}


export interface UpdateNameRequest {
  name: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** Para admin a troca fica retida até a confirmação por e-mail — daí o `pending`. */
export interface UpdatePasswordResult {
  pending: boolean;
}

export interface DeleteAccountRequest {
  password: string;
}


export interface UserRow {
  id:        string;
  name:      string;
  email:     string;
  role:      'USER' | 'ADMIN';
  createdAt: string;
}