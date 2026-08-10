/**
 * Apaga o estado deixado pelo onboarding antigo (endereço + dados bancários).
 *
 * Aquele fluxo gravava o usuário inteiro no localStorage, incluindo número de
 * cartão, validade e CVV em texto puro. As páginas que escreviam essas chaves já
 * foram removidas, mas o navegador de quem passou por elas continua com o dado
 * gravado — remover o código não remove o que ele deixou para trás.
 *
 * Roda no boot e é idempotente: depois da primeira execução não há mais nada a
 * apagar. Pode ser excluída quando não houver mais sessões antigas em circulação.
 */
const LEGACY_KEYS = ['currentUser', 'db_users'] as const;

export function purgeLegacySession(): void {
  try {
    for (const key of LEGACY_KEYS) {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // localStorage indisponível (modo privado, storage cheio) não pode impedir
    // a aplicação de subir.
  }
}
