package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.dto.api.ipea.IpeaSerieDTO;
import com.brasilpanel.backend.service.api.ipea.IpeaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ipea")
@RequiredArgsConstructor
@Tag(name = "IPEA", description = "Séries econômicas e sociais do Brasil — IPEA Data")
public class IpeaController {
    private final IpeaService ipeaService;

    // ==========================================
    // ECONOMIA GERAL
    // ==========================================

    @Operation(summary = "Emprego", description = "Taxa de desocupação e nível de ocupação — PNAD Contínua mensal")
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/emprego")
    public ResponseEntity<List<IpeaSerieDTO>> getEmprego() {
        return ResponseEntity.ok(ipeaService.getEmprego());
    }

    @Operation(summary = "Renda", description = "Salário mínimo real, salário mínimo PPC e renda domiciliar per capita")
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/renda")
    public ResponseEntity<List<IpeaSerieDTO>> getRenda() {
        return ResponseEntity.ok(ipeaService.getRenda());
    }

    @Operation(summary = "Desigualdade e pobreza", description = "Coeficiente de Gini e taxa de pobreza anual")
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/desigualdade")
    public ResponseEntity<List<IpeaSerieDTO>> getDesigualdade() {
        return ResponseEntity.ok(ipeaService.getDesigualdade());
    }

    @Operation(summary = "Macroeconomia", description = "PIB, investimento, desemprego FMI, Selic, reservas internacionais e arrecadação federal")
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/macro")
    public ResponseEntity<List<IpeaSerieDTO>> getMacro() {
        return ResponseEntity.ok(ipeaService.getMacro());
    }

    @Operation(summary = "Preços", description = "INPC e IGP-M — índices de inflação mensais")
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/precos")
    public ResponseEntity<List<IpeaSerieDTO>> getPrecos() {
        return ResponseEntity.ok(ipeaService.getPrecos());
    }

    @Operation(summary = "População", description = "População total mensal e projeções até 2070 por sexo")
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/populacao")
    public ResponseEntity<List<IpeaSerieDTO>> getPopulacao() {
        return ResponseEntity.ok(ipeaService.getPopulacao());
    }



    // ==========================================
    // Balança de pagamentos
    // ==========================================

    @Operation(summary = "Ativos de Reserva", description = "Ativos de reserva compreendem as operações com os ativos " +
            "externos que estão à disposição imediata e sob controle da autoridade monetária para satisfazer suas necessidades " +
            "de financiamento de balanço de pagamentos, intervir no mercado de câmbio e outros fins conexos")
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/balanca/ativos-reservas")
    ResponseEntity<List<IpeaSerieDTO>> getAtvosDeReservas(){
        return ResponseEntity.ok(ipeaService.getReserveAssets());
    }


