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
  /**
   * Opcional de propósito, e não porque o backend possa omiti-lo: sessões
   * gravadas ANTES desta versão existem no localStorage sem o campo, e exigi-lo
   * quebraria a leitura de quem já estava logado no momento do deploy.
   * `getTokenName()` cobre a ausência sem obrigar ninguém a relogar.
   */
  name?: string;
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

/**
 * Grava o hint após login ou verificação de e-mail.
 *
 * `name` entra no fim e opcional para não quebrar as chamadas posicionais que
 * já existem — inclusive as das suítes.
 */
export function saveSession(
  email: string,
  role: 'USER' | 'ADMIN',
  expiresInMs: number,
  name?: string,
): void {
  const hint: SessionHint = {
    email,
    role,
    exp: Math.floor((Date.now() + expiresInMs) / 1000),
    name,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(hint));
}

/**
 * Atualiza só o nome do hint, preservando o resto.
 *
 * Existe por causa de /dashboard/settings, que deixa a pessoa se renomear. Sem
 * isto o cabeçalho continuaria exibindo o nome antigo até o próximo login —
 * o formulário diria "Nome atualizado com sucesso!" e a tela desmentiria.
 *
 * Não faz nada sem sessão: renomear-se deslogado não é um caminho possível, e
 * criar um hint aqui inventaria uma sessão que não existe.
 */
export function updateSessionName(name: string): void {
  const hint = read();
  if (!hint) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...hint, name }));
}

/** Limpa o hint. O cookie em si só o backend consegue apagar (POST /auth/logout). */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getTokenEmail(): string {
  return read()?.email ?? 'Usuário';
}

/**
 * Nome para exibição, com degradação em três degraus.
 *
 * O segundo degrau é o que a interface fazia ANTES de o nome atravessar o
 * login: `email.split('@')[0]`, que rendia "jailtonmatos200" no lugar de
 * "Jailton". Ele fica como rede para as sessões abertas antes desta versão,
 * cujo hint não tem `name` — assim ninguém precisa relogar para o cabeçalho
 * voltar a funcionar, e o resultado é exatamente o de antes, não um vazio.
 */
export function getTokenName(): string {
  const hint = read();
  if (!hint) return 'Usuário';
  return hint.name?.trim() || hint.email.split('@')[0] || 'Usuário';
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