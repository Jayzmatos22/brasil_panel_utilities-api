package com.brasilpanel.backend.service.api.ipea;


import com.brasilpanel.backend.dto.api.ipea.IpeaItemDTO;
import com.brasilpanel.backend.dto.api.ipea.IpeaResponseDTO;
import com.brasilpanel.backend.dto.api.ipea.IpeaSerieDTO;
import com.brasilpanel.backend.exception.customized.IpeaException;
import com.brasilpanel.backend.model.FinancialDataPoint;
import com.brasilpanel.backend.service.financial.DbFirst;
import com.brasilpanel.backend.service.financial.FinancialDataService;
import com.brasilpanel.backend.service.financial.SeriesFreshness;
import com.brasilpanel.backend.service.financial.SeriesPeriodicity;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import lombok.extern.slf4j.Slf4j;

/**
 * Serve séries do IPEA priorizando o banco local.
 * DB-first: cache → FinancialDataPoint (source "IPEA") → API externa (fallback + persiste).
 */
@Service
@Slf4j
public class IpeaService {
    private final RestClient restClient;
    private final FinancialDataService financialDataService;
    private static final String SOURCE = "IPEA";
    private static final ZoneOffset BRT = ZoneOffset.of("-03:00");

    /**
     * Host oficial da API, {@code www} incluso. O apex {@code ipeadata.gov.br}
     * resolvia para endereços que não completam o handshake TCP a partir de fora
     * da rede local — a página falhava com {@code connect timed out} tanto no
     * Render quanto, quando a fonte oscila, no próprio Brasil. O {@code www}
     * resolve para a infraestrutura correta e responde de imediato. Usar o nome
     * (e não um IP) deixa o cliente HTTP fazer o DNS e enviar o cabeçalho
     * {@code Host} certo — o roteamento por nome do IPEA depende disso.
     */
    private static final String HOST = "www.ipeadata.gov.br";
    private static final String PATH = "/api/odata4/Metadados('%s')/Valores";

    /**
     * Construtor explícito, e não {@code @RequiredArgsConstructor}: o
     * {@code @Qualifier} precisa chegar ao parâmetro do construtor, e o Lombok só
     * copia anotações listadas em {@code lombok.config} — que este projeto não tem.
     * Sem isso o Spring injetaria o cliente {@code @Primary}, de connect timeout longo.
     */
    public IpeaService(@Qualifier("ipeaRestClient") RestClient restClient,
                       FinancialDataService financialDataService) {
        this.restClient = restClient;
        this.financialDataService = financialDataService;
    }

    // ── Fan-out das séries ───────────────────────────────────────────────────

    /**
     * Teto de séries buscadas ao mesmo tempo.
     *
     * <p>Pool limitado, e não virtual threads, apesar do Java 21: são 45 métodos
     * cacheados e um fan-out ilimitado dispararia centenas de chamadas simultâneas
     * ao IPEA se vários caches vencessem juntos — exatamente o martelamento que o
     * {@code sync = true} eliminou. 8 também respeita o pool do Hikari (padrão 10):
     * cada série abre transações curtas e independentes em {@code savePoint}.
     */
    private static final int FAN_OUT_THREADS = 8;

    private final ExecutorService fanOut = Executors.newFixedThreadPool(FAN_OUT_THREADS, r -> {
        Thread t = new Thread(r, "ipea-serie");
        t.setDaemon(true);
        return t;
    });

    @PreDestroy
    void encerrarFanOut() {
        fanOut.shutdown();
    }

    /** Uma série a buscar: código no IPEA e rótulo exibido no painel. */
    private record SerieSpec(String codigo, String nome) {}

    private static SerieSpec spec(String codigo, String nome) {
        return new SerieSpec(codigo, nome);
    }

