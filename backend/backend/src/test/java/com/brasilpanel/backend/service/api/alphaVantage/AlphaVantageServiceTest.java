package com.brasilpanel.backend.service.api.alphaVantage;

import com.brasilpanel.backend.dto.api.alphaVantage.StockQuoteDTO;
import com.brasilpanel.backend.exception.customized.AlphaVantageException;
import com.brasilpanel.backend.model.StockSnapshot;
import com.brasilpanel.backend.service.financial.SnapshotService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * Combina as duas ferramentas: Mockito para o {@link SnapshotService} (a fonte
 * DB-first) e {@link MockRestServiceServer} para a chamada HTTP.
 *
 * <p>É o serviço com a lógica mais densa do projeto — cache em banco, rotação de
 * chaves e degradação graciosa quando a cota da API acaba.
 */
class AlphaVantageServiceTest {

    private static final String SIMBOLO = "AAPL";

    private static final String JSON_COTACAO = """
            {
              "Global Quote": {
                "01. symbol": "AAPL",
                "02. open": "150.00",
                "03. high": "155.00",
                "04. low": "149.00",
                "05. price": "154.50",
                "06. volume": "1000000",
                "07. latest trading day": "2026-07-24",
                "08. previous close": "150.50",
                "09. change": "4.00",
                "10. change percent": "2.6578%"
              }
            }
            """;

    private MockRestServiceServer server;
    private SnapshotService snapshotService;
    private AlphaVantageService service;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        snapshotService = mock(SnapshotService.class);

        service = new AlphaVantageService(builder.build(), new ObjectMapper(), snapshotService);
        // Duas chaves para observar a rotação; valores sintéticos.
        ReflectionTestUtils.setField(service, "apiKeys", List.of("CHAVE-1", "CHAVE-2"));
    }

    /**
     * Snapshot real, não mock: entidade é objeto de valor, e mockar getters aqui
     * só tornaria o teste frágil sem isolar nada.
     */
    private StockSnapshot snapshot(LocalDateTime coletadoEm) {
        return StockSnapshot.builder()
                .symbol(SIMBOLO)
                .tradingDay(LocalDate.of(2026, 7, 20))
                .price(new BigDecimal("140.00"))
                .changePercent(new BigDecimal("1.50"))
                .fetchedAt(coletadoEm)
                .build();
    }

    // ── DB-first ─────────────────────────────────────────────────────────────

    @Nested
    class LeituraDoBanco {

        @Test
        @DisplayName("snapshot recente é servido do banco, sem tocar na API")
        void freshSnapshotSkipsTheApi() {
            when(snapshotService.getLatestStock(SIMBOLO))
                    .thenReturn(Optional.of(snapshot(LocalDateTime.now().minusMinutes(30))));

            StockQuoteDTO cotacao = service.getStockQuote(SIMBOLO);

            assertThat(cotacao.price()).isEqualTo(140.00);
            // O ponto do DB-first: economizar a cota diária da API.
            server.verify();   // nenhuma requisição foi registrada
            verify(snapshotService, never()).saveStock(any());
        }

        @Test
        @DisplayName("snapshot vencido força nova busca na API")
        void staleSnapshotTriggersApiCall() {
            when(snapshotService.getLatestStock(SIMBOLO))
                    .thenReturn(Optional.of(snapshot(LocalDateTime.now().minusHours(5))));
            server.expect(requestTo(Matchers.containsString("symbol=AAPL")))
                    .andRespond(withSuccess(JSON_COTACAO, MediaType.APPLICATION_JSON));

            StockQuoteDTO cotacao = service.getStockQuote(SIMBOLO);

            assertThat(cotacao.price()).isEqualTo(154.50);
            verify(snapshotService).saveStock(cotacao);
            server.verify();
        }

        @Test
        @DisplayName("símbolo é normalizado antes de consultar o banco")
        void symbolIsNormalized() {
            when(snapshotService.getLatestStock(SIMBOLO))
                    .thenReturn(Optional.of(snapshot(LocalDateTime.now().minusMinutes(10))));

            service.getStockQuote("  aapl  ");

            verify(snapshotService).getLatestStock(SIMBOLO);
        }
    }

    // ── Degradação quando a API falha ────────────────────────────────────────

    @Nested
    class QuandoAApiFalha {

        @Test
        @DisplayName("limite de cota atingido serve o snapshot antigo em vez de falhar")
        void rateLimitFallsBackToStaleSnapshot() {
            when(snapshotService.getLatestStock(SIMBOLO))
                    .thenReturn(Optional.of(snapshot(LocalDateTime.now().minusHours(5))));
            server.expect(requestTo(Matchers.containsString("symbol=AAPL")))
                    .andRespond(withSuccess("""
                            {"Information": "rate limit is 25 requests per day"}
                            """, MediaType.APPLICATION_JSON));

            StockQuoteDTO cotacao = service.getStockQuote(SIMBOLO);

            // Dado velho é melhor que erro na tela: preço vem do banco.
            assertThat(cotacao.price()).isEqualTo(140.00);
            verify(snapshotService, never()).saveStock(any());
        }

        @Test
        @DisplayName("sem snapshot no banco, o limite de cota vira erro")
        void rateLimitWithoutSnapshotThrows() {
            when(snapshotService.getLatestStock(SIMBOLO)).thenReturn(Optional.empty());
            server.expect(requestTo(Matchers.containsString("symbol=AAPL")))
                    .andRespond(withSuccess("""
                            {"Information": "rate limit is 25 requests per day"}
                            """, MediaType.APPLICATION_JSON));

            assertThatThrownBy(() -> service.getStockQuote(SIMBOLO))
                    .isInstanceOf(AlphaVantageException.class)
                    .hasMessageContaining("Limite");
        }

        @Test
        @DisplayName("símbolo inexistente sem snapshot vira erro")
        void unknownSymbolThrows() {
            when(snapshotService.getLatestStock("XPTO")).thenReturn(Optional.empty());
            server.expect(requestTo(Matchers.containsString("symbol=XPTO")))
                    .andRespond(withSuccess("""
                            {"Error Message": "Invalid API call"}
                            """, MediaType.APPLICATION_JSON));

            assertThatThrownBy(() -> service.getStockQuote("XPTO"))
                    .isInstanceOf(AlphaVantageException.class);
        }
    }

    // ── Rotação de chaves ────────────────────────────────────────────────────

    @Test
    @DisplayName("chamadas consecutivas alternam entre as chaves configuradas")
    void consecutiveCallsRotateApiKeys() {
        when(snapshotService.getLatestStock(any())).thenReturn(Optional.empty());

        // A chave viaja na URL: se a rotação não acontecer, o segundo expect não casa.
        server.expect(requestTo(Matchers.containsString("apikey=CHAVE-1")))
                .andRespond(withSuccess(JSON_COTACAO, MediaType.APPLICATION_JSON));
        server.expect(requestTo(Matchers.containsString("apikey=CHAVE-2")))
                .andRespond(withSuccess(JSON_COTACAO, MediaType.APPLICATION_JSON));

        service.getStockQuote(SIMBOLO);
        service.getStockQuote(SIMBOLO);

        server.verify();
    }
}