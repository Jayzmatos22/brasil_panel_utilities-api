// ─── Auth — POST /api/auth/login ─────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

/** O JWT não vem aqui: ele chega em cookie httpOnly, inacessível ao JavaScript. */
export interface AuthResponse {
  email: string;
  role: 'USER' | 'ADMIN';
  expiresInMs: number;
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

// ─── Perfil profissional — /api/auth/profile ─────────────────────────────────
//
// As constantes abaixo espelham os enums ProfessionalArea e EducationLevel do
// backend, que têm CHECK correspondente no Postgres. O que trafega é a
// constante; os rótulos exibidos vivem na PerfilPage e podem mudar sem tocar em
// nada aqui. Acrescentar valor exige migration do lado de lá.
export type ProfessionalArea =
  | 'TECNOLOGIA'
  | 'FINANCAS'
  | 'EDUCACAO'
  | 'SAUDE'
  | 'INDUSTRIA'
  | 'COMERCIO_SERVICOS'
  | 'SETOR_PUBLICO'
  | 'OUTRA';

export type EducationLevel =
  | 'ENSINO_FUNDAMENTAL'
  | 'ENSINO_MEDIO'
  | 'ENSINO_TECNICO'
  | 'SUPERIOR_CURSANDO'
  | 'SUPERIOR_COMPLETO'
  | 'POS_GRADUACAO'
  | 'MESTRADO_DOUTORADO';

export interface ProfileRequest {
  profession:     string;
  area:           ProfessionalArea | null;
  educationLevel: EducationLevel;
  institution:    string | null;
}

/**
 * `onboardingCompletedAt` nulo significa que a etapa ainda não foi apresentada —
 * é o que distingue "nunca viu" de "viu e pulou". Não é remarcado quando o
 * perfil é editado depois.
 */
export interface ProfileResponse {
  profession:            string | null;
  area:                  ProfessionalArea | null;
  educationLevel:        EducationLevel | null;
  institution:           string | null;
  onboardingCompletedAt: string | null;
}