import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

/**
 * Combobox de seleção única — substitui o `<select>` nativo.
 *
 * Por que não é um `<select>`: o `<option>` é desenhado pelo user agent e não
 * aceita CSS. No mobile a lista abria com a largura do texto mais longo, e não
 * a do gatilho, estourando o card e o viewport; e vinha com o azul/branco do
 * sistema, ignorando o tema escuro. Não há truque de CSS no `<select>` que
 * conserte isso — a caixa de opções nem sequer é do documento.
 *
 * Segue o padrão ARIA APG "Select-Only Combobox". O detalhe que mais surpreende
 * é que o foco do DOM NUNCA sai do gatilho: a opção corrente é anunciada por
 * `aria-activedescendant`, e não por foco real. É o que torna o retorno do foco
 * ao fechar trivialmente correto — ele nunca saiu — e o que permite tratar todo
 * o teclado num único `onKeyDown`.
 *
 * O painel é irmão do gatilho dentro de um wrapper `relative`, com
 * `left-0 right-0`: a largura é a do gatilho por construção, não por medição.
 * Só a altura precisa de JS (ver o useLayoutEffect de posicionamento).
 *
 * ATENÇÃO a quem for usar: o painel é `absolute`, então nenhum ancestral pode
 * ter `overflow-hidden`, ou a lista é decepada. Use `overflow-clip` só onde
 * houver de fato transbordo horizontal a conter.
 */

export interface SelectOption {
  id: number;
  name: string;
}

interface SelectFieldProps {
  /** Id do gatilho. Os ids da lista e das opções são derivados de useId. */
  id: string;
  label: string;
  /** Id da opção escolhida, como string. '' = nada escolhido. */
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Texto da opção vazia — é uma opção de verdade, para dar como desfazer. */
  placeholder: string;
  disabled?: boolean;
}

/** Teto do painel. O valor efetivo é o menor entre isto e o espaço disponível. */
const PANEL_MAX_PX = 288;
/** Respiro entre o painel e a borda do viewport. */
const VIEWPORT_GAP_PX = 16;
/** Piso do painel: abaixo disto não cabe nem uma linha e meia. */
const PANEL_MIN_PX = 120;
/** Janela do typeahead. 500ms é o valor usado nos exemplos do APG. */
const TYPEAHEAD_MS = 500;

interface Item {
  value: string;
  label: string;
}

