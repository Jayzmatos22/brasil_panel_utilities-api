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

## Convenção de nome

    <assunto>-<viewport>.png

    painel-mobile.png     390 x 844
    painel-tablet.png     820 x 1180
    painel-desktop.png   1600 x 1000

Viewport no nome porque o README mostra os três lado a lado, e a comparação só
é honesta se for a MESMA página nos três.

## Ao capturar

- Espere o backend acordar. O plano gratuito do Render hiberna após ~15 min, e o
  primeiro acesso leva cerca de 150 s. Print com "erro ao carregar" na vitrine é
  pior que vitrine nenhuma.
- Mesma rota nos três aparelhos.
- Sem barra do navegador, sem aba, sem favorito — só o conteúdo.
- PNG. JPEG borra texto pequeno e o painel é feito de número miúdo.
