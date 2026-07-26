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

    private FinancialDataPoint ponto(String valor) {
        return FinancialDataPoint.builder()
                .referenceDate(LocalDate.of(2026, 7, 20))
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
        when(financialDataService.getLastPoint("432", FONTE)).thenReturn(Optional.of(ponto("15.00")));
        when(financialDataService.getLastPoint("1178", FONTE)).thenReturn(Optional.of(ponto("1.10")));
        when(financialDataService.getLastPoint("4189", FONTE)).thenReturn(Optional.of(ponto("7.80")));
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