    /**
     * Busca as séries do endpoint em paralelo, preservando a ordem declarada.
     *
     * <p>Seguro porque não há transação envolvendo a chamada: cada método de
     * {@link FinancialDataService} abre a sua, então nada precisa atravessar de
     * uma thread para outra. O ganho é direto — as séries de um endpoint são
     * independentes entre si e cada uma custa uma ida à rede.
     *
     * <p>Com uma série só, chama direto: o salto de thread custaria mais que o
     * paralelismo renderia.
     */
    private List<IpeaSerieDTO> series(SerieSpec... specs) {
        if (specs.length == 1) {
            return List.of(serie(specs[0].codigo(), specs[0].nome()));
        }

        List<CompletableFuture<IpeaSerieDTO>> futuros = Arrays.stream(specs)
                .map(s -> CompletableFuture.supplyAsync(() -> serie(s.codigo(), s.nome()), fanOut))
                .toList();

        try {
            return futuros.stream().map(CompletableFuture::join).toList();
        } catch (CompletionException e) {
            throw desembrulhar(e);
        }
    }

    /**
     * O {@code join} embrulha a causa em {@link CompletionException}. Sem desfazer
     * isso, a {@link IpeaException} perderia o status que o GlobalExceptionHandler
     * mapeia e a falha chegaria ao cliente como 500 genérico.
     */
    private static RuntimeException desembrulhar(CompletionException e) {
        Throwable causa = e.getCause();
        if (causa instanceof RuntimeException re) {
            return re;
        }
        if (causa instanceof Error erro) {
            throw erro;
        }
        return e;
    }

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
    //private static final String TAXA_DESEMPREGO_FORCA_TRABALHO = "ECONMI12_USU12";
    private static final String TAXA_DESOCUPACAO14MAIS = "PNADC12_TDESOC12";

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
    private static final String TRANSACOES_CORRENTES_SALDO = "BPAG12_TC12";
    private static final String BALANCA_COMERCIAL = "BPAG12_BC12";
    private static final String SERVICOS = "BPAG12_SER12";
    private static final String RENDA_PRIMARIA = "BPAG12_RP12";
    private static final String INVESTIMENTO_DIRETO = "BPAG12_IDE12";
    private static final String CONTA_CAPITAL = "BPAG12_CK12";
    private static final String CONTA_FINANCEIRA = "BPAG12_CF12";
    private static final String INVESTIMENTO_CARTEIRA = "BPAG12_ICAAA12";
    private static final String SERVICOS_DESPESA = "BPAG12_SERD12";
    private static final String INVESTIMENTO_DIRETO_INGRESSOS = "BPAG12_IDPI12";
    private static final String TRANSACOES_CORRENTES_PIB = "BPAG12_TCPIB12";


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
    private static final String IMPOSTO_ITR = "SRF12_ITR12";

    // CÂMBIO CONTRATADO
    private static final String CAMBIO_COMERCIAL = "BM12_SBCCC12";
    private static final String CAMBIO_COMERCIAL_EXP = "BM12_XCC12";
    private static final String CAMBIO_COMERCIAL_IMP = "BM12_MCC12";
    private static final String CAMBIO_COMERCIAL_FINANC = "BM12_SGCC12";
    private static final String CAMBIO_FINANCEIRO = "BM12_SFCC12";
    private static final String CAMBIO_FINANCEIRO_COMPRA = "BM12_CFCC12";
    private static final String CAMBIO_FINANCEIRO_VENDA = "BM12_VFCC12";


    // PIB por mês
    private static final String PIB_MENSAL = "BM12_PIB12";






