package com.brasilpanel.backend.config.seed;

import com.brasilpanel.backend.model.FinancialSeries;
import com.brasilpanel.backend.repository.financial.FinancialSeriesRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Garante que as séries financeiras conhecidas existam no banco.
 * Executado uma vez na inicialização — idempotente.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FinancialSeriesSeeder implements ApplicationRunner {

    private final FinancialSeriesRepository seriesRepository;

    private static final List<FinancialSeries> KNOWN_SERIES = List.of(

        // ── BCB ───────────────────────────────────────────────────────────
        FinancialSeries.builder()
                .code("12").source("BCB").name("CDI Diário")
                .unit("% a.d.").description("Taxa CDI diária divulgada pelo Banco Central")
                .build(),

        FinancialSeries.builder()
                .code("432").source("BCB").name("SELIC Diária")
                .unit("% a.d.").description("Taxa SELIC diária efetiva")
                .build(),

        FinancialSeries.builder()
                .code("1178").source("BCB").name("SELIC Mensal")
                .unit("% a.m.").description("Taxa SELIC acumulada no mês")
                .build(),

        FinancialSeries.builder()
                .code("4189").source("BCB").name("SELIC Anual")
                .unit("% a.a.").description("Meta SELIC anualizada")
                .build(),

        FinancialSeries.builder()
                .code("4390").source("BCB").name("SELIC Meta")
                .unit("% a.a.").description("Meta da taxa SELIC definida pelo COPOM")
                .build(),

        FinancialSeries.builder()
                .code("433").source("BCB").name("IPCA Mensal")
                .unit("% a.m.").description("Variação mensal do IPCA")
                .build(),

        FinancialSeries.builder()
                .code("13522").source("BCB").name("IPCA Acumulado Ano")
                .unit("% a.a.").description("IPCA acumulado no ano corrente")
                .build(),

        FinancialSeries.builder()
                .code("1").source("BCB").name("Dólar PTAX")
                .unit("R$").description("Taxa de câmbio USD/BRL — PTAX venda (BCB)")
                .build(),

        FinancialSeries.builder()
                .code("1619").source("BCB").name("Salário Mínimo")
                .unit("R$").description("Valor nominal do salário mínimo vigente")
                .build(),

        // ── IPEA ──────────────────────────────────────────────────────────
        // Emprego
        FinancialSeries.builder()
                .code("PNADC12_NDESOCM12").source("IPEA").name("Taxa de desocupação")
                .unit("%").description("Taxa de desocupação (PNAD Contínua)")
                .build(),
        FinancialSeries.builder()
                .code("PNADC12_NOCUP12").source("IPEA").name("Nível de ocupação")
                .unit("%").description("Nível de ocupação (PNAD Contínua)")
                .build(),

        // Renda
        FinancialSeries.builder()
                .code("GAC12_SALMINRE12").source("IPEA").name("Salário mínimo real")
                .unit("R$").description("Salário mínimo real")
                .build(),
        FinancialSeries.builder()
                .code("GAC12_SALMINDOL12").source("IPEA").name("Salário mínimo PPC")
                .unit("USD").description("Salário mínimo em paridade de poder de compra")
                .build(),
        FinancialSeries.builder()
                .code("PNADS_RENDAMEDIA").source("IPEA").name("Renda per capita")
                .unit("R$").description("Renda domiciliar per capita")
                .build(),

        // Desigualdade
        FinancialSeries.builder()
                .code("PNADS_GINI").source("IPEA").name("Coeficiente de Gini")
                .unit("índice").description("Coeficiente de Gini")
                .build(),
        FinancialSeries.builder()
                .code("PNADS_PERCPOBRE300").source("IPEA").name("Taxa de pobreza")
                .unit("%").description("Taxa de pobreza (PPC$3/dia)")
                .build(),

        // Macro
        FinancialSeries.builder()
                .code("WEO_PIBWEOBRA").source("IPEA").name("PIB (FMI)")
                .unit("US$ bilhões").description("PIB segundo o World Economic Outlook (FMI)")
                .build(),
        FinancialSeries.builder()
                .code("WEO_INVESTWEOBRA").source("IPEA").name("Investimento")
                .unit("% PIB").description("Investimento como % do PIB (FMI)")
                .build(),
        FinancialSeries.builder()
                .code("WEO_DESEMWEOBRA").source("IPEA").name("Taxa de desemprego (FMI)")
                .unit("%").description("Taxa de desemprego segundo o FMI")
                .build(),
        FinancialSeries.builder()
                .code("PAN12_TJOVER12").source("IPEA").name("Taxa Selic/Overnight")
                .unit("% a.a.").description("Taxa Selic/Overnight")
                .build(),
        FinancialSeries.builder()
                .code("BM12_RES12").source("IPEA").name("Reservas internacionais")
                .unit("US$ milhões").description("Reservas internacionais")
                .build(),
        FinancialSeries.builder()
                .code("SRF12_TOTGER12").source("IPEA").name("Arrecadação federal")
                .unit("R$ milhões").description("Arrecadação federal total")
                .build(),

        // Preços
        FinancialSeries.builder()
                .code("PRECOS12_INPC12").source("IPEA").name("INPC")
                .unit("índice").description("INPC - índice")
                .build(),
        FinancialSeries.builder()
                .code("IGP12_IGPM12").source("IPEA").name("IGP-M")
                .unit("índice").description("IGP-M - índice")
                .build(),

        // População
        FinancialSeries.builder()
                .code("PNADC12_POP12").source("IPEA").name("População total")
                .unit("mil pessoas").description("População total (PNAD Contínua)")
                .build(),
        FinancialSeries.builder()
                .code("DEPIS_POPP").source("IPEA").name("Projeção população total")
                .unit("pessoas").description("Projeção da população total")
                .build(),
        FinancialSeries.builder()
                .code("DEPIS_POPHP").source("IPEA").name("Projeção população homens")
                .unit("pessoas").description("Projeção da população - homens")
                .build(),
        FinancialSeries.builder()
                .code("DEPIS_POPMP").source("IPEA").name("Projeção população mulheres")
                .unit("pessoas").description("Projeção da população - mulheres")
                .build(),

        // Balanço de Pagamentos

        FinancialSeries.builder()
                .code("BPAG12_AR12")
                .source("IPEA")
                .name("Ativos de Reserva")
                .unit("US$ milhões")
                .description("Ativos de reserva internacionais")
                .build(),

        FinancialSeries.builder()
                .code("BPAG12_TC12")
                .source("IPEA")
                .name("Transações Correntes")
                .unit("US$ milhões")
                .description("Saldo das transações correntes")
                .build(),

        FinancialSeries.builder()
                .code("BPAG12_BC12")
                .source("IPEA")
                .name("Balança Comercial")
                .unit("US$ milhões")
                .description("Saldo da balança comercial")
                .build(),

        FinancialSeries.builder()
                .code("BPAG12_SER12")
                .source("IPEA")
                .name("Serviços")
                .unit("US$ milhões")
                .description("Balanço de serviços")
                .build(),

        FinancialSeries.builder()
                .code("BPAG12_RP12")
                .source("IPEA")
                .name("Renda Primária")
                .unit("US$ milhões")
                .description("Fluxos de renda primária")
                .build(),

        FinancialSeries.builder()
                .code("BPAG12_IDE12")
                .source("IPEA")
                .name("Investimento Direto")
                .unit("US$ milhões")
                .description("Investimento direto no país")
                .build(),

        FinancialSeries.builder()
                .code("BPAG12_CK12")
                .source("IPEA")
                .name("Conta Capital")
                .unit("US$ milhões")
                .description("Conta capital")
                .build(),

        FinancialSeries.builder()
                .code("BPAG12_CF12")
                .source("IPEA")
                .name("Conta Financeira")
                .unit("US$ milhões")
                .description("Conta financeira")
                .build(),

        FinancialSeries.builder()
                .code("BPAG12_ICAAA12")
                .source("IPEA")
                .name("Investimento em Carteira")
                .unit("US$ milhões")
                .description("Investimento em carteira registrado no balanço de pagamentos")
                .build(),

        FinancialSeries.builder()
                .code("BPAG12_SERD12")
                .source("IPEA")
                .name("Serviços - Despesas")
                .unit("US$ milhões")
                .description("Despesas da conta de serviços do balanço de pagamentos")
                .build(),

        FinancialSeries.builder()
                .code("BPAG12_IDPI12")
                .source("IPEA")
                .name("Investimento Direto no País - Ingressos")
                .unit("US$ milhões")
                .description("Ingressos de investimento direto no país")
                .build()
    );

    @Override
    public void run(ApplicationArguments args) {
        int created = 0;
        for (FinancialSeries series : KNOWN_SERIES) {
            if (!seriesRepository.existsByCodeAndSource(series.getCode(), series.getSource())) {
                seriesRepository.save(series);
                created++;
            }
        }
        if (created > 0) {
            log.info("FinancialSeriesSeeder: {} séries criadas no banco.", created);
        } else {
            log.debug("FinancialSeriesSeeder: todas as séries já existem.");
        }
    }
}
