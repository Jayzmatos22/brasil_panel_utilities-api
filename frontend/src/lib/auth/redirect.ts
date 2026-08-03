/**
 * Destino pós-login.
 *
 * Os guards (PrivateRoute/AdminRoute) anexam o caminho pretendido ao state da
 * navegação antes de mandar a pessoa ao login. Aqui esse valor é validado e
 * convertido no destino final.
 *
 * Fica em módulo próprio, e não dentro do LoginPage, porque é a única lógica
 * do fluxo de autenticação que decide para onde o usuário vai — e isso
 * merece teste sem precisar montar a tela inteira.
 */

/** Para onde vai quem chegou ao login por conta própria. */
export const DEFAULT_REDIRECT = '/dashboard/economia';

/** Telas que nunca fazem sentido como destino pós-login. */
const AUTH_PATHS = ['/login-usuario', '/registro-usuario', '/verificar-email'];

/**
 * Converte o state da navegação no caminho para onde redirecionar.
 *
 * Recusa qualquer coisa que não seja um caminho interno. O state do router
 * não é escrito pela URL, então o risco de open redirect aqui é baixo — mas
 * "baixo" não é "nenhum": basta um `navigate(..., { state })` construído a
 * partir de dado não confiável para o valor virar destino. Validar custa
 * cinco linhas.
 *
 * Casos recusados:
 *   "https://evil.com"  → absoluta
 *   "//evil.com"        → protocolo-relativa: o navegador trata como absoluta
 *   "/\evil.com"        → idem, via barra invertida
 *   "/login-usuario"    → devolveria a pessoa ao próprio login
 */
export function resolveRedirect(state: unknown): string {
  if (typeof state !== 'object' || state === null) return DEFAULT_REDIRECT;

  const { from } = state as { from?: unknown };
  if (typeof from !== 'string' || from === '') return DEFAULT_REDIRECT;

  const isInternalPath =
    from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/\\');
  if (!isInternalPath) return DEFAULT_REDIRECT;

  const isAuthScreen = AUTH_PATHS.some(
    (path) => from === path || from.startsWith(`${path}?`),
  );
  if (isAuthScreen) return DEFAULT_REDIRECT;

  return from;
}