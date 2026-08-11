package com.brasilpanel.backend.service.api.ipea;

import com.brasilpanel.backend.dto.api.ipea.IpeaSerieDTO;
import com.brasilpanel.backend.exception.customized.IpeaException;
import com.brasilpanel.backend.model.FinancialDataPoint;
import com.brasilpanel.backend.service.financial.FinancialDataService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Cobre o fan-out que busca em paralelo as séries de um mesmo endpoint.
 *
 * <p>Nenhum caso aqui toca a rede. O caminho DB-first serve do banco quando há
 * ponto recente, então mockar o {@link FinancialDataService} basta para exercitar
 * a paralelização inteira — e evita depender do DNS do ipeadata.gov.br, que o
 * serviço resolve de verdade para montar os endereços candidatos. Um teste que
 * precisasse de resolução de nome falharia offline e no CI.
 *
 * <p>O {@code @Cacheable} não participa: sem proxy do Spring, cada chamada executa
 * o método de fato, que é justamente o que se quer medir.
 */
class IpeaServiceTest {

    private static final String SOURCE = "IPEA";

    /** Reservas internacionais — a segunda das quatro séries de {@code getMacro}. */
    private static final String RESERVAS = "BM12_RES12";

    /** Atraso simulado por série, para o caso de paralelismo. */
    private static final long ATRASO_POR_SERIE_MS = 300;

    private FinancialDataService financialDataService;
    private IpeaService ipeaService;

    @BeforeEach
    void setUp() {
        financialDataService = mock(FinancialDataService.class);
        // Cliente inerte: nenhum caso deste arquivo chega a fazer requisição.
        ipeaService = new IpeaService(RestClient.builder().build(), financialDataService);
    }

    // ── Ordem ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("séries buscadas em paralelo voltam na ordem declarada")
    void parallelFetchPreservesDeclaredOrder() {
        when(financialDataService.getAllPoints(anyString(), eq(SOURCE)))
                .thenReturn(List.of(ponto("1")));

        List<IpeaSerieDTO> series = ipeaService.getMacro();

        assertThat(series)
                .as("getMacro declara Selic, reservas, arrecadação e desocupação — nesta ordem")
                .extracting(IpeaSerieDTO::nome)
                .containsExactly(
                        "Taxa Selic/Overnight (% a.a.)",
                        "Reservas internacionais (US$ milhões)",
                        "Arrecadação federal (R$ milhões)",
                        "Taxa de desocupação - 14 anos e acima");
    }

    // ── Paralelismo ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("as quatro séries de getMacro são buscadas ao mesmo tempo, não em fila")
    void macroFetchesSeriesConcurrently() {
        when(financialDataService.getAllPoints(anyString(), eq(SOURCE)))
                .thenAnswer(inv -> {
                    Thread.sleep(ATRASO_POR_SERIE_MS);
                    return List.of(ponto("1"));
                });

        long inicio = System.nanoTime();
        ipeaService.getMacro();
        long decorrido = (System.nanoTime() - inicio) / 1_000_000;

        // Em fila seriam 4 x 300 = 1200 ms; em paralelo, ~300 ms. O teto de 900 ms
        // deixa folga para agendamento de thread sem deixar passar a versão
        // sequencial, que não tem como terminar antes de 1200 ms.
        assertThat(decorrido)
                .as("4 séries de %d ms cada; sequencial não termina antes de %d ms",
                        ATRASO_POR_SERIE_MS, 4 * ATRASO_POR_SERIE_MS)
                .isLessThan(900);
    }

    @Test
    @DisplayName("endpoint de série única continua funcionando fora do executor")
    void singleSeriesEndpointStillWorks() {
        when(financialDataService.getAllPoints(anyString(), eq(SOURCE)))
                .thenReturn(List.of(ponto("42")));

        List<IpeaSerieDTO> series = ipeaService.getMonthlyPib();

        assertThat(series).hasSize(1);
        assertThat(series.get(0).dados()).isNotEmpty();
    }

    // ── Propagação de erro ───────────────────────────────────────────────────

    @Test
    @DisplayName("IpeaException atravessa o fan-out sem virar CompletionException")
    void ipeaExceptionSurvivesFanOut() {
        // Sem desembrulhar a causa, o CompletableFuture.join entregaria uma
        // CompletionException — o GlobalExceptionHandler perderia o mapeamento da
        // IpeaException e o cliente receberia 500 em vez do status correto.
        when(financialDataService.getAllPoints(anyString(), eq(SOURCE)))
                .thenThrow(new IpeaException("fonte fora do ar", 502));

        assertThatThrownBy(() -> ipeaService.getMacro())
                .isInstanceOf(IpeaException.class)
                .hasMessageContaining("fonte fora do ar");
    }

    @Test
    @DisplayName("falha de uma série derruba o endpoint, em vez de devolver resposta parcial")
    void oneFailingSeriesFailsTheEndpoint() {
        // Resposta parcial seria pior que erro: o painel plotaria um recorte do
        // dado como se fosse a série completa.
        when(financialDataService.getAllPoints(anyString(), eq(SOURCE)))
                .thenAnswer(inv -> {
                    String codigo = inv.getArgument(0);
                    if (codigo.equals(RESERVAS)) {
                        throw new IpeaException("série indisponível: " + codigo, 502);
                    }
                    return List.of(ponto("1"));
                });

        assertThatThrownBy(() -> ipeaService.getMacro())
                .isInstanceOf(IpeaException.class)
                .hasMessageContaining(RESERVAS);
    }

    // ── Fixtures ─────────────────────────────────────────────────────────────

    /**
     * Ponto de hoje: nunca vencido em periodicidade mensal, o que prende os casos ao
     * caminho "banco em dia" sem depender do dia em que a suíte roda.
     */
    private FinancialDataPoint ponto(String valor) {
        return FinancialDataPoint.builder()
                .referenceDate(LocalDate.now())
                .value(new BigDecimal(valor))
                .build();
    }
}
