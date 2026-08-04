// Resolução das artes da landing.
//
// Centralizado porque duas seções (Hero e AboutUs) precisam do mesmo glob —
// duplicá-lo faria o Vite emitir dois mapas idênticos e abriria espaço para
// os padrões divergirem com o tempo.
//
// Mesmo padrão de BancosPage, IbgePage e Helpers.ts: glob eager, que resolve
// as URLs em tempo de build. Trocar uma arte é soltar o arquivo em
// assets/app/ com o prefixo certo — nenhum import muda.

const ABOUT_IMAGES = import.meta.glob(
  '../../../assets/app/sobre*.{avif,webp,jpeg,jpg,png}',
  { eager: true, import: 'default' },
) as Record<string, string>;

/**
 * Ordem de preferência de formato. Existe porque o repositório guarda o JPEG
 * original ao lado do WebP otimizado, e os dois casam no mesmo prefixo: sem
 * isso a ordem alfabética entregaria o .jpg (1,5–2 MB) no lugar do .webp
 * (~200 kB), justamente na imagem que é o LCP da página.
 */
const FORMAT_RANK = ['.avif', '.webp', '.jpeg', '.jpg', '.png'];

const rank = (filename: string): number => {
  const i = FORMAT_RANK.findIndex((ext) => filename.endsWith(ext));
  return i === -1 ? FORMAT_RANK.length : i;
};

/**
 * Resolve a arte pelo prefixo do arquivo: 'sobre01' → sobre01-panel-img.webp.
 *
 * Devolve undefined quando não há arquivo — diferente do import estático, o
 * glob não quebra o build se a arte sumir. Quem consome deve renderizar a
 * <img> condicionalmente, para a ausência custar a textura e não um ícone de
 * imagem quebrada.
 */
export function findAboutImage(prefix: string): string | undefined {
  const alvo = prefix.toLowerCase();

  const candidatos = Object.entries(ABOUT_IMAGES)
    .map(([path, url]) => ({
      filename: path.toLowerCase().split('/').pop() ?? '',
      url,
    }))
    .filter(({ filename }) => filename.startsWith(alvo))
    .sort((a, b) => rank(a.filename) - rank(b.filename));

  return candidatos[0]?.url;
}
