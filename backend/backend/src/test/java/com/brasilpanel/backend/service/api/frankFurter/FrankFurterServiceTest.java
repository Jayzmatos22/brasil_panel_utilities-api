package com.brasilpanel.backend.service.api.frankFurter;

import com.brasilpanel.backend.dto.api.frankFurter.FrankfurterRateDTO;
import com.brasilpanel.backend.validators.api.FrankfurterValidator;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * Serviço de câmbio: HTTP puro, sem DB-first. Segue o mesmo molde do ViaCep.
 */
class FrankFurterServiceTest {

    private static final String JSON_TAXA = """
            {
              "amount": 1.0,
              "base": "USD",
              "date": "2026-07-24",
              "rates": { "BRL": 5.43 }
            }
            """;

    private static final String JSON_MOEDAS = """
            {
              "BRL": "Brazilian Real",
              "USD": "United States Dollar",
              "EUR": "Euro"
            }
            """;

    private MockRestServiceServer server;
    private FrankFurterService service;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        service = new FrankFurterService(builder.build(), mock(FrankfurterValidator.class));
    }

    @Test
    @DisplayName("taxa de câmbio é mapeada para o DTO")
    void rateIsMappedToDto() {
        server.expect(requestTo(Matchers.containsString("from=USD&to=BRL")))
                .andRespond(withSuccess(JSON_TAXA, MediaType.APPLICATION_JSON));

        FrankfurterRateDTO taxa = service.returnFrankFurterRate("USD", "BRL", 1.0);

        assertThat(taxa.base()).isEqualTo("USD");
        assertThat(taxa.date()).isEqualTo("2026-07-24");
        assertThat(taxa.rates()).containsEntry("BRL", 5.43);
        server.verify();
    }

    @Test
    @DisplayName("o valor convertido viaja na URL")
    void amountIsSentInTheUrl() {
        server.expect(requestTo(Matchers.containsString("amount=100")))
                .andRespond(withSuccess(JSON_TAXA, MediaType.APPLICATION_JSON));

        service.returnFrankFurterRate("USD", "BRL", 100.0);

        server.verify();
    }

    @Test
    @DisplayName("lista de moedas suportadas é desserializada")
    void supportedCurrenciesAreDeserialized() {
        server.expect(requestTo("https://api.frankfurter.dev/v1/currencies"))
                .andRespond(withSuccess(JSON_MOEDAS, MediaType.APPLICATION_JSON));

        Map<String, String> moedas = service.returnSupportedCurrencies();

        assertThat(moedas).containsEntry("BRL", "Brazilian Real");
        assertThat(moedas).hasSize(3);
    }

    @Test
    @DisplayName("erro da API externa não é silenciado")
    void upstreamErrorIsNotSwallowed() {
        server.expect(requestTo(Matchers.containsString("from=USD")))
                .andRespond(withServerError());

        assertThatThrownBy(() -> service.returnFrankFurterRate("USD", "BRL", 1.0))
                .isInstanceOf(Exception.class);
    }
}