# Imagens de documentação

Prints e artes que aparecem no README. **Nada aqui é empacotado nem publicado** —
a Vercel serve `frontend/dist`, e esta pasta está fora de `frontend/`.

É de propósito, e é a diferença entre os três lugares onde imagem pode morar:

| pasta | destino | quando usar |
| --- | --- | --- |
| `docs/img/` | só o GitHub | print, diagrama, arte de README |
| `frontend/src/assets/` | vai pro bundle, com hash | arte que a interface renderiza |
| `frontend/public/` | vai pro site, sem hash | favicon, `og-capa.png`, `robots.txt` |

Print de tela em `src/assets/` seria peso morto no bundle de todo visitante. Em
`public/` ficaria acessível em `brasilpanel.com.br/print.png`, o que não faz mal
mas tampouco faz sentido.

## Os arquivos

### Prints

    painel-desktop.png    1600 x 1000   dashboard, a peça principal
    desktop-grafico.png   1600 x 1000   série histórica com ECharts
    painel-tablet.png      820 x 1180   mesma rota, em retrato
    painel-mobile.jpg      390 x 844    mesma rota, no celular
    login-mobile.png       390 x 844    tela de entrada
    sobre-mobile.png       390 x 844    landing institucional

O padrão é `<assunto>-<viewport>.<ext>`.

### Diagrama

    arquitetura.png        1400 x 560   IMG-5 — o desenho da arquitetura
    arquitetura.fonte.html      —       o HTML que gera a imagem

O diagrama não é print: é uma página HTML renderizada em Chromium headless a 2x.
A fonte fica versionada ao lado da imagem justamente para que um número mudado no
projeto (rotas, classes, fontes) possa ser corrigido no HTML e re-renderizado, em
vez de exigir refazer a arte do zero:

    node -e "…" # ou o mesmo Playwright usado para og-capa.png
    # viewport 1400x560, deviceScaleFactor 2, screenshot de arquitetura.fonte.html

Se o acabamento for refeito no Figma, o PNG passa a ser o produto e o HTML vira
só o rascunho de origem — vale manter os dois assim mesmo.

Os três do painel precisam ser a MESMA rota. É o que transforma três prints
soltos numa prova de responsividade — a sugestão é
`/dashboard/economia/impostos`, que traz gráfico, números e a barra de
participação no mesmo quadro.

Os dois de celular restantes mostram alcance, não responsividade: a entrada e a
landing. Aí a rota é outra de propósito.

## Ao capturar

- Espere o backend acordar. O plano gratuito do Render hiberna após ~15 min, e o
  primeiro acesso leva cerca de 150 s. Print com "erro ao carregar" na vitrine é
  pior que vitrine nenhuma.
- Mesma rota nos três aparelhos.
- Sem barra do navegador, sem aba, sem favorito — só o conteúdo.
- PNG. JPEG borra texto pequeno e o painel é feito de número miúdo.
