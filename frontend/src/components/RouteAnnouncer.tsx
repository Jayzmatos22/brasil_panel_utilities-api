/**
 * RouteAnnouncer — conta ao leitor de tela que a página mudou.
 *
 * Num SPA a navegação não recarrega o documento: o React troca a árvore e
 * pronto. Para quem enxerga, a tela muda e o assunto se encerra — e é
 * exatamente por isso que este buraco passa despercebido em quase todo SPA.
 * Para quem usa leitor de tela não acontece nada: nenhum anúncio de nova
 * página, e o foco continua onde estava, muitas vezes num link do menu que
 * agora pertence a outra tela.
 *
 * São dois remédios para dois problemas diferentes, e por isso os dois existem:
 *
 *   1. FOCO no <h1> da rota nova (WCAG 2.2 AA, 2.4.3 Ordem de Foco). Recoloca
 *      o ponto de leitura no início do conteúdo. `tabindex="-1"` torna o <h1>
 *      focável por script sem entrar na ordem de Tab, e `preventScroll` evita
 *      que o navegador role a página por conta própria — o React Router já
 *      cuida da rolagem.
 *
 *   2. REGIÃO aria-live com o nome da página. O foco programático nem sempre é
 *      anunciado — depende do leitor e do navegador. A região viva garante o
 *      anúncio de qualquer forma.
 *
 * A primeira renderização é pulada de propósito: ali o documento acabou de
 * carregar e o leitor de tela já anuncia o título sozinho. Anunciar de novo
 * seria repetição.
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteAnnouncer() {
  const { pathname } = useLocation();
  const [rotulo, setRotulo] = useState('');
  const primeiraRota = useRef(true);

  useEffect(() => {
    if (primeiraRota.current) {
      primeiraRota.current = false;
      return;
    }

    // rAF duplo: o primeiro quadro ainda pode ser o da rota ANTERIOR, porque o
    // conteúdo vem de React.lazy e monta depois do commit da rota. Ler o <h1>
    // cedo demais anunciaria o título da tela que se acabou de deixar.
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        const h1 = document.querySelector('h1');
        setRotulo(h1?.textContent?.trim() || document.title);
        if (h1) {
          h1.setAttribute('tabindex', '-1');
          h1.focus({ preventScroll: true });
        }
      });
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, [pathname]);

  return (
    // `polite` e não `assertive`: trocar de página é resultado de uma ação da
    // própria pessoa, não uma emergência que justifique interromper a fala em
    // curso. O role="status" cobre leitores que ignoram aria-live solto.
    <p role="status" aria-live="polite" className="sr-only">
      {rotulo}
    </p>
  );
}
