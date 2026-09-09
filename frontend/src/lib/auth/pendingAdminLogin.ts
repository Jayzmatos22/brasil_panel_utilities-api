/**
 * Guarda as credenciais do admin entre o /login e a confirmação do código.
 *
 * <p>Em memória de propósito — nem `localStorage`, nem `sessionStorage`, nem o state
 * da navegação. Os dois primeiros persistem em disco; o terceiro vai para o
 * `history.state`, que sobrevive a recarregamentos e é legível por qualquer script da
 * origem. Uma senha não tem por que existir em nenhum dos três.
 *
 * <p>O efeito colateral é desejado: recarregar a tela de confirmação apaga isto e
 * devolve a pessoa ao login. Uma senha que sobrevive ao F5 é uma senha guardada.
 */
export interface PendingAdminLogin {
  email: string;
  password: string;
}

let pendente: PendingAdminLogin | null = null;

export function setPendingAdminLogin(dados: PendingAdminLogin): void {
  pendente = dados;
}

export function getPendingAdminLogin(): PendingAdminLogin | null {
  return pendente;
}

export function clearPendingAdminLogin(): void {
  pendente = null;
}
