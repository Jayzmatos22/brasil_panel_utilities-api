/**
 * Estado de sessão do lado do cliente.
 *
 * O JWT vive num cookie httpOnly — inacessível ao JavaScript, por design: é o que
 * impede que um XSS exfiltre a credencial. Como o token não pode mais ser lido nem
 * decodificado aqui, guardamos um "hint" com dados NÃO sensíveis, devolvidos pelo
 * backend no login.
 *
 * O hint não autentica nada. Se for adulterado, o usuário no máximo vê uma tela que
 * o servidor recusa em seguida — toda autorização real acontece no backend.
 */
interface SessionHint {
  email: string;
  role:  'USER' | 'ADMIN';
  exp:   number;   // epoch em segundos, espelha a expiração do JWT
}

const SESSION_KEY = 'session';

function read(): SessionHint | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionHint;
  } catch {
    return null;
  }
}

/** Grava o hint após login ou verificação de e-mail. */
export function saveSession(email: string, role: 'USER' | 'ADMIN', expiresInMs: number): void {
  const hint: SessionHint = {
    email,
    role,
    exp: Math.floor((Date.now() + expiresInMs) / 1000),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(hint));
}

/** Limpa o hint. O cookie em si só o backend consegue apagar (POST /auth/logout). */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getTokenEmail(): string {
  return read()?.email ?? 'Usuário';
}

export function getTokenRole(): 'USER' | 'ADMIN' | null {
  return read()?.role ?? null;
}

export function isAdmin(): boolean {
  return getTokenRole() === 'ADMIN';
}

export function isAuthenticated(): boolean {
  const hint = read();
  if (!hint) return false;
  return hint.exp * 1000 > Date.now();
}