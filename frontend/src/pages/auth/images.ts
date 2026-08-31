// Resolução da arte das telas de autenticação.
//
// Mesma assinatura de `pages/About/data/images.ts` e `pages/onboarding/images.ts`:
// glob eager, que resolve as URLs em tempo de build. Trocar a arte é soltar o
// arquivo em assets/auth/ com o prefixo certo — nenhum import muda.
//
// Não reaproveita os outros dois módulos porque o padrão do glob precisa ser um
// literal para o Vite estatizar a lista, e lá ele aponta para `assets/app/`.
// Alargar aquele padrão faria a landing empacotar também a arte desta tela, e
// vice-versa — exatamente o que assets/app/originais/LEIA-ME.md documenta como
// a causa dos 3,4 MB de imagem inútil que já saíram num `dist`.

const AUTH_IMAGES = import.meta.glob(
  '../../assets/auth/registro-login*.{avif,webp,jpeg,jpg,png}',
  { eager: true, import: 'default' },
) as Record<string, string>;

/**
 * Ordem de preferência de formato. Existe pelo mesmo motivo dos outros dois
 * resolvedores: o repositório pode guardar o original pesado ao lado da versão
 * otimizada, e os dois casam no mesmo prefixo — sem isto a ordem alfabética
 * entregaria o .jpg.
 */
const FORMAT_RANK = ['.avif', '.webp', '.jpeg', '.jpg', '.png'];

const rank = (filename: string): number => {
  const i = FORMAT_RANK.findIndex((ext) => filename.endsWith(ext));
  return i === -1 ? FORMAT_RANK.length : i;
};

/**
 * Resolve a arte pelo prefixo do arquivo:
 * 'registro-login0' → registro-login0-img.webp.
 *
 * Devolve undefined quando não há arquivo — diferente do import estático, o
 * glob não quebra o build se a arte sumir. Quem consome deve renderizar a
 * <img> condicionalmente, para a ausência custar a textura e não um ícone de
 * imagem quebrada. É o que `AuthBackdrop` faz.
 */
export function findAuthImage(prefix: string): string | undefined {
  const alvo = prefix.toLowerCase();

  const candidatos = Object.entries(AUTH_IMAGES)
    .map(([path, url]) => ({
      filename: path.toLowerCase().split('/').pop() ?? '',
      url,
    }))
    .filter(({ filename }) => filename.startsWith(alvo))
    .sort((a, b) => rank(a.filename) - rank(b.filename));

  return candidatos[0]?.url;
}
