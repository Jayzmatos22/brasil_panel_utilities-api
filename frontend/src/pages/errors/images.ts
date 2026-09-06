// Resolução da arte do 404.
//
// Mesma assinatura dos outros três resolvedores do projeto (About, onboarding,
// auth): glob eager, que resolve as URLs em tempo de build. Trocar a arte é
// soltar o arquivo em assets/app/ com o prefixo certo — nenhum import muda.
//
// Não reaproveita os outros porque o padrão do glob precisa ser um literal para
// o Vite estatizar a lista, e cada um filtra por um prefixo diferente dentro da
// MESMA pasta: `sobre*` na landing, `universidade*` no onboarding,
// `registro-login*` no auth, `404-*` aqui. Alargar qualquer um deles para `*`
// faria cada tela empacotar a arte das outras — exatamente o que
// assets/app/originais/LEIA-ME.md documenta como a causa dos 3,4 MB de imagem
// inútil que já saíram num `dist`.
//
// A arte do 404 NÃO tem original pesado em originais/: as duas versões já
// chegaram prontas e leves (17 kB e 15 kB), ao contrário da foto do auth, que
// veio com 4000x6000 e precisou de redução.

const ERROR_IMAGES = import.meta.glob(
  '../../assets/app/404-*.{avif,webp,jpeg,jpg,png}',
  { eager: true, import: 'default' },
) as Record<string, string>;

/** Ordem de preferência de formato — igual à dos outros resolvedores. */
const FORMAT_RANK = ['.avif', '.webp', '.jpeg', '.jpg', '.png'];

const rank = (filename: string): number => {
  const i = FORMAT_RANK.findIndex((ext) => filename.endsWith(ext));
  return i === -1 ? FORMAT_RANK.length : i;
};

/**
 * Resolve a arte pelo prefixo do arquivo:
 * '404-mobile'  → 404-mobile-2x3.webp   (retrato, abaixo de md)
 * '404-desktop' → 404-desktop-16x9.webp (paisagem, md e acima)
 *
 * Devolve undefined quando não há arquivo — diferente do import estático, o
 * glob não quebra o build se a arte sumir. Quem consome deve renderizar a
 * <img> condicionalmente, para a ausência custar a textura e não um ícone de
 * imagem quebrada.
 */
export function findErrorImage(prefix: string): string | undefined {
  const alvo = prefix.toLowerCase();

  const candidatos = Object.entries(ERROR_IMAGES)
    .map(([path, url]) => ({
      filename: path.toLowerCase().split('/').pop() ?? '',
      url,
    }))
    .filter(({ filename }) => filename.startsWith(alvo))
    .sort((a, b) => rank(a.filename) - rank(b.filename));

  return candidatos[0]?.url;
}
