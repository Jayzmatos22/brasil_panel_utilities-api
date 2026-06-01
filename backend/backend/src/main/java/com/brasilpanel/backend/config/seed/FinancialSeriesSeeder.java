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