interface Placement {
  up: boolean;
  maxHeight: number;
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: SelectFieldProps) {
  const reactId = useId();
  const labelId = `${reactId}-label`;
  const listId = `${reactId}-list`;
  const optionId = (index: number) => `${reactId}-opt-${index}`;

  // O placeholder entra como item real, e não como texto solto do gatilho: sem
  // ele não haveria como voltar a "nada escolhido" depois de escolher algo — o
  // `<select>` nativo tinha essa saída, e perdê-la seria uma regressão.
  const items: Item[] = [
    { value: '', label: placeholder },
    ...options.map((o) => ({ value: String(o.id), label: o.name })),
  ];

  const selectedIndex = items.findIndex((it) => it.value === value);
  const currentLabel = items[selectedIndex]?.label ?? placeholder;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState<Placement>({
    up: false,
    maxHeight: PANEL_MAX_PX,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ buffer: '', timer: 0 });

  const closeList = useCallback(() => {
    setOpen(false);
    typeahead.current.buffer = '';
  }, []);

  const openList = useCallback((index: number) => {
    setActiveIndex(Math.max(0, index));
    setOpen(true);
  }, []);

  const commit = (index: number) => {
    const item = items[index];
    if (item) onChange(item.value);
    closeList();
  };

  // ── Posicionamento ────────────────────────────────────────────────────────
  // A largura sai de graça (`left-0 right-0` sobre o wrapper). O que precisa de
  // medida é a altura: sem espaço embaixo o painel vira para cima, e em
  // qualquer direção ele fica limitado ao espaço real — assim nunca ultrapassa
  // o viewport nem empurra a rolagem da página; a lista longa rola por dentro.
  useLayoutEffect(() => {
    if (!open) return;

    const measure = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const below = window.innerHeight - rect.bottom - VIEWPORT_GAP_PX;
      const above = rect.top - VIEWPORT_GAP_PX;
      const up = below < PANEL_MAX_PX && above > below;
      const espaco = up ? above : below;

      setPlacement({
        up,
        maxHeight: Math.max(PANEL_MIN_PX, Math.min(PANEL_MAX_PX, espaco)),
      });
    };

    measure();
    window.addEventListener('resize', measure);
    // Captura: a rolagem que importa pode acontecer em qualquer ancestral com
    // overflow, e evento de scroll de elemento não sobe por bubbling.
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open]);

  // Mantém a opção ativa visível quando o teclado a move para fora da janela
  // de rolagem interna do painel.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLLIElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  // Clique fora fecha. `pointerdown`, e não `click`, para fechar antes que o
  // alvo de fora receba o próprio clique — senão o primeiro toque só fecharia.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) closeList();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, closeList]);

  useEffect(() => () => window.clearTimeout(typeahead.current.timer), []);

  // ── Busca por digitação ───────────────────────────────────────────────────
  const findByTyping = (char: string): number => {
    window.clearTimeout(typeahead.current.timer);
    const buffer = typeahead.current.buffer + char.toLowerCase();
    typeahead.current.buffer = buffer;
    typeahead.current.timer = window.setTimeout(() => {
      typeahead.current.buffer = '';
    }, TYPEAHEAD_MS);

    // Com uma letra só, procura a PRÓXIMA que começa com ela — é o que faz
    // teclar "c" repetido percorrer os "C". Com o buffer maior, a busca inclui
    // o item ativo, senão refinar o texto pularia o próprio item já casado.
    const start = buffer.length === 1 ? activeIndex + 1 : activeIndex;
    for (let k = 0; k < items.length; k++) {
      const i = (start + k) % items.length;
      if (items[i].label.toLowerCase().startsWith(buffer)) return i;
    }
    return -1;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const last = items.length - 1;
    const base = selectedIndex >= 0 ? selectedIndex : 0;
    const isPrintable =
      e.key.length === 1 && !e.altKey && !e.ctrlKey && !e.metaKey;

    if (!open) {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp':
        case 'Enter':
        case ' ':
          e.preventDefault();
          openList(base);
          return;
        case 'Home':
          e.preventDefault();
          openList(0);
          return;
        case 'End':
          e.preventDefault();
          openList(last);
          return;
        default:
          if (isPrintable) {
            e.preventDefault();
            const found = findByTyping(e.key);
            openList(found === -1 ? base : found);
          }
          return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(last, i + 1));
        return;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        return;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        return;
      case 'End':
        e.preventDefault();
        setActiveIndex(last);
        return;
      case 'Enter':
      case ' ':
        e.preventDefault();
        commit(activeIndex);
        return;
      case 'Escape':
        e.preventDefault();
        closeList();
        return;
      case 'Tab':
        // Sem preventDefault: o APG manda confirmar a opção ativa E deixar o
        // foco seguir para o próximo campo. Interceptar prenderia o usuário.
        commit(activeIndex);
        return;
      default:
        if (isPrintable) {
          e.preventDefault();
          const found = findByTyping(e.key);
          if (found !== -1) setActiveIndex(found);
        }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* <span>, e não <label>: `for` não vincula a um <button>. O nome
          acessível vem do `aria-labelledby` do gatilho, que junta este rótulo
          ao valor corrente — o mesmo que o APG faz. */}
      <span id={labelId} className="text-slate-300 text-sm font-medium">
        {label}
      </span>

      <div ref={wrapperRef} className="relative">
        <button
          id={id}
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={`${labelId} ${id}`}
          aria-activedescendant={open ? optionId(activeIndex) : undefined}
          disabled={disabled}
          onClick={() =>
            open ? closeList() : openList(selectedIndex >= 0 ? selectedIndex : 0)
          }
          onKeyDown={handleKeyDown}
          className="flex h-12 w-full cursor-pointer items-center justify-between gap-3
                     rounded-control border border-slate-700 bg-slate-800 px-4
                     text-left text-sm text-white outline-none transition-all
                     focus-visible:border-amber-500 focus-visible:ring-1 focus-visible:ring-amber-500/30
                     aria-expanded:border-amber-500
                     disabled:cursor-not-allowed disabled:opacity-50"
        >
          {/* slate-400 e não slate-500: sobre bg-slate-800 o 500 dá 2,7:1 e
              reprova o AA; o 400 dá 4,9:1. */}
          <span className={`truncate ${value ? 'text-white' : 'text-slate-400'}`}>
            {currentLabel}
          </span>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            aria-labelledby={labelId}
            tabIndex={-1}
            style={{ maxHeight: placement.maxHeight }}
            className={`scrollbar-thin absolute left-0 right-0 z-30 overflow-y-auto overscroll-contain
                        rounded-control border border-hairline-strong bg-slate-900 py-1 shadow-panel
                        ${placement.up ? 'bottom-full mb-1' : 'top-full mt-1'}`}
          >
            {items.map((item, i) => {
              const isSelected = item.value === value;
              const isActive = i === activeIndex;
              return (
                <li
                  key={item.value || '__placeholder'}
                  id={optionId(i)}
                  role="option"
                  aria-selected={isSelected}
                  data-active={isActive}
                  onMouseMove={() => setActiveIndex(i)}
                  onClick={() => {
                    commit(i);
                    triggerRef.current?.focus();
                  }}
                  className={`flex min-h-10 cursor-pointer items-center justify-between gap-3
                              px-4 py-2 text-sm coarse:min-h-11
                              ${isActive ? 'bg-amber-500/15 text-white' : 'text-slate-300'}`}
                >
                  <span className={item.value ? '' : 'text-slate-400'}>
                    {item.label}
                  </span>
                  {isSelected && item.value !== '' && (
                    <Check size={16} aria-hidden="true" className="shrink-0 text-amber-400" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
