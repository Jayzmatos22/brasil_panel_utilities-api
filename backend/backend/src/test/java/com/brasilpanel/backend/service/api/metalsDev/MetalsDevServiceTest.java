package com.brasilpanel.backend.service.api.metalsDev;

import com.brasilpanel.backend.dto.api.metalsDev.MetalsDataDTO;
import com.brasilpanel.backend.exception.customized.MetalsException;
import com.brasilpanel.backend.service.financial.SnapshotService;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * A cota da Metals.dev é de ~100 requisições por mês — por isso o DB-first aqui
 * não é otimização, é o que mantém o painel funcionando.
 */
class MetalsDevServiceTest {

    private static final String JSON_METAIS = """
            {
              "status": "success",
              "currency": "BRL",
              "unit": "toz",
              "metals": {
                "gold": 12000.50,
                "silver": 150.25,
                "platinum": 5000.00,
                "palladium": 4800.00,
                "copper": 30.10,
                "aluminum": 12.75,
                "nickel": 90.40,
                "zinc": 15.60
              },
              "timestamps": { "metal": "2026-07-24T18:00:00Z" }
            }
            """;

    private MockRestServiceServer server;
    private SnapshotService snapshotService;
    private MetalsDevService service;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        snapshotService = mock(SnapshotService.class);

        service = new MetalsDevService(builder.build(), snapshotService);
        ReflectionTestUtils.setField(service, "apiKey", "CHAVE-TESTE");
    }

    @Test
    @DisplayName("banco vazio busca na API e mapeia os metais")
    void emptyDatabaseFetchesFromApi() {
        when(snapshotService.getLatestMetals()).thenReturn(Optional.empty());
        server.expect(requestTo(Matchers.containsString("api.metals.dev")))
                .andRespond(withSuccess(JSON_METAIS, MediaType.APPLICATION_JSON));

        MetalsDataDTO metais = service.getMetals();

        assertThat(metais.gold()).isEqualTo(12000.50);
        assertThat(metais.silver()).isEqualTo(150.25);
        server.verify();
    }

    @Test
    @DisplayName("a chave da API viaja na URL")
    void apiKeyTravelsInTheUrl() {
        when(snapshotService.getLatestMetals()).thenReturn(Optional.empty());
        server.expect(requestTo(Matchers.containsString("api_key=CHAVE-TESTE")))
                .andRespond(withSuccess(JSON_METAIS, MediaType.APPLICATION_JSON));

        service.getMetals();

        server.verify();
    }

    @Test
    @DisplayName("preços são pedidos em reais, por onça troy")
    void pricesAreRequestedInBrlPerTroyOunce() {
        when(snapshotService.getLatestMetals()).thenReturn(Optional.empty());
        server.expect(requestTo(Matchers.allOf(
                        Matchers.containsString("currency=BRL"),
                        Matchers.containsString("unit=toz"))))
                .andRespond(withSuccess(JSON_METAIS, MediaType.APPLICATION_JSON));

        service.getMetals();

        server.verify();
    }

    @Test
    @DisplayName("status diferente de success vira erro, não dado inválido")
    void nonSuccessStatusBecomesAnError() {
        when(snapshotService.getLatestMetals()).thenReturn(Optional.empty());
        server.expect(requestTo(Matchers.containsString("api.metals.dev")))
                .andRespond(withSuccess("""
                        {"status": "failure", "metals": {"gold": 0}, "timestamps": {"metal": ""}}
                        """, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.getMetals())
                .isInstanceOf(MetalsException.class);
    }
}