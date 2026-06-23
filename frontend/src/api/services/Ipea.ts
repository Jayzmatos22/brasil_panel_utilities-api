import { apiClient } from '../client/Client';
import type { IpeaSerie } from '../../types/IpeaType';

export const ipeaService = {

   // ==========================================
  // ECONOMIA EM GERAL
  // ==========================================
  getMacro: () =>
    apiClient.get<IpeaSerie[]>('/ipea/macro').then((res) => res.data),

  getEmprego: () =>
    apiClient.get<IpeaSerie[]>('/ipea/emprego').then((res) => res.data),

  getRenda: () =>
    apiClient.get<IpeaSerie[]>('/ipea/renda').then((res) => res.data),

  getDesigualdadePobreza: () =>
    apiClient.get<IpeaSerie[]>('/ipea/desigualdade').then((res) => res.data),

  getPrecos: () =>
    apiClient.get<IpeaSerie[]>('/ipea/precos').then((res) => res.data),


  getPopulacao: () =>
    apiClient.get<IpeaSerie[]>('/ipea/populacao').then((res) => res.data),

  getIbovespaClosing: () =>
    apiClient.get<IpeaSerie[]>('/ipea/mercado/ibovespa').then((res) => res.data),


  

  // ==========================================
  // BALANÇA DE PAGAMENTOS
  // ==========================================
  getAtivosReservas: () =>
    apiClient.get<IpeaSerie[]>('/ipea/balanca/ativos-reservas').then((res) => res.data),

  getTransacoesCorrentes: () =>
    apiClient.get<IpeaSerie[]>('/ipea/balanca/transacoes-correntes').then((res) => res.data),

  getBalancaComercial: () =>
    apiClient.get<IpeaSerie[]>('/ipea/balanca/comercial').then((res) => res.data),

  getServicosBalanca: () => 
    apiClient.get<IpeaSerie[]>('/ipea/balanca/servicos').then((res) => res.data),

  getRendaPrimaria: () =>
    apiClient.get<IpeaSerie[]>('/ipea/balanca/renda-primaria').then((res) => res.data),

  getInvestimentoDireto: () =>
    apiClient.get<IpeaSerie[]>('/ipea/balanca/investimento-direto').then((res) => res.data),

  getContaCapital: () =>
    apiClient.get<IpeaSerie[]>('/ipea/balanca/conta-capital').then((res) => res.data),

  getContaFinanceira: () =>
    apiClient.get<IpeaSerie[]>('/ipea/balanca/conta-financeira').then((res) => res.data),

  getInvestimentoCarteira: () =>
    apiClient.get<IpeaSerie[]>('/ipea/balanca/investimento-carteira').then((res) => res.data),

  getServicosDespesas: () =>
    apiClient.get<IpeaSerie[]>('/ipea/balanca/servicos-despesas').then((res) => res.data),

  getInvestimentoDiretoIngressos: () =>
    apiClient.get<IpeaSerie[]>('/ipea/balanca/investimento-direto-ingressos').then((res) => res.data),

  getTransacoesCorrentesPib: () =>
  apiClient.get<IpeaSerie[]>('/ipea/balanca/transacoes-correntes-pib').then((res) => res.data),




  // ==========================================
  // EXPORTAÇÕES
  // ==========================================
  getTotalExports: () =>
    apiClient.get<IpeaSerie[]>('/ipea/exportacoes/total').then((res) => res.data),

  getExportQuantumIndex: () =>
    apiClient.get<IpeaSerie[]>('/ipea/exportacoes/quantum').then((res) => res.data),

  getBasicProductsExports: () =>
    apiClient.get<IpeaSerie[]>('/ipea/exportacoes/produtos-basicos').then((res) => res.data),

  getAgricultureLivestockQuantumExports: () =>
    apiClient.get<IpeaSerie[]>('/ipea/exportacoes/quantum-agricultura-pecuaria').then((res) => res.data),

  getConsumerGoodsExports: () =>
    apiClient.get<IpeaSerie[]>('/ipea/exportacoes/bens-consumo').then((res) => res.data),

  getCapitalGoodsPriceIndex: () =>
    apiClient.get<IpeaSerie[]>('/ipea/exportacoes/precos-bens-capital').then((res) => res.data),

  getDurableConsumerGoodsPriceIndex: () =>
    apiClient.get<IpeaSerie[]>('/ipea/exportacoes/precos-bens-duraveis').then((res) => res.data),

  getNonDurableConsumerGoodsPriceIndex: () =>
    apiClient.get<IpeaSerie[]>('/ipea/exportacoes/precos-bens-nao-duraveis').then((res) => res.data),

  getIntermediateGoodsFobValue: () =>
    apiClient.get<IpeaSerie[]>('/ipea/exportacoes/valor-bens-intermediarios').then((res) => res.data),

  getIntermediateGoodsQuantumIndex: () =>
    apiClient.get<IpeaSerie[]>('/ipea/exportacoes/quantum-bens-intermediarios').then((res) => res.data),

  getFuelsFobValue: () =>
    apiClient.get<IpeaSerie[]>('/ipea/exportacoes/valor-combustiveis').then((res) => res.data),



  // ==========================================
  // IMPOSTOS
  // ==========================================
  getImportTax: () =>
    apiClient.get<IpeaSerie[]>('/ipea/impostos/importacao').then((res) => res.data),

  getPersonalIncomeTax: () =>
    apiClient.get<IpeaSerie[]>('/ipea/impostos/irpf').then((res) => res.data),

  getCorporateIncomeTax: () =>
    apiClient.get<IpeaSerie[]>('/ipea/impostos/irpj').then((res) => res.data),

  getTotalIncomeTax: () =>
    apiClient.get<IpeaSerie[]>('/ipea/impostos/ir-total').then((res) => res.data),

  getIofTax: () =>
    apiClient.get<IpeaSerie[]>('/ipea/impostos/iof').then((res) => res.data),

  getIpiTax: () =>
    apiClient.get<IpeaSerie[]>('/ipea/impostos/ipi').then((res) => res.data),




  // ==========================================
  // CÂMBIO CONTRATADO
  // ==========================================
  getContractedExchangeCommercial: () =>
    apiClient.get<IpeaSerie[]>('/ipea/cambio/comercial').then((res) => res.data),

  getContractedExchangeCommercialExports: () =>
    apiClient.get<IpeaSerie[]>('/ipea/cambio/comercial/exportacao').then((res) => res.data),

  getContractedExchangeCommercialImports: () =>
    apiClient.get<IpeaSerie[]>('/ipea/cambio/comercial/importacao').then((res) => res.data),

  getContractedExchangeTotal: () =>
    apiClient.get<IpeaSerie[]>('/ipea/cambio/comercial-financeiro').then((res) => res.data),

  getContractedExchangeFinancial: () =>
    apiClient.get<IpeaSerie[]>('/ipea/cambio/financeiro').then((res) => res.data),

  getContractedExchangeFinancialPurchases: () =>
    apiClient.get<IpeaSerie[]>('/ipea/cambio/financeiro/compra').then((res) => res.data),

  getContractedExchangeFinancialSales: () =>
    apiClient.get<IpeaSerie[]>('/ipea/cambio/financeiro/venda').then((res) => res.data),


  // pib
  getMonthlyPib: () =>
    apiClient.get<IpeaSerie[]>('/ipea/pib/mensal').then((res) => res.data),
};



