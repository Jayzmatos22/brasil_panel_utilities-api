package com.brasilpanel.backend.service.api.ipea;


import com.brasilpanel.backend.dto.api.ipea.IpeaItemDTO;
import com.brasilpanel.backend.dto.api.ipea.IpeaResponseDTO;
import com.brasilpanel.backend.dto.api.ipea.IpeaSerieDTO;
import com.brasilpanel.backend.exception.customized.IpeaException;
import com.brasilpanel.backend.model.FinancialDataPoint;
import com.brasilpanel.backend.service.financial.FinancialDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;

/**
 * Serve séries do IPEA priorizando o banco local.
 * DB-first: cache → FinancialDataPoint (source "IPEA") → API externa (fallback + persiste).
 */
@Service
@RequiredArgsConstructor
public class IpeaService {
    private final RestClient restClient;
    private final FinancialDataService financialDataService;
    private static final String SOURCE = "IPEA";
    private static final ZoneOffset BRT = ZoneOffset.of("-03:00");
    private static final String BASE_URL =
            "http://ipeadata.gov.br/api/odata4/Metadados('{codigo}')/Valores";

    // Emprego
    private static final String DESOCUPACAO = "PNADC12_NDESOCM12";
    private static final String OCUPACAO = "PNADC12_NOCUP12";

    // Renda
    private static final String SALARIO_MINIMO_REAL = "GAC12_SALMINRE12";
    private static final String SALARIO_MINIMO_PPC = "GAC12_SALMINDOL12";
    private static final String RENDA_PER_CAPITA = "PNADS_RENDAMEDIA";

    // Desigualdade
    private static final String GINI = "PNADS_GINI";
    private static final String POBREZA = "PNADS_PERCPOBRE300";

    // Macro
    private static final String PIB = "WEO_PIBWEOBRA";
    private static final String INVESTIMENTO = "WEO_INVESTWEOBRA";
    private static final String DESEMPREGO_FMI = "WEO_DESEMWEOBRA";
    private static final String SELIC = "PAN12_TJOVER12";
    private static final String RESERVAS = "BM12_RES12";
    private static final String ARRECADACAO = "SRF12_TOTGER12";

    // Preços
    private static final String INPC = "PRECOS12_INPC12";
    private static final String IGPM = "IGP12_IGPM12";

    // População
    private static final String POPULACAO = "PNADC12_POP12";
    private static final String PROJECAO_TOTAL = "DEPIS_POPP";
    private static final String PROJECAO_HOMENS = "DEPIS_POPHP";
    private static final String PROJECAO_MULHERES = "DEPIS_POPMP";

    // --- Balanço de Pagamentos ---

    //Ativos de Reserva
    private static final String ATIVOS_RESERVA = "BPAG12_AR12";
    private static final String TRANSACOES_CORRENTES = "BPAG12_TC12";
    private static final String BALANCA_COMERCIAL = "BPAG12_BC12";
    private static final String SERVICOS = "BPAG12_SER12";
    private static final String RENDA_PRIMARIA = "BPAG12_RP12";
    private static final String INVESTIMENTO_DIRETO = "BPAG12_IDE12";
    private static final String CONTA_CAPITAL = "BPAG12_CK12";
    private static final String CONTA_FINANCEIRA = "BPAG12_CF12";
    private static final String INVESTIMENTO_CARTEIRA = "BPAG12_ICAAA12";
    private static final String SERVICOS_DESPESA = "BPAG12_SERD12";
    private static final String INVESTIMENTO_DIRETO_INGRESSOS = "BPAG12_IDPI12";


    // --- Comércio Exterior (FUNCEX) ---

    // Exportações - Total (FOB)
    private static final String EXPORTACOES_TOTAL_FOB = "FUNCEX12_XVTXGCE12";

    // Índice de Quantum das Exportações - Total Geral
    private static final String INDICE_QUANTUM_EXPORTACOES = "FUNCEX12_XQT12";

    // Exportações FOB -
    private static final String EXPORTACOES_PRODUTOS_BASICOS = "FUNCEX12_XVB12";


