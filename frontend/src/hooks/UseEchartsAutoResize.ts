import { useEffect, useRef } from 'react';

/**
 * Mantém um gráfico ECharts com a largura correta quando o CONTAINER muda de
 * tamanho — não a janela.
 *
 * Por que existe: `echarts-for-react` só escuta `window.resize`. Abrir ou
 * fechar a sidebar do dashboard tira (ou devolve) 280px da área de conteúdo
 * sem redimensionar a janela, então nenhum evento dispara e o canvas fica com
 * a largura antiga — cortado ou sobrando. O mesmo vale para qualquer mudança
 * de layout que não passe pelo viewport: um painel que colapsa, um grid que
 * troca de número de colunas.
 *
 * Usa ResizeObserver nativo — sem dependência nova.
 *
 * @example
 *   const chartRef = useEchartsAutoResize<ReactECharts>();
 *   return <ReactECharts ref={chartRef} option={option} />;
 */

/** Subconjunto da instância ECharts que este hook realmente usa. */
interface EchartsInstance {
  getDom: () => HTMLElement | undefined;
  resize: () => void;
  isDisposed?: () => boolean;
}

/** Forma mínima de um componente echarts-for-react (default ou /esm/core). */
export interface EchartsHandle {
  getEchartsInstance: () => EchartsInstance;
}

export function useEchartsAutoResize<T extends EchartsHandle>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    // A instância é resolvida a cada callback, NUNCA guardada em closure.
    //
    // `echarts-for-react` descarta e recria a instância quando as props mudam,
    // sem desmontar o componente React. Uma instância capturada no mount vira
    // uma referência morta assim que os dados trocam — e o cleanup deste efeito
    // não salva, porque ele só roda no unmount, que nesse caso não acontece.
    // Chamar resize() numa instância descartada faz o ECharts avisar
    // "Instance ... has been disposed" e pode derrubar o render.
    //
    // O <div> container, esse sim, é estável entre as recriações: é ele que
    // observamos.
    const dom = ref.current?.getEchartsInstance()?.getDom();
    if (!dom) return;

    // O resize é agendado num rAF em vez de chamado direto no callback:
    // redesenhar dentro da notificação do observer altera o layout e reentra no
    // próprio observer, o que o navegador reporta como "ResizeObserver loop
    // completed with undelivered notifications".
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const atual = ref.current?.getEchartsInstance();
        if (!atual || atual.isDisposed?.()) return;
        atual.resize();
      });
    });

    observer.observe(dom);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}