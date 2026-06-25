/**
 * QuickNav.tsx — barra de navegação rápida entre seções.
 *
 * Comportamento:
 *  - Sticky no topo (top-3) com blur, fica visível durante o scroll
 *  - Pills coloridas por seção (cor vem de cada NavItem)
 *  - Seção ativa destacada via IntersectionObserver (faixa central do viewport)
 *  - Click → scroll suave + atualiza URL com #id sem jump nativo
 *
 * Responsivo:
 *  - Mobile: chip bar horizontal rolável (overflow-x-auto)
 *  - Desktop: pills centralizadas com wrap
 */

import { memo, useMemo, useState, useEffect, type MouseEvent } from 'react';
import { motion } from 'motion/react';
import { itemVariants } from '../../../constants/indicators/Motion';

export interface NavItem {
  id: string;
  label: string;
  color: string;
}

/**
 * Hook interno: rastreia qual seção está na faixa central do viewport.
 *
 * Usa um IntersectionObserver por seção (em vez de um só com múltiplos alvos)
 * para isolar o callback e simplificar o bookkeeping de ratios.
 */
function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState<string>(ids[0] ?? '');

  // Recria observers quando a lista de ids muda.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deps = ids.join('|');

  useEffect(() => {
    const visible = new Map<string, number>();
    const observers: IntersectionObserver[] = [];

    const pick = () => {
      let best: string | null = null;
      let bestRatio = 0;
      for (const [id, ratio] of visible) {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = id;
        }
      }
      if (best) setActive(best);
    };

    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      const obs = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            visible.set(id, e.isIntersecting ? e.intersectionRatio : 0);
          }
          pick();
        },
        {
          // Enxuga o viewport para a faixa central (15% topo → 55% rodapé).
          // Assim a seção "ativa" é a que está realmente no centro da tela.
          threshold: [0.05, 0.15, 0.3, 0.5, 0.75],
          rootMargin: '-15% 0px -55% 0px',
        },
      );
      obs.observe(el);
      observers.push(obs);
    }

    return () => observers.forEach((o) => o.disconnect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps]);

  return active;
}

export const QuickNav = memo(function QuickNav({ items }: { items: NavItem[] }) {
  const ids = useMemo(() => items.map((i) => i.id), [items]);
  const active = useActiveSection(ids);

  const handleClick = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Atualiza URL sem causar jump nativo — histórico limpo.
      history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <motion.nav
      variants={itemVariants}
      aria-label="Navegação rápida entre indicadores"
      className="sticky top-3 z-30"
    >
      <div
        className="flex gap-1.5 overflow-x-auto pb-1
                   sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0
                   rounded-2xl border border-white/10 bg-slate-950/80 p-2 backdrop-blur-md
                   shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]"
      >
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={handleClick(item.id)}
              aria-current={isActive ? 'true' : undefined}
              className="group flex shrink-0 items-center gap-1.5 whitespace-nowrap
                         rounded-lg px-2.5 py-1.5 text-xs font-medium
                         transition-all duration-200 focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-white/40"
              style={{
                background: isActive ? `${item.color}1f` : 'transparent',
                color: isActive ? item.color : '#94a3b8',
                boxShadow: isActive ? `inset 0 0 0 1px ${item.color}40` : 'none',
              }}
              onMouseEnter={(e) => {
                if (isActive) return;
                e.currentTarget.style.backgroundColor = `${item.color}14`;
                e.currentTarget.style.color = item.color;
              }}
              onMouseLeave={(e) => {
                if (isActive) return;
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full transition-all duration-200"
                style={{
                  background: item.color,
                  opacity: isActive ? 1 : 0.55,
                  boxShadow: isActive ? `0 0 8px ${item.color}` : 'none',
                }}
              />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </motion.nav>
  );
});