    // Grandes Categorias Econômicas (Exportações)

    private static final String AGRICULTURA_E_PECUARIA_QUANTUM = "FUNCEX12_XQAGP2N12";
    private static final String EXPORTACOES_BENS_CONSUMO = "SECEX12_XBENCONGCE12";
    private static final String INDICE_PRECOS_BENS_CAPITAL = "FUNCEX12_XPBKGCE12";
    private static final String INDICE_PRECOS_BENS_DURAVEIS = "FUNCEX12_XPBCDGCE12";
    private static final String INDICE_PRECOS_BENS_NAO_DURAVEIS = "FUNCEX12_XPBCNDGCE12";
    private static final String VALOR_FOB_BENS_INTERMEDIARIOS = "FUNCEX12_XVBIGCE12";
    private static final String INDICE_QUANTUM_BENS_INTERMEDIARIOS = "FUNCEX12_XQBIGCE12";
    private static final String VALOR_FOB_COMBUSTIVEIS = "FUNCEX12_XVCOMBGCE12";


    // Brasil - Ibovespa
    // Mercado Financeiro / Índices
    private static final String IBOVESPA_FECHAMENTO = "GM366_IBVSP366";



    // IMPOSTOS
    private static final String IMPOSTO_II = "SRF12_II12";
    private static final String IMPOSTO_IRPF = "SRF12_IRPF12";
    private static final String IMPOSTO_IRPJ = "SRF12_IRPJ12";
    private static final String IMPOSTO_IR_TOTAL = "SRF12_IR12";
    private static final String IMPOSTO_IOF = "SRF12_IOF12";
    private static final String IMPOSTO_IPI = "SRF12_IPI12";





    private static final List<String> ALL_CODES = List.of(
            DESOCUPACAO, OCUPACAO, EXPORTACOES_TOTAL_FOB, INDICE_QUANTUM_EXPORTACOES,
            SALARIO_MINIMO_REAL, SALARIO_MINIMO_PPC, RENDA_PER_CAPITA, AGRICULTURA_E_PECUARIA_QUANTUM,
            GINI, POBREZA,  PIB, INVESTIMENTO, DESEMPREGO_FMI, SELIC, RESERVAS, ARRECADACAO,
            INPC, IGPM,  POPULACAO, PROJECAO_TOTAL, PROJECAO_HOMENS, PROJECAO_MULHERES, TRANSACOES_CORRENTES,
            BALANCA_COMERCIAL,  SERVICOS,  RENDA_PRIMARIA, INVESTIMENTO_DIRETO_INGRESSOS,
            INVESTIMENTO_DIRETO,  CONTA_CAPITAL,  CONTA_FINANCEIRA, EXPORTACOES_BENS_CONSUMO,
            ATIVOS_RESERVA, INVESTIMENTO_CARTEIRA, SERVICOS_DESPESA, EXPORTACOES_PRODUTOS_BASICOS,
            INDICE_PRECOS_BENS_CAPITAL, INDICE_PRECOS_BENS_DURAVEIS, INDICE_PRECOS_BENS_NAO_DURAVEIS,
            VALOR_FOB_BENS_INTERMEDIARIOS, INDICE_QUANTUM_BENS_INTERMEDIARIOS, VALOR_FOB_COMBUSTIVEIS, IBOVESPA_FECHAMENTO
    );


    @Cacheable("ipea-emprego")
    public List<IpeaSerieDTO> getEmprego() {
        return List.of(
                serie(DESOCUPACAO, "Taxa de desocupação (%)"),
                serie(OCUPACAO, "Nível de ocupação (%)")
        );
    }


    @Cacheable("ipea-renda")
    public List<IpeaSerieDTO> getRenda() {
        return List.of(
                serie(SALARIO_MINIMO_REAL, "Salário mínimo real (R$)"),
                serie(SALARIO_MINIMO_PPC, "Salário mínimo PPC (USD)"),
                serie(RENDA_PER_CAPITA, "Renda domiciliar per capita (R$)")
        );
    }


