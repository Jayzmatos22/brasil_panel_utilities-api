/**
 * Regra do nome da pessoa, num lugar só.
 *
 * <p>Estava duplicada — uma regex no cadastro e um `split(" ").length` nas
 * configurações — e as duas discordavam. A das configurações recusava "José  Carlos"
 * (dois espaços) porque `split(" ")` produz um pedaço vazio; a do cadastro recusava
 * hífen e apóstrofo.
 */

/**
 * Normaliza antes de validar: tira as pontas e colapsa espaços repetidos.
 *
 * <p>É o que faltava e provavelmente o que mais irritava: o campo não era normalizado,
 * então um espaço no fim — que teclado de celular adiciona sozinho ao autocompletar —
 * derrubava um nome perfeitamente válido.
 */
export function limparNome(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ');
}

/**
 * Duas ou mais palavras de letras, aceitando hífen e apóstrofo.
 *
 * <p>`\p{L}` em vez da faixa `À-ÿ` que estava aqui: aquela faixa é de code points, não
 * de letras, e engloba `×` (U+00D7) e `÷` (U+00F7) — "A×B C" passava. Ao mesmo tempo
 * deixava de fora letras fora do Latin-1. `\p{L}` é exatamente "qualquer letra".
 *
 * <p>Hífen e apóstrofo entram porque "Ana-Maria", "Maria D'Ávila" e "Sant'Anna" são
 * nomes brasileiros correntes que a regra anterior recusava.
 */
const NOME_COMPLETO = /^\p{L}[\p{L}'’-]*(?: \p{L}[\p{L}'’-]*)+$/u;

/** Se o valor, já normalizado, é um nome com sobrenome. */
export function nomeValido(valor: string): boolean {
  return NOME_COMPLETO.test(limparNome(valor));
}
