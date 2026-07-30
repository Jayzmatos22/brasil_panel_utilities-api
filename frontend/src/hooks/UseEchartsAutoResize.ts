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
}

/** Forma mínima de um componente echarts-for-react (default ou /esm/core). */
export interface EchartsHandle {
  getEchartsInstance: () => EchartsInstance;
}

export function useEchartsAutoResize<T extends EchartsHandle>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const instance = ref.current?.getEchartsInstance();
    const dom = instance?.getDom();
    if (!instance || !dom) return;

    // O resize é agendado num rAF em vez de chamado direto no callback:
    // redesenhar dentro da notificação do observer altera o layout e reentra no
    // próprio observer, o que o navegador reporta como "ResizeObserver loop
    // completed with undelivered notifications".
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => instance.resize());
    });

    observer.observe(dom);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}