    @Cacheable("ipea-desigualdade")
    public List<IpeaSerieDTO> getDesigualdade() {
        return List.of(
                serie(GINI, "Coeficiente de Gini"),
                serie(POBREZA, "Taxa de pobreza % (PPC$3/dia)")
        );
    }


    @Cacheable("ipea-macro")
    public List<IpeaSerieDTO> getMacro() {
        return List.of(
                serie(PIB, "PIB (US$ bilhões)"),
                serie(INVESTIMENTO, "Investimento (% PIB)"),
                serie(DESEMPREGO_FMI, "Taxa de desemprego FMI (%)"),
                serie(SELIC, "Taxa Selic/Overnight (% a.a.)"),
                serie(RESERVAS, "Reservas internacionais (US$ milhões)"),
                serie(ARRECADACAO, "Arrecadação federal (R$ milhões)")
        );
    }


    @Cacheable("ipea-precos")
    public List<IpeaSerieDTO> getPrecos() {
        return List.of(
                serie(INPC, "INPC - índice"),
                serie(IGPM, "IGP-M - índice")
        );
    }


    @Cacheable("ipea-populacao")
    public List<IpeaSerieDTO> getPopulacao() {
        return List.of(
                serie(POPULACAO, "População total (mil pessoas)"),
                serie(PROJECAO_TOTAL, "Projeção população total"),
                serie(PROJECAO_HOMENS, "Projeção população homens"),
                serie(PROJECAO_MULHERES, "Projeção população mulheres")
        );
    }



    /**
     * Força a busca de todas as séries na API e persiste os pontos novos
     * (idempotente — datas já existentes são ignoradas), ignorando o atalho DB-first.
     * Usado pelo scheduler para re-alimentar o banco. Falhas por série não abortam as demais.
     */
    public void refreshAll() {
        for (String codigo : ALL_CODES) {
            try {
                persist(codigo, fetchSerie(codigo));
            } catch (Exception e) {
                // segue para a próxima série mesmo que uma falhe na API
            }
        }
    }

    // ── DB-first ──────────────────────────────────────────────────────────

    /** Monta uma série DB-first: lê do banco; se vazio, busca na API e persiste. */
    private IpeaSerieDTO serie(String codigo, String nome) {
        return new IpeaSerieDTO(codigo, nome, loadSerie(codigo));
    }

    private List<IpeaItemDTO> loadSerie(String codigo) {
        List<FinancialDataPoint> points = financialDataService.getAllPoints(codigo, SOURCE);

        if (!points.isEmpty()) {
            return points.stream()
                    .sorted(Comparator.comparing(FinancialDataPoint::getReferenceDate).reversed())
                    .map(p -> new IpeaItemDTO(
                            p.getReferenceDate().atStartOfDay().atOffset(BRT),
                            p.getValue().doubleValue()))
                    .toList();
        }

        // Cold path: banco vazio → busca na API e persiste para as próximas leituras.
        List<IpeaItemDTO> fresh = fetchSerie(codigo);
        persist(codigo, fresh);
        return fresh;
    }

    private void persist(String codigo, List<IpeaItemDTO> dados) {
        for (IpeaItemDTO item : dados) {
            if (item.data() == null || item.valor() == null) continue;
            financialDataService.savePoint(codigo, SOURCE, item.data().toLocalDate(), item.valor(), null);
        }
    }




    // BALANÇA DE PAGAMENTOS - (BPM6) (BCB / BP (BPM6))

    @Cacheable("ipea-reservas-ativos")
    public List<IpeaSerieDTO> getReserveAssets() {
        return List.of(
                serie(ATIVOS_RESERVA, "Ativos de Reserva Internacional")
        );
    }

    @Cacheable("ipea-transacoes-correntes")
    public List<IpeaSerieDTO> getCurrentTransactions() {
        return List.of(
                serie(TRANSACOES_CORRENTES, "Saldo em Transações Correntes")
        );
    }

