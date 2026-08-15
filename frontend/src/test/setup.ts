// Carregado pelo Vitest antes de cada arquivo de teste (ver vite.config.ts).
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Sem `globals: true`, o React Testing Library não registra a limpeza sozinho.
// Sem isso, componentes de um teste permaneceriam montados no seguinte.
afterEach(() => {
  cleanup();
});

// O jsdom não implementa scrollIntoView — a propriedade simplesmente não existe
// no protótipo. Qualquer componente que mantenha um item visível numa lista com
// rolagem interna (SelectField) estoura com "is not a function" no teste, mesmo
// funcionando em todo navegador. O stub existe para o ambiente, não para o
// componente: nada aqui deve ser afirmado pelos testes.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}