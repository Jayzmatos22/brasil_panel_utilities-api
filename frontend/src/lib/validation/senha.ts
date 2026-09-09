/**
 * Regra da senha, num lugar só.
 *
 * <p>Estava em três, com três exigências diferentes: o cadastro pedia composição forte,
 * a troca e a redefinição pediam só oito caracteres. Na prática dava para definir
 * "12345678" pela recuperação e depois não conseguir recadastrar a mesma senha.
 */

/**
 * Oito caracteres com maiúscula, minúscula, número e um símbolo — qualquer símbolo.
 *
 * <p>A regra anterior terminava em `[A-Za-z\d@$!%*?&]{8,}`, e esse colchete é uma lista
 * BRANCA: só aqueles sete símbolos existiam, e qualquer outro invalidava a senha inteira.
 * "Senha#Forte1" e "Xk7#mQ2p!Lz" eram recusadas por conterem `#`; "Brasil_Panel1!" pelo
 * `_`. Justamente o que um gerenciador de senhas gera. Pior: `P@ssw0rd`, das senhas mais
 * vazadas que existem, passava — a regra media a presença de certos caracteres, não a
 * força da senha.
 *
 * <p>Agora o quarto requisito é "um caractere que não seja letra nem dígito", sem dizer
 * qual. Espaço conta e é preservado: senha não é normalizada, ou a mesma digitada aqui e
 * no login viraria duas.
 */
const SENHA_FORTE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

/** Mensagem única — as três telas diziam coisas diferentes sobre a mesma exigência. */
export const SENHA_FRACA =
  'Senha fraca. Use ao menos 8 caracteres, com maiúscula, minúscula, número e um símbolo.';

export function senhaForte(valor: string): boolean {
  return SENHA_FORTE.test(valor);
}
