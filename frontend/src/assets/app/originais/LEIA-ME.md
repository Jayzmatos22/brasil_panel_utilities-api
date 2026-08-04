# Originais das artes

Arquivos-fonte em resolução máxima, guardados para reedição futura.

**Esta pasta não é empacotada.** O glob que resolve as artes da landing vive em
`src/pages/About/data/images.ts` e usa o padrão `assets/app/sobre*` — o `*` do
Vite não atravessa `/`, então nada aqui dentro é alcançado por ele.

Isso é intencional. Com `import.meta.glob({ eager: true })` o Vite emite no
bundle **todo** arquivo que casa com o padrão, mesmo os que o código descarta em
tempo de execução. Com os JPEG ao lado dos WebP em `assets/app/`, o `dist` saía
com 3,9 MB de imagem: os 407 kB efetivamente usados mais 3,4 MB de originais que
nenhuma tela chega a pedir.

## Versões em uso

| Original (aqui)           | Em uso (`assets/app/`)      | Redução           |
|---------------------------|-----------------------------|-------------------|
| `sobre01-panel-img.jpg`   | `sobre01-panel-img.webp`    | 1,48 MB → 230 kB  |
| `sobre02-panel2-img.jpg`  | `sobre02-panel2-img.webp`   | 1,98 MB → 177 kB  |

`sobre01` é a bandeira, no card da seção "Quem somos" (retrato, 1200×1800).
`sobre02` é a arara, fundo do hero (paisagem, 1920×1280).

## Ao trocar uma arte

Solte o novo arquivo direto em `assets/app/` com o prefixo esperado
(`sobre01`, `sobre02`, …) — nenhum import muda. O resolvedor prefere
`.avif` > `.webp` > `.jpeg`/`.jpg` > `.png`, então uma versão otimizada ao lado
de um JPEG de mesmo prefixo sempre vence. Só lembre de mover o original pesado
para cá depois, senão ele volta para o bundle.