    @Cacheable("ipea-balanca-comercial")
    public List<IpeaSerieDTO> getTradeBalance() {
        return List.of(
                serie(BALANCA_COMERCIAL, "Saldo da Balança Comercial")
        );
    }

    @Cacheable("ipea-servicos")
    public List<IpeaSerieDTO> getServicesBalance() {
        return List.of(
                serie(SERVICOS, "Saldo da Conta de Serviços")
        );
    }

    @Cacheable("ipea-renda-primaria")
    public List<IpeaSerieDTO> getPrimaryIncome() {
        return List.of(
                serie(RENDA_PRIMARIA, "Saldo da Renda Primária")
        );
    }

    @Cacheable("ipea-investimento-direto")
    public List<IpeaSerieDTO> getDirectInvestment() {
        return List.of(
                serie(INVESTIMENTO_DIRETO, "Investimento Direto no País")
        );
    }

    @Cacheable("ipea-conta-capital")
    public List<IpeaSerieDTO> getCapitalAccount() {
        return List.of(
                serie(CONTA_CAPITAL, "Saldo da Conta Capital")
        );
    }

    @Cacheable("ipea-conta-financeira")
    public List<IpeaSerieDTO> getFinancialAccount() {
        return List.of(
                serie(CONTA_FINANCEIRA, "Saldo da Conta Financeira")
        );
    }


    @Cacheable("ipea-investimento-carteira")
    public List<IpeaSerieDTO> getInvestmentWallet() {
        return List.of(
                serie(INVESTIMENTO_CARTEIRA, "Investimento em Carteira")
        );
    }


    @Cacheable("ipea-servicos-despesa")
    public List<IpeaSerieDTO> getServicesExpense() {
        return List.of(
                serie(SERVICOS_DESPESA, "Serviços - Despesa")
        );
    }

    @Cacheable("ipea-investimento-direto-ingressos")
    public List<IpeaSerieDTO> getDirectInvestmentInflows() {
        return List.of(
                serie(INVESTIMENTO_DIRETO_INGRESSOS,
                        "Investimento Direto no País - Ingressos")
        );
    }




    // EXPORTAÇÕES - Comércio Exterior (FUNCEX)
    @Cacheable("ipea-exportacoes-total")
    public List<IpeaSerieDTO> getTotalExports() {
        return List.of(
                serie(EXPORTACOES_TOTAL_FOB,
                        "Exportações Totais (FOB)")
        );
    }

    @Cacheable("ipea-quantum-exportacoes")
    public List<IpeaSerieDTO> getExportQuantumIndex() {
        return List.of(
                serie(INDICE_QUANTUM_EXPORTACOES,
                        "Índice de Quantum das Exportações")
        );
    }

    @Cacheable("ipea-exportacoes-produtos-basicos")
    public List<IpeaSerieDTO> getBasicProductsExports() {
        return List.of(
                serie(EXPORTACOES_PRODUTOS_BASICOS,
                        "Exportações de Produtos Básicos (FOB)")
        );
    }

    // - Categorias grandes.
    @Cacheable("ipea-exportacoes-agricultura-pecuaria-quantum")
    public List<IpeaSerieDTO> getAgricultureLivestockQuantumExports() {
        return List.of(serie(AGRICULTURA_E_PECUARIA_QUANTUM, "Índice de Quantum - Agricultura e Pecuária"));
    }

    @Cacheable("ipea-exportacoes-bens-consumo")
    public List<IpeaSerieDTO> getConsumerGoodsExports() {
        return List.of(serie(EXPORTACOES_BENS_CONSUMO, "Exportações de Bens de Consumo (FOB)"));
    }

    @Cacheable("ipea-exportacoes-precos-bens-capital")
    public List<IpeaSerieDTO> getCapitalGoodsPriceIndex() {
        return List.of(serie(INDICE_PRECOS_BENS_CAPITAL, "Índice de Preços - Bens de Capital"));
    }

