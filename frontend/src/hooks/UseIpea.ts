import { useQuery } from '@tanstack/react-query';
import { ipeaService } from '../api/services/Ipea';
import { HISTORICAL, DAILY } from '../constants/queryTimes';


// ==========================================
// HOOKS: ECONOMIA GERAL
// ==========================================
export function useMacro() {
  return useQuery({
    queryKey: ['ipea', 'macro'],
    queryFn: ipeaService.getMacro,
    ...HISTORICAL,
  });
}

export function useEmprego() {
  return useQuery({
    queryKey: ['ipea', 'emprego'],
    queryFn: ipeaService.getEmprego,
    ...HISTORICAL,
  });
}

export function useRenda() {
  return useQuery({
    queryKey: ['ipea', 'renda'],
    queryFn: ipeaService.getRenda,
    ...HISTORICAL,
  });
}

export function useDesigualdade() {
  return useQuery({
    queryKey: ['ipea', 'desigualdade'],
    queryFn: ipeaService.getDesigualdadePobreza,
    ...HISTORICAL,
  });
}

export function usePrecos() {
  return useQuery({
    queryKey: ['ipea', 'precos'],
    queryFn: ipeaService.getPrecos,
    ...HISTORICAL,
  });
}

export function usePopulacao() {
  return useQuery({
    queryKey: ['ipea', 'populacao'],
    queryFn: ipeaService.getPopulacao,
    ...HISTORICAL,
  });
}

export function useIbovespa() {
  return useQuery({
    queryKey: ['ipea', 'mercado', 'ibovespa'],
    queryFn: ipeaService.getIbovespaClosing,
    ...DAILY
  })
}



// ==========================================
// HOOKS: BALANÇA DE PAGAMENTOS
// ==========================================

export function useAtivosReservas() {
  return useQuery({
    queryKey: ['ipea', 'balanca', 'ativos-reservas'],
    queryFn: ipeaService.getAtivosReservas,
    ...HISTORICAL,
  });
}

export function useTransacoesCorrentes() {
  return useQuery({
    queryKey: ['ipea', 'balanca', 'transacoes-correntes'],
    queryFn: ipeaService.getTransacoesCorrentes,
    ...HISTORICAL,
  });
}

export function useBalancaComercial() {
  return useQuery({
    queryKey: ['ipea', 'balanca', 'comercial'],
    queryFn: ipeaService.getBalancaComercial,
    ...HISTORICAL,
  });
}

export function useServicosBalanca() {
  return useQuery({
    queryKey: ['ipea', 'balanca', 'servicos'],
    queryFn: ipeaService.getServicosBalanca,
    ...HISTORICAL,
  });
}

export function useRendaPrimaria() {
  return useQuery({
    queryKey: ['ipea', 'balanca', 'renda-primaria'],
    queryFn: ipeaService.getRendaPrimaria,
    ...HISTORICAL,
  });
}

export function useInvestimentoDireto() {
  return useQuery({
    queryKey: ['ipea', 'balanca', 'investimento-direto'],
    queryFn: ipeaService.getInvestimentoDireto,
    ...HISTORICAL,
  });
}

export function useContaCapital() {
  return useQuery({
    queryKey: ['ipea', 'balanca', 'conta-capital'],
    queryFn: ipeaService.getContaCapital,
    ...HISTORICAL,
  });
}

export function useContaFinanceira() {
  return useQuery({
    queryKey: ['ipea', 'balanca', 'conta-financeira'],
    queryFn: ipeaService.getContaFinanceira,
    ...HISTORICAL,
  });
}

export function useInvestimentoCarteira() {
  return useQuery({
    queryKey: ['ipea', 'balanca', 'investimento-carteira'],
    queryFn: ipeaService.getInvestimentoCarteira,
    ...HISTORICAL,
  });
}

export function useServicosDespesas() {
  return useQuery({
    queryKey: ['ipea', 'balanca', 'servicos-despesas'],
    queryFn: ipeaService.getServicosDespesas,
    ...HISTORICAL,
  });
}

export function useInvestimentoDiretoIngressos() {
  return useQuery({
    queryKey: ['ipea', 'balanca', 'investimento-direto-ingressos'],
    queryFn: ipeaService.getInvestimentoDiretoIngressos,
    ...HISTORICAL,
  });
}


export function useTransacoesCorrentesPib() {
  return useQuery({
    queryKey: ['ipea', 'balanca', 'transacoes-correntes'],
    queryFn: ipeaService.getTransacoesCorrentes,
    ...HISTORICAL,
  });
}




// ==========================================
// HOOKS: EXPORTAÇÕES
// ==========================================

export function useTotalExports() {
  return useQuery({
    queryKey: ['ipea', 'exportacoes', 'total'],
    queryFn: ipeaService.getTotalExports,
    ...HISTORICAL,
  });
}

export function useExportQuantumIndex() {
  return useQuery({
    queryKey: ['ipea', 'exportacoes', 'quantum'],
    queryFn: ipeaService.getExportQuantumIndex,
    ...HISTORICAL,
  });
}

export function useBasicProductsExports() {
  return useQuery({
    queryKey: ['ipea', 'exportacoes', 'produtos-basicos'],
    queryFn: ipeaService.getBasicProductsExports,
    ...HISTORICAL,
  });
}

export function useAgricultureLivestockQuantumExports() {
  return useQuery({
    queryKey: ['ipea', 'exportacoes', 'quantum-agricultura-pecuaria'],
    queryFn: ipeaService.getAgricultureLivestockQuantumExports,
    ...HISTORICAL,
  });
}

