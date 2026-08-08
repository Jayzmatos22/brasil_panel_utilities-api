package com.brasilpanel.backend.service.api.bcb;

import com.brasilpanel.backend.dto.api.bcb.SelicDataDTO;
import com.brasilpanel.backend.exception.customized.BcbApiException;
import com.brasilpanel.backend.model.FinancialDataPoint;
import com.brasilpanel.backend.service.financial.FinancialDataService;
import com.brasilpanel.backend.validators.api.BcbValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.ExpectedCount.manyTimes;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.anything;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;

/**
 * O {@code getSelic()} é DB-first: monta o DTO a partir dos pontos já salvos e só
 * chama a API do BCB quando o banco está incompleto. O caminho quente, portanto,
 * não envolve HTTP — é Mockito sobre o {@link FinancialDataService}.
 *
 * <p>Séries envolvidas: 432 (meta anual), 1178 (acumulado no mês), 4189 (acumulado
 * no ano) e 4390 (série mensal, usada para compor os 12 meses).
 */
class BcbServiceTest {

    private static final String FONTE = "BCB";

    private MockRestServiceServer server;
    private FinancialDataService financialDataService;
    private BcbService bcbService;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        financialDataService = mock(FinancialDataService.class);

        bcbService = new BcbService(builder.build(), mock(BcbValidator.class), financialDataService);
    }

    /**
     * Hoje nunca está vencido em nenhuma periodicidade, então prende o fixture ao
     * caminho "banco em dia" sem depender do dia em que a suíte roda. Uma data fixa
     * aqui envelhece: com a checagem de idade em vigor, ela vence e o serviço passa
     * a ir à API, que não é o que estes casos querem exercitar.
     */
    private FinancialDataPoint ponto(String valor) {
        return ponto(valor, LocalDate.now());
    }

    private FinancialDataPoint ponto(String valor, LocalDate data) {
        return FinancialDataPoint.builder()
                .referenceDate(data)
                .value(new BigDecimal(valor))
                .build();
    }

    /** 12 pontos mensais de mesmo valor — deixa o composto determinístico. */
    private List<FinancialDataPoint> dozePontosDe(String valor) {
        List<FinancialDataPoint> pontos = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            pontos.add(ponto(valor));
        }
        return pontos;
    }

    private void bancoCompleto(List<FinancialDataPoint> historico) {
        bancoCompletoEm(LocalDate.now(), historico);
    }

    private void bancoCompletoEm(LocalDate data, List<FinancialDataPoint> historico) {
        when(financialDataService.getLastPoint("432", FONTE)).thenReturn(Optional.of(ponto("15.00", data)));
        when(financialDataService.getLastPoint("1178", FONTE)).thenReturn(Optional.of(ponto("1.10", data)));
        when(financialDataService.getLastPoint("4189", FONTE)).thenReturn(Optional.of(ponto("7.80", data)));
        when(financialDataService.getRecentPoints("4390", FONTE, 12)).thenReturn(historico);
    }

    @Test
    @DisplayName("com o banco completo, monta o DTO sem chamar a API")
    void servesFromDatabaseWithoutCallingTheApi() {
        bancoCompleto(dozePontosDe("1.00"));

        SelicDataDTO selic = bcbService.getSelic();

        assertThat(selic.currentRate()).isEqualTo(15.00);
        assertThat(selic.accumulatedMonth()).isEqualTo(1.10);
        assertThat(selic.accumulatedYear()).isEqualTo(7.80);
        // Nenhuma requisição foi registrada: se houvesse chamada, verify() falharia.
        server.verify();
    }

    @Test
    @DisplayName("com o banco vencido e a API fora, serve o banco em vez de derrubar a resposta")
    void servesStaleDatabaseWhenApiIsDown() {
        // Antes da checagem de idade este caminho não existia: o banco vencido caía no
        // refresh e a falha da API virava 502, descartando dado perfeitamente utilizável.
        bancoCompletoEm(LocalDate.of(2020, 1, 2), dozePontosDe("1.00"));
        server.expect(manyTimes(), anything()).andRespond(withServerError());

        SelicDataDTO selic = bcbService.getSelic();

        assertThat(selic.currentRate())
                .as("dado velho identificado no log é melhor que erro para o painel")
                .isEqualTo(15.00);
    }

    @Test
    @DisplayName("sem nada no banco e com a API fora, a falha sobe")
    void failsWhenApiIsDownAndDatabaseIsEmpty() {
        when(financialDataService.getLastPoint(anyString(), anyString())).thenReturn(Optional.empty());
        when(financialDataService.getRecentPoints(anyString(), anyString(), anyInt()))
                .thenReturn(List.of());
        server.expect(manyTimes(), anything()).andRespond(withServerError());

        assertThatThrownBy(() -> bcbService.getSelic())
                .as("sem dado local não há o que degradar — mascarar isso entregaria "
                        + "resposta vazia como se fosse legítima")
                .isInstanceOf(BcbApiException.class);
    }

    @Test
    @DisplayName("acumulado de 12 meses é composto, não somado")
    void twelveMonthAccumulationIsCompounded() {
        // 12 meses de 1% compostos = 12,68% — a soma simples daria 12,00%.
        bancoCompleto(dozePontosDe("1.00"));

        SelicDataDTO selic = bcbService.getSelic();

        assertThat(selic.last12MonthsCompound()).isEqualTo(12.68);
    }

    @Test
    @DisplayName("histórico incompleto não é usado: recorre à API")
    void incompleteHistoryFallsBackToTheApi() {
        // Só 11 pontos: compor com histórico parcial daria um número errado.
        bancoCompleto(dozePontosDe("1.00").subList(0, 11));
        server.expect(manyTimes(), anything()).andRespond(withServerError());

        assertThatThrownBy(() -> bcbService.getSelic())
                .isInstanceOf(BcbApiException.class);
    }

    @Test
    @DisplayName("ponto ausente no banco também recorre à API")
    void missingPointFallsBackToTheApi() {
        when(financialDataService.getLastPoint("432", FONTE)).thenReturn(Optional.of(ponto("15.00")));
        when(financialDataService.getLastPoint("1178", FONTE)).thenReturn(Optional.of(ponto("1.10")));
        when(financialDataService.getLastPoint("4189", FONTE)).thenReturn(Optional.empty());
        server.expect(manyTimes(), anything()).andRespond(withServerError());

        assertThatThrownBy(() -> bcbService.getSelic())
                .isInstanceOf(BcbApiException.class);

        // Sem os três pontos, nem tenta montar o histórico.
        verify(financialDataService, never()).getRecentPoints(anyString(), anyString(), anyInt());
    }
}