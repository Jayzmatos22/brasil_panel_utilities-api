# Arte das telas de autenticação

Esta pasta guarda a arte de fundo de `/registro-usuario` e `/login-usuario`.

## O arquivo esperado

| Prefixo           | Onde aparece                          | Formato preferido |
|-------------------|---------------------------------------|-------------------|
| `registro-login0` | fundo de Registro **e** Login         | `.webp` ou `.avif` |

Solte o arquivo aqui com esse prefixo — por exemplo
`registro-login0-img.webp` — e ele passa a ser usado nas duas telas. **Nenhum
import muda**: quem resolve é o glob de `src/pages/auth/images.ts`, no mesmo
padrão de `pages/About/data/images.ts` e `pages/onboarding/images.ts`.

O resolvedor prefere `.avif` > `.webp` > `.jpeg`/`.jpg` > `.png`. Uma versão
otimizada ao lado de um JPEG de mesmo prefixo sempre vence.

## Enquanto o arquivo não existe

As duas telas ficam só com o `.bg-smoke-abyss`, sem imagem e sem ícone de
imagem quebrada — `findAuthImage()` devolve `undefined` e o componente
`AuthBackdrop` não renderiza nada. O build não quebra. É o mesmo contrato dos
outros dois resolvedores.

## Peso

`import.meta.glob({ eager: true })` empacota **todo** arquivo que casa com o
padrão, mesmo os que o código descarta em tempo de execução. Não deixe o
original pesado aqui ao lado da versão otimizada: mova-o para
`assets/app/originais/`, que nenhum glob alcança (o `*` do Vite não atravessa
`/`). Foi o descuido que já pôs 3,4 MB de imagem inútil num `dist` — a história
está em `assets/app/originais/LEIA-ME.md`.

Para referência de tamanho: a arara do hero da landing (1920×1280) fecha em
177 kB de WebP.

## Como a arte é composta

Vale saber antes de escolher o recorte, porque a composição da foto muda o
resultado:

- **No mobile** ela é o fundo da página inteira, ancorada no topo
  (`object-position: 50% 22%`) e dissolvida para baixo. O que estiver no terço
  superior da foto é o que aparece.
- **No desktop (lg+)** ela ocupa a metade esquerda — o painel de marca — com a
  massa deslocada para a direita, de modo a costurar a emenda do split-screen.
  O texto do painel fica sobre um véu quase opaco, e a metade direita (o
  formulário) fica em abyss limpo.

A dissolução é feita com `mask-image` radial, não com um véu retangular: a
imagem não tem borda, ela deixa de existir. Os detalhes e o porquê de cada
número estão em `App.css`, seção "Arte das telas de autenticação".