    private static final List<String> ALL_CODES = List.of(
            DESOCUPACAO, OCUPACAO, EXPORTACOES_TOTAL_FOB, INDICE_QUANTUM_EXPORTACOES,
            SALARIO_MINIMO_REAL, SALARIO_MINIMO_PPC, RENDA_PER_CAPITA, AGRICULTURA_E_PECUARIA_QUANTUM,
            GINI, POBREZA, DESEMPREGO_FMI, SELIC, RESERVAS, ARRECADACAO,
            INPC, IGPM,  POPULACAO, PROJECAO_TOTAL, PROJECAO_HOMENS, PROJECAO_MULHERES, TRANSACOES_CORRENTES_SALDO,
            BALANCA_COMERCIAL,  SERVICOS,  RENDA_PRIMARIA, INVESTIMENTO_DIRETO_INGRESSOS,
            INVESTIMENTO_DIRETO,  CONTA_CAPITAL,  CONTA_FINANCEIRA, EXPORTACOES_BENS_CONSUMO,
            ATIVOS_RESERVA, INVESTIMENTO_CARTEIRA, SERVICOS_DESPESA, EXPORTACOES_PRODUTOS_BASICOS,
            INDICE_PRECOS_BENS_CAPITAL, INDICE_PRECOS_BENS_DURAVEIS, INDICE_PRECOS_BENS_NAO_DURAVEIS,
            VALOR_FOB_BENS_INTERMEDIARIOS, INDICE_QUANTUM_BENS_INTERMEDIARIOS, VALOR_FOB_COMBUSTIVEIS, IBOVESPA_FECHAMENTO,
            IMPOSTO_II, IMPOSTO_IRPF, IMPOSTO_IRPJ, IMPOSTO_IR_TOTAL, IMPOSTO_IOF, IMPOSTO_IPI, PIB_MENSAL,
            CAMBIO_COMERCIAL, CAMBIO_COMERCIAL_EXP, CAMBIO_COMERCIAL_IMP, CAMBIO_COMERCIAL_FINANC, CAMBIO_FINANCEIRO,
            CAMBIO_FINANCEIRO, CAMBIO_FINANCEIRO_COMPRA, CAMBIO_FINANCEIRO_VENDA, IMPOSTO_ITR,
            TAXA_DESOCUPACAO14MAIS
    );

    // Pib
    @Cacheable(value = "ipea-pib-mensal", sync = true)
    public List<IpeaSerieDTO> getMonthlyPib(){
        return List.of(
                serie(PIB_MENSAL, "PIB mensal do Brasil R$ (milhôes)")
        );
    }


    // MACRO ECONOMIA
    @Cacheable(value = "ipea-emprego", sync = true)
    public List<IpeaSerieDTO> getEmprego() {
        return series(
                spec(DESOCUPACAO, "Taxa de desocupação (%)"),
                spec(OCUPACAO, "Nível de ocupação (%)")
        );
    }


    @Cacheable(value = "ipea-renda", sync = true)
    public List<IpeaSerieDTO> getRenda() {
        return series(
                spec(SALARIO_MINIMO_REAL, "Salário mínimo real (R$)"),
                spec(SALARIO_MINIMO_PPC, "Salário mínimo PPC (USD)"),
                spec(RENDA_PER_CAPITA, "Renda domiciliar per capita (R$)")
        );
    }


    @Cacheable(value = "ipea-desigualdade", sync = true)
    public List<IpeaSerieDTO> getDesigualdade() {
        return series(
                spec(GINI, "Coeficiente de Gini"),
                spec(POBREZA, "Taxa de pobreza % (PPC$3/dia)")
        );
    }


    @Cacheable(value = "ipea-macro", sync = true)
    public List<IpeaSerieDTO> getMacro() {
        return series(
                spec(SELIC, "Taxa Selic/Overnight (% a.a.)"),
                spec(RESERVAS, "Reservas internacionais (US$ milhões)"),
                spec(ARRECADACAO, "Arrecadação federal (R$ milhões)"),
                spec(TAXA_DESOCUPACAO14MAIS, "Taxa de desocupação - 14 anos e acima")
        );
    }


    @Cacheable(value = "ipea-precos", sync = true)
    public List<IpeaSerieDTO> getPrecos() {
        return series(
                spec(INPC, "INPC - índice"),
                spec(IGPM, "IGP-M - índice")
        );
    }