export function useConsumerGoodsExports() {
  return useQuery({
    queryKey: ['ipea', 'exportacoes', 'bens-consumo'],
    queryFn: ipeaService.getConsumerGoodsExports,
    ...HISTORICAL,
  });
}

export function useCapitalGoodsPriceIndex() {
  return useQuery({
    queryKey: ['ipea', 'exportacoes', 'precos-bens-capital'],
    queryFn: ipeaService.getCapitalGoodsPriceIndex,
    ...HISTORICAL,
  });
}

export function useDurableConsumerGoodsPriceIndex() {
  return useQuery({
    queryKey: ['ipea', 'exportacoes', 'precos-bens-duraveis'],
    queryFn: ipeaService.getDurableConsumerGoodsPriceIndex,
    ...HISTORICAL,
  });
}

export function useNonDurableConsumerGoodsPriceIndex() {
  return useQuery({
    queryKey: ['ipea', 'exportacoes', 'precos-bens-nao-duraveis'],
    queryFn: ipeaService.getNonDurableConsumerGoodsPriceIndex,
    ...HISTORICAL,
  });
}

export function useIntermediateGoodsFobValue() {
  return useQuery({
    queryKey: ['ipea', 'exportacoes', 'valor-bens-intermediarios'],
    queryFn: ipeaService.getIntermediateGoodsFobValue,
    ...HISTORICAL,
  });
}

export function useIntermediateGoodsQuantumIndex() {
  return useQuery({
    queryKey: ['ipea', 'exportacoes', 'quantum-bens-intermediarios'],
    queryFn: ipeaService.getIntermediateGoodsQuantumIndex,
    ...HISTORICAL,
  });
}

export function useFuelsFobValue() {
  return useQuery({
    queryKey: ['ipea', 'exportacoes', 'valor-combustiveis'],
    queryFn: ipeaService.getFuelsFobValue,
    ...HISTORICAL,
  });
}




// ==========================================
// HOOKS: IMPOSTOS
// ==========================================

export function useImportTax() {
  return useQuery({
    queryKey: ['ipea', 'impostos', 'importacao'],
    queryFn: ipeaService.getImportTax,
    ...HISTORICAL,
  });
}

export function usePersonalIncomeTax() {
  return useQuery({
    queryKey: ['ipea', 'impostos', 'irpf'],
    queryFn: ipeaService.getPersonalIncomeTax,
    ...HISTORICAL,
  });
}

export function useCorporateIncomeTax() {
  return useQuery({
    queryKey: ['ipea', 'impostos', 'irpj'],
    queryFn: ipeaService.getCorporateIncomeTax,
    ...HISTORICAL,
  });
}

export function useTotalIncomeTax() {
  return useQuery({
    queryKey: ['ipea', 'impostos', 'ir-total'],
    queryFn: ipeaService.getTotalIncomeTax,
    ...HISTORICAL,
  });
}

export function useIofTax() {
  return useQuery({
    queryKey: ['ipea', 'impostos', 'iof'],
    queryFn: ipeaService.getIofTax,
    ...HISTORICAL,
  });
}

export function useIpiTax() {
  return useQuery({
    queryKey: ['ipea', 'impostos', 'ipi'],
    queryFn: ipeaService.getIpiTax,
    ...HISTORICAL,
  });
}




// ==========================================
// HOOKS: CÂMBIO CONTRATADO
// ==========================================

export function useContractedExchangeCommercial() {
  return useQuery({
    queryKey: ['ipea', 'cambio', 'comercial'],
    queryFn: ipeaService.getContractedExchangeCommercial,
    ...HISTORICAL,
  });
}

export function useContractedExchangeCommercialExports() {
  return useQuery({
    queryKey: ['ipea', 'cambio', 'comercial', 'exportacao'],
    queryFn: ipeaService.getContractedExchangeCommercialExports,
    ...HISTORICAL,
  });
}

export function useContractedExchangeCommercialImports() {
  return useQuery({
    queryKey: ['ipea', 'cambio', 'comercial', 'importacao'],
    queryFn: ipeaService.getContractedExchangeCommercialImports,
    ...HISTORICAL,
  });
}

export function useContractedExchangeTotal() {
  return useQuery({
    queryKey: ['ipea', 'cambio', 'comercial-financeiro'],
    queryFn: ipeaService.getContractedExchangeTotal,
    ...HISTORICAL,
  });
}

export function useContractedExchangeFinancial() {
  return useQuery({
    queryKey: ['ipea', 'cambio', 'financeiro'],
    queryFn: ipeaService.getContractedExchangeFinancial,
    ...HISTORICAL,
  });
}

export function useContractedExchangeFinancialPurchases() {
  return useQuery({
    queryKey: ['ipea', 'cambio', 'financeiro', 'compra'],
    queryFn: ipeaService.getContractedExchangeFinancialPurchases,
    ...HISTORICAL,
  });
}

export function useContractedExchangeFinancialSales() {
  return useQuery({
    queryKey: ['ipea', 'cambio', 'financeiro', 'venda'],
    queryFn: ipeaService.getContractedExchangeFinancialSales,
    ...HISTORICAL,
  });
}

//Pib
export function useMonthlyPib() {
  return useQuery({
    queryKey: ['ipea', 'pib', 'mensal'],
    queryFn: ipeaService.getMonthlyPib,
    ...HISTORICAL,
  });
}




