/**
 * Indicators.tsx — barrel (fachada pública) da biblioteca de indicadores.
 *
 * Este arquivo NÃO contém código — apenas re-exporta tudo que vive nos
 * módulos especializados em parts/, helpers.ts e constants/indicators/.
 *
 * Páginas continuam importando exatamente como antes:
 *   import { IndicatorCard, ChartPanel, fmtPct, computeMetrics }
 *     from '../../../components/indicators/Indicators';
 *
 * Vantagens do padrão barrel:
 *  - API pública estável (mudanças internas não afetam consumidores)
 *  - Tree-shaking eficiente (só o que é importado é incluído no bundle)
 *  - Manutenção: cada arquivo tem 1 responsabilidade, 50–250 linhas
 */

// Barrels agregam exports de naturezas diferentes (componentes + helpers +
// constantes), o que é legítimo. A regra react-refresh/only-export-components
// existe para arquivos comuns, não para fachadas — desabilitada neste arquivo.
/* eslint-disable react-refresh/only-export-components */

// ─── Components ─────────────────────────────────────────────────────────────
export * from './parts/Atoms';
export * from './parts/IndicatorCard';
export * from './parts/QuickNav';
export * from './parts/ChartPanel';
export * from './parts/ChartGridPanel';
export * from './parts/RecentClosingsTable';
export * from './parts/PeriodExplorer';
export * from './parts/EducationalInsightsPanel';
export * from './parts/AggregatedTotalPanel';

// ─── Helpers (funções puras de processamento de séries IPEA) ────────────────
export * from './Helpers';

// ─── Constants ──────────────────────────────────────────────────────────────
export * from '../../constants/indicators/Motion';
export * from '../../constants/indicators/TimeWindows';
export * from '../../constants/indicators/Formatters';
