import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      // Acessibilidade como regra de lint, e não como revisão manual.
      //
      // Entrou depois de uma auditoria que encontrou o painel em bom estado —
      // zero violação crítica ou séria no axe. O plugin existe para MANTER esse
      // estado: sem trava, a próxima tela desfaz em silêncio. Foi assim que
      // `text-slate-500` chegou a 132 usos abaixo do contraste mínimo.
      //
      // O conjunto `recommended` cobre o que dá para decidir olhando o JSX:
      // alt ausente, <div onClick> sem papel, label órfão, autoFocus, âncora
      // sem href. Contraste, ordem de foco e anúncio de rota ele NÃO vê — para
      // esses continua valendo o axe no navegador, que é o passo 2 do
      // checklist de release.
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
