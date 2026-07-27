// Carregado pelo Vitest antes de cada arquivo de teste (ver vite.config.ts).
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Sem `globals: true`, o React Testing Library não registra a limpeza sozinho.
// Sem isso, componentes de um teste permaneceriam montados no seguinte.
afterEach(() => {
  cleanup();
});