/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    // jsdom fornece document/window para os testes de componente.
    environment: 'jsdom',
    // globals fica desligado de propósito: cada teste importa describe/it/expect
    // do vitest explicitamente, o que evita ter de declarar tipos globais no
    // tsconfig — e o `tsc -b` do build continua checando os arquivos de teste.
    globals: false,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
})