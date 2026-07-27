package com.brasilpanel.backend.service.api.worlBank;

import com.brasilpanel.backend.dto.api.worldbank.PibBrasilDTO;
import com.brasilpanel.backend.exception.customized.WorldBankException;
import com.brasilpanel.backend.model.PibSnapshot;
import com.brasilpanel.backend.service.financial.SnapshotService;
import com.brasilpanel.backend.validators.api.WorldBankValidator;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * PIB de anos passados nunca muda, então o DB-first aqui é quase sempre suficiente.
 * O filtro por moeda existe para descartar snapshots gravados antes da mudança
 * para BRL — servir esses valores misturaria escalas no gráfico.
 */
class WorldBankServiceTest {

    private static final String MOEDA = "BRL";

    private MockRestServiceServer server;
    private SnapshotService snapshotService;
    private WorldBankValidator validator;
    private WorldBankService service;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        snapshotService = mock(SnapshotService.class);
        validator = mock(WorldBankValidator.class);

        service = new WorldBankService(builder.build(), validator, snapshotService);
    }

    private PibSnapshot snapshot(int ano, String moeda) {
        return PibSnapshot.builder()
                .year(ano)
                .value(new BigDecimal("11000000000000"))
                .currency(moeda)
                .build();
    }

    private List<PibSnapshot> serie(int quantidade, String moeda) {
        List<PibSnapshot> lista = new ArrayList<>();
        for (int i = 0; i < quantidade; i++) {
            lista.add(snapshot(2026 - i, moeda));
        }
        return lista;
    }

    @Test
    @DisplayName("série com dados suficientes é servida do banco")
    void sufficientSeriesIsServedFromDatabase() {
        when(snapshotService.getPibSeries(MOEDA)).thenReturn(serie(10, MOEDA));

        List<PibBrasilDTO> serie = service.getPibSeries();

        assertThat(serie).hasSize(10);
        assertThat(serie.getFirst().currency()).isEqualTo(MOEDA);
        server.verify();   // nenhuma requisição registrada
    }

    @Test
    @DisplayName("série curta demais recorre à API")
    void tooShortSeriesFallsBackToTheApi() {
        // Menos de 10 anos não sustenta o gráfico: vale gastar uma requisição.
        when(snapshotService.getPibSeries(MOEDA)).thenReturn(serie(3, MOEDA));
        server.expect(requestTo(Matchers.containsString("api.worldbank.org")))
                .andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.getPibSeries())
                .isInstanceOf(Exception.class);

        server.verify();
    }

    @Test
    @DisplayName("PIB atual vem do banco quando o snapshot está na moeda corrente")
    void currentPibComesFromDatabaseWhenCurrencyMatches() {
        when(snapshotService.getLatestPib()).thenReturn(Optional.of(snapshot(2026, MOEDA)));

        PibBrasilDTO pib = service.getCurrentPib();

        assertThat(pib.year()).isEqualTo("2026");
        assertThat(pib.currency()).isEqualTo(MOEDA);
        server.verify();
    }

    @Test
    @DisplayName("snapshot em moeda antiga é descartado e força nova busca")
    void snapshotInLegacyCurrencyIsDiscarded() {
        // Valor em USD não pode ser servido como se fosse BRL.
        when(snapshotService.getLatestPib()).thenReturn(Optional.of(snapshot(2026, "USD")));
        server.expect(requestTo(Matchers.containsString("api.worldbank.org")))
                .andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.getCurrentPib())
                .isInstanceOf(Exception.class);

        server.verify();
    }

    @Test
    @DisplayName("ano inválido é barrado pelo validador antes de consultar o banco")
    void invalidYearIsRejectedBeforeTouchingTheDatabase() {
        doThrow(new WorldBankException("Ano inválido", 400))
                .when(validator).validYear(1800);

        assertThatThrownBy(() -> service.getPibByYear(1800))
                .isInstanceOf(WorldBankException.class);

        verify(snapshotService, never()).getPibByYear(anyInt());
    }
}