    @Cacheable(value = "ipea-populacao", sync = true)
    public List<IpeaSerieDTO> getPopulacao() {
        return series(
                spec(POPULACAO, "População total (mil pessoas)"),
                spec(PROJECAO_TOTAL, "Projeção população total"),
                spec(PROJECAO_HOMENS, "Projeção população homens"),
                spec(PROJECAO_MULHERES, "Projeção população mulheres")
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

                List<IpeaItemDTO> fresh = fetchSerie(codigo);
                log.info("Série {} → {} pontos buscados. Última data: {}",
                        codigo, fresh.size(),
                        fresh.isEmpty() ? "—" : fresh.get(0).data());
                persist(codigo, fresh);
            } catch (Exception e) {
                log.error("Falha ao atualizar série {}: {}", codigo, e.getMessage(), e);
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

        Optional<List<IpeaItemDTO>> doBanco = points.isEmpty()
                ? Optional.empty()
                : Optional.of(toItems(points));

        return DbFirst.serve(codigo, doBanco, isDesatualizado(codigo, points),
                ultimaData(points), () -> {
                    List<IpeaItemDTO> fresh = fetchSerie(codigo);
                    persist(codigo, fresh);
                    return fresh;
                });
    }

    /**
     * Séries publicadas uma vez por ano.
     *
     * <p>Estavam caindo no padrão mensal e por isso ficavam permanentemente
     * vencidas: em 11/08/2026 o Gini parava em 2025-01-01 — que é o dado corrente —
     * mas a régua mensal exigia ponto de julho/2026. Cada expiração de cache virava
     * uma ida à fonte por um valor que não existe: ~0,34 s por série, sem gravar
     * nada, contra um host que já é instável.
     */
    private static final Set<String> SERIES_ANUAIS = Set.of(
            GINI, POBREZA, RENDA_PER_CAPITA,
            PROJECAO_TOTAL, PROJECAO_HOMENS, PROJECAO_MULHERES
    );

    /** Ibovespa é diário (pregão); as demais são anuais ou mensais. */
    private boolean isDesatualizado(String codigo, List<FinancialDataPoint> points) {
        SeriesPeriodicity periodicidade;
        if (codigo.equals(IBOVESPA_FECHAMENTO)) {
            periodicidade = SeriesPeriodicity.DIARIA_UTIL;
        } else if (SERIES_ANUAIS.contains(codigo)) {
            periodicidade = SeriesPeriodicity.ANUAL;
        } else {
            periodicidade = SeriesPeriodicity.MENSAL;
        }
        return SeriesFreshness.isStale(ultimaData(points), periodicidade);
    }

    /** Pontos vêm do banco em ordem cronológica crescente — o último é o mais recente. */
    private LocalDate ultimaData(List<FinancialDataPoint> points) {
        return points.isEmpty() ? null : points.get(points.size() - 1).getReferenceDate();
    }

    private List<IpeaItemDTO> toItems(List<FinancialDataPoint> points) {
        return points.stream()
                .sorted(Comparator.comparing(FinancialDataPoint::getReferenceDate).reversed())
                .map(p -> new IpeaItemDTO(
                        p.getReferenceDate().atStartOfDay().atOffset(BRT),
                        p.getValue().doubleValue()))
                .toList();
    }

    private void persist(String codigo, List<IpeaItemDTO> dados) {
        // 1. Pegamos a última data que já temos no banco para esta série
        Optional<LocalDate> lastInDb = financialDataService.getLastReferenceDate(codigo, SOURCE);

        for (IpeaItemDTO item : dados) {
            if (item.data() == null || item.valor() == null) continue;

            LocalDate itemDate = item.data().toLocalDate();

            // 2. OTIMIZAÇÃO CRÍTICA: Como a lista 'dados' vem da API ordenada pela data decrescente (mais nova primeiro),
            // se chegarmos em uma data que já existe no banco, não precisamos processar o resto das 43 mil linhas.
            if (lastInDb.isPresent() && !itemDate.isAfter(lastInDb.get())) {
                // Se a data do item não é posterior à última do banco, já temos esse dado e os anteriores.
                break;
            }

            financialDataService.savePoint(codigo, SOURCE, itemDate, item.valor(), null);
        }
    }




    // BALANÇA DE PAGAMENTOS - (BPM6) (BCB / BP (BPM6))

    @Cacheable(value = "ipea-reservas-ativos", sync = true)
    public List<IpeaSerieDTO> getReserveAssets() {
        return List.of(
                serie(ATIVOS_RESERVA, "Ativos de Reserva Internacional")
        );
    }

    @Cacheable(value = "ipea-transacoes-correntes", sync = true)
    public List<IpeaSerieDTO> getCurrentTransactionsBalance() {
        return List.of(
                serie(TRANSACOES_CORRENTES_SALDO, "Saldo em Transações Correntes")
        );
    }

    @Cacheable(value = "ipea-balanca-comercial", sync = true)
    public List<IpeaSerieDTO> getTradeBalance() {
        return List.of(
                serie(BALANCA_COMERCIAL, "Saldo da Balança Comercial")
        );
    }

    @Cacheable(value = "ipea-servicos", sync = true)
    public List<IpeaSerieDTO> getServicesBalance() {
        return List.of(
                serie(SERVICOS, "Saldo da Conta de Serviços")
        );
    }

    @Cacheable(value = "ipea-renda-primaria", sync = true)
    public List<IpeaSerieDTO> getPrimaryIncome() {
        return List.of(
                serie(RENDA_PRIMARIA, "Saldo da Renda Primária")
        );
    }

    @Cacheable(value = "ipea-investimento-direto", sync = true)
    public List<IpeaSerieDTO> getDirectInvestment() {
        return List.of(
                serie(INVESTIMENTO_DIRETO, "Investimento Direto no País")
        );
    }

    @Cacheable(value = "ipea-conta-capital", sync = true)
    public List<IpeaSerieDTO> getCapitalAccount() {
        return List.of(
                serie(CONTA_CAPITAL, "Saldo da Conta Capital")
        );
    }

    @Cacheable(value = "ipea-conta-financeira", sync = true)
    public List<IpeaSerieDTO> getFinancialAccount() {
        return List.of(
                serie(CONTA_FINANCEIRA, "Saldo da Conta Financeira")
        );
    }


    @Cacheable(value = "ipea-investimento-carteira", sync = true)
    public List<IpeaSerieDTO> getInvestmentWallet() {
        return List.of(
                serie(INVESTIMENTO_CARTEIRA, "Investimento em Carteira")
        );
    }


    @Cacheable(value = "ipea-servicos-despesa", sync = true)
    public List<IpeaSerieDTO> getServicesExpense() {
        return List.of(
                serie(SERVICOS_DESPESA, "Serviços - Despesa")
        );
    }

    @Cacheable(value = "ipea-investimento-direto-ingressos", sync = true)
    public List<IpeaSerieDTO> getDirectInvestmentInflows() {
        return List.of(
                serie(INVESTIMENTO_DIRETO_INGRESSOS,
                        "Investimento Direto no País - Ingressos")
        );
    }

    @Cacheable(value = "ipea-balanca-transacoes-correntes-pib", sync = true)
    public List<IpeaSerieDTO> getCurrentTransactionsPercentagePib() {
        return List.of(serie(TRANSACOES_CORRENTES_PIB, "Balanço de pagamentos: transações correntes (% PIB)"));
    }




    // EXPORTAÇÕES - Comércio Exterior (FUNCEX)
    @Cacheable(value = "ipea-exportacoes-total", sync = true)
    public List<IpeaSerieDTO> getTotalExports() {
        return List.of(
                serie(EXPORTACOES_TOTAL_FOB,
                        "Exportações Totais (FOB)")
        );
    }

    @Cacheable(value = "ipea-quantum-exportacoes", sync = true)
    public List<IpeaSerieDTO> getExportQuantumIndex() {
        return List.of(
                serie(INDICE_QUANTUM_EXPORTACOES,
                        "Índice de Quantum das Exportações")
        );
    }

    @Cacheable(value = "ipea-exportacoes-produtos-basicos", sync = true)
    public List<IpeaSerieDTO> getBasicProductsExports() {
        return List.of(
                serie(EXPORTACOES_PRODUTOS_BASICOS,
                        "Exportações de Produtos Básicos (FOB)")
        );
    }

    // - Categorias grandes.
    @Cacheable(value = "ipea-exportacoes-agricultura-pecuaria-quantum", sync = true)
    public List<IpeaSerieDTO> getAgricultureLivestockQuantumExports() {
        return List.of(serie(AGRICULTURA_E_PECUARIA_QUANTUM, "Índice de Quantum - Agricultura e Pecuária"));
    }

    @Cacheable(value = "ipea-exportacoes-bens-consumo", sync = true)
    public List<IpeaSerieDTO> getConsumerGoodsExports() {
        return List.of(serie(EXPORTACOES_BENS_CONSUMO, "Exportações de Bens de Consumo (FOB)"));
    }

    @Cacheable(value = "ipea-exportacoes-precos-bens-capital", sync = true)
    public List<IpeaSerieDTO> getCapitalGoodsPriceIndex() {
        return List.of(serie(INDICE_PRECOS_BENS_CAPITAL, "Índice de Preços - Bens de Capital"));
    }

    @Cacheable(value = "ipea-exportacoes-precos-bens-duraveis", sync = true)
    public List<IpeaSerieDTO> getDurableConsumerGoodsPriceIndex() {
        return List.of(serie(INDICE_PRECOS_BENS_DURAVEIS, "Índice de Preços - Bens de Consumo Duráveis"));
    }

    @Cacheable(value = "ipea-exportacoes-precos-bens-nao-duraveis", sync = true)
    public List<IpeaSerieDTO> getNonDurableConsumerGoodsPriceIndex() {
        return List.of(serie(INDICE_PRECOS_BENS_NAO_DURAVEIS, "Índice de Preços - Bens de Consumo Não Duráveis"));
    }

    @Cacheable(value = "ipea-exportacoes-valor-bens-intermediarios", sync = true)
    public List<IpeaSerieDTO> getIntermediateGoodsFobValue() {
        return List.of(serie(VALOR_FOB_BENS_INTERMEDIARIOS, "Valor FOB - Bens Intermediários"));
    }

    @Cacheable(value = "ipea-exportacoes-quantum-bens-intermediarios", sync = true)
    public List<IpeaSerieDTO> getIntermediateGoodsQuantumIndex() {
        return List.of(serie(INDICE_QUANTUM_BENS_INTERMEDIARIOS, "Índice de Quantum - Bens Intermediários"));
    }

    @Cacheable(value = "ipea-exportacoes-valor-combustiveis", sync = true)
    public List<IpeaSerieDTO> getFuelsFobValue() {
        return List.of(serie(VALOR_FOB_COMBUSTIVEIS, "Valor FOB - Combustíveis"));
    }


    // Brasil - Ibovespa
    @Cacheable(value = "ipea-ibovespa-fechamento", sync = true)
    public List<IpeaSerieDTO> getIbovespaClosingIndex() {
        return List.of(serie(IBOVESPA_FECHAMENTO, "Índice de ações: Ibovespa - fechamento"));
    }




    // -- IMPOSTOS --
    @Cacheable(value = "ipea-imposto-ii", sync = true)
    public List<IpeaSerieDTO> getImportTax() {
        return List.of(serie(IMPOSTO_II, "Imposto sobre a Importação (II) - Receita Bruta"));
    }

    @Cacheable(value = "ipea-imposto-irpf", sync = true)
    public List<IpeaSerieDTO> getPersonalIncomeTax() {
        return List.of(serie(IMPOSTO_IRPF, "Imposto de Renda (IRPF) - Receita Bruta"));
    }

    @Cacheable(value = "ipea-imposto-irpj", sync = true)
    public List<IpeaSerieDTO> getCorporateIncomeTax() {
        return List.of(serie(IMPOSTO_IRPJ, "Imposto de Renda (IRPJ) - Receita Bruta"));
    }

    @Cacheable(value = "ipea-imposto-ir-total", sync = true)
    public List<IpeaSerieDTO> getTotalIncomeTax() {
        return List.of(serie(IMPOSTO_IR_TOTAL, "Imposto de Renda Total - Receita Bruta"));
    }

    @Cacheable(value = "ipea-imposto-iof", sync = true)
    public List<IpeaSerieDTO> getIofTax() {
        return List.of(serie(IMPOSTO_IOF, "Imposto sobre Operações Financeiras (IOF) - Receita Bruta"));
    }

    @Cacheable(value = "ipea-imposto-ipi", sync = true)
    public List<IpeaSerieDTO> getIpiTax() {
        return List.of(serie(IMPOSTO_IPI, "Imposto sobre Produtos Industrializados (IPI) - Receita Bruta"));
    }

    @Cacheable(value = "ipea-imposto-itr", sync = true)
    public List<IpeaSerieDTO> getItrTax() {
        return List.of(serie(IMPOSTO_ITR, "Imposto sobre a propriedade territorial rural - R$ mi"));
    }



    // Câmbio Contratado
    @Cacheable(value = "ipea-cambio-comercial", sync = true)
    public List<IpeaSerieDTO> getContractedExchangeCommercial() {
        return List.of(serie(CAMBIO_COMERCIAL, "Câmbio contratado - comercial (US$ milhões)"));
    }

    @Cacheable(value = "ipea-cambio-comercial-exportacao", sync = true)
    public List<IpeaSerieDTO> getContractedExchangeCommercialExports() {
        return List.of(serie(CAMBIO_COMERCIAL_EXP, "Câmbio contratado - comercial - exportação (US$ milhões)"));
    }

    @Cacheable(value = "ipea-cambio-comercial-importacao", sync = true)
    public List<IpeaSerieDTO> getContractedExchangeCommercialImports() {
        return List.of(serie(CAMBIO_COMERCIAL_IMP, "Câmbio contratado - comercial - importação (US$ milhões)"));
    }

    @Cacheable(value = "ipea-cambio-comercial-financeiro", sync = true)
    public List<IpeaSerieDTO> getContractedExchangeTotal() {
        return List.of(serie(CAMBIO_COMERCIAL_FINANC, "Câmbio contratado - comercial e financeiro (US$ milhões)"));
    }

    @Cacheable(value = "ipea-cambio-financeiro", sync = true)
    public List<IpeaSerieDTO> getContractedExchangeFinancial() {
        return List.of(serie(CAMBIO_FINANCEIRO, "Câmbio contratado - financeiro (US$ milhões)"));
    }

    @Cacheable(value = "ipea-cambio-financeiro-compra", sync = true)
    public List<IpeaSerieDTO> getContractedExchangeFinancialPurchases() {
        return List.of(serie(CAMBIO_FINANCEIRO_COMPRA, "Câmbio contratado - financeiro - compra (US$ milhões)"));
    }

    @Cacheable(value = "ipea-cambio-financeiro-venda", sync = true)
    public List<IpeaSerieDTO> getContractedExchangeFinancialSales() {
        return List.of(serie(CAMBIO_FINANCEIRO_VENDA, "Câmbio contratado - financeiro - venda (US$ milhões)"));
    }





    // Requisição feita à API baseada no código.
    // As requisições abaixo reutilizam essa função, só o código de série muda.
    private List<IpeaItemDTO> fetchSerie(String codigo) {
        IpeaResponseDTO response = buscarSerie(codigo);

        if (response == null || response.value() == null) {
            throw new IpeaException("Série não encontrada: " + codigo, 404);
        }

        return response.value().stream()
                .filter(item -> item.data() != null)
                .sorted(Comparator.comparing(IpeaItemDTO::data).reversed())
                .toList();
    }

    /**
     * Busca uma série na API do IPEA pelo nome do host ({@link #HOST}), deixando o
     * cliente HTTP resolver o DNS e enviar o cabeçalho {@code Host} — o roteamento
     * por nome do servidor depende disso, e é por isto que não conectamos por IP.
     * O connect e o read timeout do {@code ipeaRestClient} cobrem host lento e
     * resposta pendurada; aqui só registramos o tempo gasto quando falha.
     */
    private IpeaResponseDTO buscarSerie(String codigo) {
        long inicio = System.nanoTime();
        try {
            return restClient.get()
                    .uri("http://" + HOST + PATH.formatted(codigo))
                    .retrieve()
                    .body(IpeaResponseDTO.class);
        } catch (Exception e) {
            log.warn("Falha ao buscar a série {} após {} ms: {}",
                    codigo, millisDesde(inicio), e.toString());
            throw new IpeaException("Erro ao buscar série: " + codigo, 502, e);
        }
    }

    private static long millisDesde(long inicioNanos) {
        return (System.nanoTime() - inicioNanos) / 1_000_000;
    }

}
