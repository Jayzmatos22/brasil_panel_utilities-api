/**
 * Decodifica o payload do JWT armazenado no localStorage sem verificar a assinatura
 * (verificação é responsabilidade do backend).
 */
interface JwtPayload {
  sub:  string;   // e-mail do usuário
  role: 'USER' | 'ADMIN';
  iss:  string;
  jti:  string;
  iat:  number;
  exp:  number;
}

function decodePayload(): JwtPayload | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenEmail(): string {
  return decodePayload()?.sub ?? 'Usuário';
}

export function getTokenRole(): 'USER' | 'ADMIN' | null {
  return decodePayload()?.role ?? null;
}

export function isAdmin(): boolean {
  return getTokenRole() === 'ADMIN';
}

export function isAuthenticated(): boolean {
  const payload = decodePayload();
  if (!payload) return false;
  // Verifica expiração
  return payload.exp * 1000 > Date.now();
}