    @Operation(
            summary = "Transações Correntes",
            description = "Registra o saldo das transações entre residentes e não residentes envolvendo bens, serviços, rendas e transferências correntes."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/balanca/transacoes-correntes-pib")
    ResponseEntity<List<IpeaSerieDTO>> getTransacoesCorrentes() {
        return ResponseEntity.ok(ipeaService.getCurrentTransactionsBalance());
    }


    @Operation(
            summary = "Balança Comercial",
            description = "Representa a diferença entre exportações e importações de bens realizadas pelo país."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/balanca/comercial")
    ResponseEntity<List<IpeaSerieDTO>> getBalancaComercial() {
        return ResponseEntity.ok(ipeaService.getTradeBalance());
    }


    @Operation(
            summary = "Serviços",
            description = "Registra receitas e despesas decorrentes da prestação de serviços entre residentes e não residentes."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/balanca/servicos")
    ResponseEntity<List<IpeaSerieDTO>> getServicos() {
        return ResponseEntity.ok(ipeaService.getServicesBalance());
    }


    @Operation(
            summary = "Renda Primária",
            description = "Compreende fluxos de remuneração de fatores de produção, incluindo juros, lucros, dividendos e salários."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/balanca/renda-primaria")
    ResponseEntity<List<IpeaSerieDTO>> getRendaPrimaria() {
        return ResponseEntity.ok(ipeaService.getPrimaryIncome());
    }


    @Operation(
            summary = "Investimento Direto",
            description = "Fluxos de investimento realizados com o objetivo de estabelecer participação duradoura em empresas residentes."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/balanca/investimento-direto")
    ResponseEntity<List<IpeaSerieDTO>> getInvestimentoDireto() {
        return ResponseEntity.ok(ipeaService.getDirectInvestment());
    }


    @Operation(
            summary = "Conta Capital",
            description = "Registra transferências de capital e aquisições ou alienações de ativos não financeiros não produzidos."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/balanca/conta-capital")
    ResponseEntity<List<IpeaSerieDTO>> getContaCapital() {
        return ResponseEntity.ok(ipeaService.getCapitalAccount());
    }


    @Operation(
            summary = "Conta Financeira",
            description = "Registra as transações envolvendo ativos e passivos financeiros entre residentes e não residentes."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/balanca/conta-financeira")
    ResponseEntity<List<IpeaSerieDTO>> getContaFinanceira() {
        return ResponseEntity.ok(ipeaService.getFinancialAccount());
    }


    @Operation(
            summary = "Investimento em Carteira",
            description = "Investimentos em carteira registrados no balanço de pagamentos, incluindo aplicações em títulos e valores mobiliários."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/balanca/investimento-carteira")
    ResponseEntity<List<IpeaSerieDTO>> getInvestmentWallet() {
        return ResponseEntity.ok(ipeaService.getInvestmentWallet());
    }


    @Operation(
            summary = "Serviços - Despesas",
            description = "Despesas da conta de serviços registradas no balanço de pagamentos."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/balanca/servicos-despesas")
    ResponseEntity<List<IpeaSerieDTO>> getServicesExpense() {
        return ResponseEntity.ok(ipeaService.getServicesExpense());
    }


    @Operation(
            summary = "Investimento Direto no País - Ingressos",
            description = "Ingressos de investimento direto no país registrados no balanço de pagamentos."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/balanca/investimento-direto-ingressos")
    ResponseEntity<List<IpeaSerieDTO>> getDirectInvestmentInflows() {
        return ResponseEntity.ok(ipeaService.getDirectInvestmentInflows());
    }

    @Operation(
            summary = "Transações Correntes (% do PIB)",
            description = "A conta transações correntes mostra os fluxos de bens, serviços, renda primária e renda secundária entre residentes e não residentes do país em relação ao PIB."
    )
    @ApiResponse(responseCode = "200", description = "Série retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/balanca/transacoes-correntes")
    public ResponseEntity<List<IpeaSerieDTO>> getCurrentTransactionsPib() {
        return ResponseEntity.ok(ipeaService.getCurrentTransactionsPib());
    }


    // ==========================================
    // Exportações
    // ==========================================
    @Operation(
            summary = "Exportações Totais (FOB)",
            description = "Valor total das exportações brasileiras em base FOB."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/exportacoes/total")
    ResponseEntity<List<IpeaSerieDTO>> getTotalExports() {
        return ResponseEntity.ok(ipeaService.getTotalExports());
    }


    @Operation(
            summary = "Índice de Quantum das Exportações",
            description = "Índice de quantum das exportações totais brasileiras."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/exportacoes/quantum")
    ResponseEntity<List<IpeaSerieDTO>> getExportQuantumIndex() {
        return ResponseEntity.ok(ipeaService.getExportQuantumIndex());
    }


    @Operation(
            summary = "Exportações de Produtos Básicos (FOB)",
            description = "Valor FOB das exportações brasileiras de produtos básicos."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/exportacoes/produtos-basicos")
    ResponseEntity<List<IpeaSerieDTO>> getBasicProductsExports() {
        return ResponseEntity.ok(ipeaService.getBasicProductsExports());
    }


    @Operation(
            summary = "Índice de Quantum - Agricultura e Pecuária",
            description = "Índice de quantum das exportações de agricultura e pecuária (Média 2018 = 100)."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/exportacoes/quantum-agricultura-pecuaria")
    public ResponseEntity<List<IpeaSerieDTO>> getAgricultureLivestockQuantumExports() {
        return ResponseEntity.ok(ipeaService.getAgricultureLivestockQuantumExports());
    }

    @Operation(
            summary = "Exportações de Bens de Consumo (FOB)",
            description = "Valor FOB das exportações brasileiras de bens de consumo (Grandes Categorias Econômicas)."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/exportacoes/bens-consumo")
    public ResponseEntity<List<IpeaSerieDTO>> getConsumerGoodsExports() {
        return ResponseEntity.ok(ipeaService.getConsumerGoodsExports());
    }

    @Operation(
            summary = "Índice de Preços - Bens de Capital",
            description = "Índice de preços das exportações de bens de capital (Média 2018 = 100)."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/exportacoes/precos-bens-capital")
    public ResponseEntity<List<IpeaSerieDTO>> getCapitalGoodsPriceIndex() {
        return ResponseEntity.ok(ipeaService.getCapitalGoodsPriceIndex());
    }

    @Operation(
            summary = "Índice de Preços - Bens Duráveis",
            description = "Índice de preços das exportações de bens de consumo duráveis (Média 2018 = 100)."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/exportacoes/precos-bens-duraveis")
    public ResponseEntity<List<IpeaSerieDTO>> getDurableConsumerGoodsPriceIndex() {
        return ResponseEntity.ok(ipeaService.getDurableConsumerGoodsPriceIndex());
    }

    @Operation(
            summary = "Índice de Preços - Bens Não Duráveis",
            description = "Índice de preços das exportações de bens de consumo não duráveis (Média 2018 = 100)."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/exportacoes/precos-bens-nao-duraveis")
    public ResponseEntity<List<IpeaSerieDTO>> getNonDurableConsumerGoodsPriceIndex() {
        return ResponseEntity.ok(ipeaService.getNonDurableConsumerGoodsPriceIndex());
    }

    @Operation(
            summary = "Valor FOB - Bens Intermediários",
            description = "Valor FOB das exportações brasileiras de bens de consumo intermediários."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/exportacoes/valor-bens-intermediarios")
    public ResponseEntity<List<IpeaSerieDTO>> getIntermediateGoodsFobValue() {
        return ResponseEntity.ok(ipeaService.getIntermediateGoodsFobValue());
    }

    @Operation(
            summary = "Índice de Quantum - Bens Intermediários",
            description = "Índice de quantum das exportações de bens intermediários (Média 2018 = 100)."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/exportacoes/quantum-bens-intermediarios")
    public ResponseEntity<List<IpeaSerieDTO>> getIntermediateGoodsQuantumIndex() {
        return ResponseEntity.ok(ipeaService.getIntermediateGoodsQuantumIndex());
    }

    @Operation(
            summary = "Valor FOB - Combustíveis",
            description = "Valor FOB das exportações brasileiras de combustíveis (Grandes Categorias Econômicas)."
    )
    @ApiResponse(responseCode = "200", description = "Séries retornadas com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/exportacoes/valor-combustiveis")
    public ResponseEntity<List<IpeaSerieDTO>> getFuelsFobValue() {
        return ResponseEntity.ok(ipeaService.getFuelsFobValue());
    }

    // ==========================================
    // Brasil - Ibovespa
    // ==========================================
    @Operation(
            summary = "Ibovespa - Fechamento",
            description = "Índice da Bolsa de Valores de São Paulo (IBOVESPA) - fechamento diário."
    )
    @ApiResponse(responseCode = "200", description = "Série retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/mercado/ibovespa")
    public ResponseEntity<List<IpeaSerieDTO>> getIbovespaClosingIndex() {
        return ResponseEntity.ok(ipeaService.getIbovespaClosingIndex());
    }



    // ==========================================
    // IMPOSTOS -  VÁRIOS
    // ==========================================
    @Operation(
            summary = "Imposto sobre a Importação (II)",
            description = "Total da receita bruta de arrecadação do Imposto sobre a Importação."
    )
    @ApiResponse(responseCode = "200", description = "Série retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/impostos/importacao")
    public ResponseEntity<List<IpeaSerieDTO>> getImportTax() {
        return ResponseEntity.ok(ipeaService.getImportTax());
    }

    @Operation(
            summary = "Imposto de Renda Pessoa Física (IRPF)",
            description = "Total da receita bruta de arrecadação do Imposto de Renda sobre Pessoas Físicas."
    )
    @ApiResponse(responseCode = "200", description = "Série retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/impostos/irpf")
    public ResponseEntity<List<IpeaSerieDTO>> getPersonalIncomeTax() {
        return ResponseEntity.ok(ipeaService.getPersonalIncomeTax());
    }

    @Operation(
            summary = "Imposto de Renda Pessoa Jurídica (IRPJ)",
            description = "Total da receita bruta de arrecadação do Imposto de Renda sobre Pessoas Jurídicas."
    )
    @ApiResponse(responseCode = "200", description = "Série retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/impostos/irpj")
    public ResponseEntity<List<IpeaSerieDTO>> getCorporateIncomeTax() {
        return ResponseEntity.ok(ipeaService.getCorporateIncomeTax());
    }

    @Operation(
            summary = "Imposto de Renda - Total",
            description = "Total da receita bruta de arrecadação do Imposto de Renda (Soma de IRPF, IRPJ e retidos na fonte)."
    )
    @ApiResponse(responseCode = "200", description = "Série retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/impostos/ir-total")
    public ResponseEntity<List<IpeaSerieDTO>> getTotalIncomeTax() {
        return ResponseEntity.ok(ipeaService.getTotalIncomeTax());
    }

    @Operation(
            summary = "Imposto sobre Operações Financeiras (IOF)",
            description = "Total da receita bruta de arrecadação do Imposto sobre Operações Financeiras."
    )
    @ApiResponse(responseCode = "200", description = "Série retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/impostos/iof")
    public ResponseEntity<List<IpeaSerieDTO>> getIofTax() {
        return ResponseEntity.ok(ipeaService.getIofTax());
    }

    @Operation(
            summary = "Imposto sobre Produtos Industrializados (IPI)",
            description = "Total da receita bruta de arrecadação do Imposto sobre Produtos Industrializados."
    )
    @ApiResponse(responseCode = "200", description = "Série retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/impostos/ipi")
    public ResponseEntity<List<IpeaSerieDTO>> getIpiTax() {
        return ResponseEntity.ok(ipeaService.getIpiTax());
    }



    // ==========================================
    // CÂMBIO CONTRATADO
    // ==========================================
    @Operation(
            summary = "Câmbio Contratado - Comercial",
            description = "Resultado líquido de contratações de câmbio comercial de exportação e de importação."
    )
    @ApiResponse(responseCode = "200", description = "Série retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/cambio/comercial")
    public ResponseEntity<List<IpeaSerieDTO>> getContractedExchangeCommercial() {
        return ResponseEntity.ok(ipeaService.getContractedExchangeCommercial());
    }

    @Operation(
            summary = "Câmbio Contratado - Comercial (Exportação)",
            description = "Contratações de compra de moeda estrangeira relativas a exportação de bens."
    )
    @ApiResponse(responseCode = "200", description = "Série retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/cambio/comercial/exportacao")
    public ResponseEntity<List<IpeaSerieDTO>> getContractedExchangeCommercialExports() {
        return ResponseEntity.ok(ipeaService.getContractedExchangeCommercialExports());
    }

    @Operation(
            summary = "Câmbio Contratado - Comercial (Importação)",
            description = "Contratações de venda de moeda relativas a importações de bens."
    )
    @ApiResponse(responseCode = "200", description = "Série retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/cambio/comercial/importacao")
    public ResponseEntity<List<IpeaSerieDTO>> getContractedExchangeCommercialImports() {
        return ResponseEntity.ok(ipeaService.getContractedExchangeCommercialImports());
    }

    @Operation(
            summary = "Câmbio Contratado - Comercial e Financeiro",
            description = "Soma dos resultados líquidos de câmbio contratado com clientes no país e com instituições no exterior."
    )
    @ApiResponse(responseCode = "200", description = "Série retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/cambio/comercial-financeiro")
    public ResponseEntity<List<IpeaSerieDTO>> getContractedExchangeTotal() {
        return ResponseEntity.ok(ipeaService.getContractedExchangeTotal());
    }

    @Operation(
            summary = "Câmbio Contratado - Financeiro",
            description = "Resultado líquido de contratações de câmbio financeiro de compra e venda. Não inclui operações junto ao BCB."
    )
    @ApiResponse(responseCode = "200", description = "Série retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/cambio/financeiro")
    public ResponseEntity<List<IpeaSerieDTO>> getContractedExchangeFinancial() {
        return ResponseEntity.ok(ipeaService.getContractedExchangeFinancial());
    }

    @Operation(
            summary = "Câmbio Contratado - Financeiro (Compra)",
            description = "Contratações de compra de moeda estrangeira relativas a exportação de serviços e ingressos/retorno de capitais."
    )
    @ApiResponse(responseCode = "200", description = "Série retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/cambio/financeiro/compra")
    public ResponseEntity<List<IpeaSerieDTO>> getContractedExchangeFinancialPurchases() {
        return ResponseEntity.ok(ipeaService.getContractedExchangeFinancialPurchases());
    }

    @Operation(
            summary = "Câmbio Contratado - Financeiro (Venda)",
            description = "Contratações de venda de moeda estrangeira relativas a importação de serviços e ingressos/retorno de capitais."
    )
    @ApiResponse(responseCode = "200", description = "Série retornada com sucesso")
    @ApiResponse(responseCode = "502", description = "Erro na comunicação com IPEA")
    @GetMapping("/cambio/financeiro/venda")
    public ResponseEntity<List<IpeaSerieDTO>> getContractedExchangeFinancialSales() {
        return ResponseEntity.ok(ipeaService.getContractedExchangeFinancialSales());
    }

}