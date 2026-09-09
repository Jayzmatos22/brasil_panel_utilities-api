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
 * Uma ou mais palavras de letras, aceitando hífen e apóstrofo.
 *
 * <p>`\p{L}` em vez da faixa `À-ÿ` que estava aqui: aquela faixa é de code points, não
 * de letras, e engloba `×` (U+00D7) e `÷` (U+00F7) — "A×B C" passava. Ao mesmo tempo
 * deixava de fora letras fora do Latin-1. `\p{L}` é exatamente "qualquer letra".
 *
 * <p>Hífen e apóstrofo entram porque "Ana-Maria", "Maria D'Ávila" e "Sant'Anna" são
 * nomes brasileiros correntes que a regra anterior recusava.
 */
const FORMATO = /^\p{L}[\p{L}'’-]*(?: \p{L}[\p{L}'’-]*)*$/u;

/**
 * Mínimo de letras no nome inteiro.
 *
 * <p>Sobrenome deixou de ser exigido: recusar "Ana" não protegia nada e travava gente
 * legítima na porta. O que resta é um piso que barra digitação acidental — "a", "x" —
 * sem opinar sobre como a pessoa se chama.
 *
 * <p>Contado em LETRAS, não em caracteres: senão "A-B" passaria pelo tamanho sem ter
 * três letras de verdade.
 */
const MIN_LETRAS = 3;

/** Normaliza antes de validar; ver {@link limparNome}. */
export function nomeValido(valor: string): boolean {
  const limpo = limparNome(valor);
  if (!FORMATO.test(limpo)) return false;
  return (limpo.match(/\p{L}/gu) ?? []).length >= MIN_LETRAS;
}