    @Cacheable("ipea-exportacoes-precos-bens-duraveis")
    public List<IpeaSerieDTO> getDurableConsumerGoodsPriceIndex() {
        return List.of(serie(INDICE_PRECOS_BENS_DURAVEIS, "Índice de Preços - Bens de Consumo Duráveis"));
    }

    @Cacheable("ipea-exportacoes-precos-bens-nao-duraveis")
    public List<IpeaSerieDTO> getNonDurableConsumerGoodsPriceIndex() {
        return List.of(serie(INDICE_PRECOS_BENS_NAO_DURAVEIS, "Índice de Preços - Bens de Consumo Não Duráveis"));
    }

    @Cacheable("ipea-exportacoes-valor-bens-intermediarios")
    public List<IpeaSerieDTO> getIntermediateGoodsFobValue() {
        return List.of(serie(VALOR_FOB_BENS_INTERMEDIARIOS, "Valor FOB - Bens Intermediários"));
    }

    @Cacheable("ipea-exportacoes-quantum-bens-intermediarios")
    public List<IpeaSerieDTO> getIntermediateGoodsQuantumIndex() {
        return List.of(serie(INDICE_QUANTUM_BENS_INTERMEDIARIOS, "Índice de Quantum - Bens Intermediários"));
    }

    @Cacheable("ipea-exportacoes-valor-combustiveis")
    public List<IpeaSerieDTO> getFuelsFobValue() {
        return List.of(serie(VALOR_FOB_COMBUSTIVEIS, "Valor FOB - Combustíveis"));
    }


    // Brasil - Ibovespa
    @Cacheable("ipea-ibovespa-fechamento")
    public List<IpeaSerieDTO> getIbovespaClosingIndex() {
        return List.of(serie(IBOVESPA_FECHAMENTO, "Índice de ações: Ibovespa - fechamento"));
    }




    // -- IMPOSTOS --
    @Cacheable("ipea-imposto-ii")
    public List<IpeaSerieDTO> getImportTax() {
        return List.of(serie(IMPOSTO_II, "Imposto sobre a Importação (II) - Receita Bruta"));
    }

    @Cacheable("ipea-imposto-irpf")
    public List<IpeaSerieDTO> getPersonalIncomeTax() {
        return List.of(serie(IMPOSTO_IRPF, "Imposto de Renda (IRPF) - Receita Bruta"));
    }

    @Cacheable("ipea-imposto-irpj")
    public List<IpeaSerieDTO> getCorporateIncomeTax() {
        return List.of(serie(IMPOSTO_IRPJ, "Imposto de Renda (IRPJ) - Receita Bruta"));
    }

    @Cacheable("ipea-imposto-ir-total")
    public List<IpeaSerieDTO> getTotalIncomeTax() {
        return List.of(serie(IMPOSTO_IR_TOTAL, "Imposto de Renda Total - Receita Bruta"));
    }

    @Cacheable("ipea-imposto-iof")
    public List<IpeaSerieDTO> getIofTax() {
        return List.of(serie(IMPOSTO_IOF, "Imposto sobre Operações Financeiras (IOF) - Receita Bruta"));
    }

    @Cacheable("ipea-imposto-ipi")
    public List<IpeaSerieDTO> getIpiTax() {
        return List.of(serie(IMPOSTO_IPI, "Imposto sobre Produtos Industrializados (IPI) - Receita Bruta"));
    }





    // Requisição feita à API baseada no código.
    // As requisições abaixo reutilizam essa função, só o código de série muda.
    private List<IpeaItemDTO> fetchSerie(String codigo) {
        try {
            String url = BASE_URL.replace("{codigo}", codigo);
            IpeaResponseDTO response = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(IpeaResponseDTO.class);

            if (response == null || response.value() == null) {
                throw new IpeaException("Série não encontrada: " + codigo, 404);
            }

            return response.value().stream()
                    .sorted(Comparator.comparing(IpeaItemDTO::data).reversed())
                    .toList();

        } catch (IpeaException e) {
            throw e;
        } catch (Exception e) {
            throw new IpeaException("Erro ao buscar série: " + codigo, 502);
        }
    }

}
