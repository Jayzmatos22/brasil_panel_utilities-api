package com.brasilpanel.backend.service.api.coinMarketCap;

import com.brasilpanel.backend.dto.api.coinMarketCap.CmcGlobalDTO;
import com.brasilpanel.backend.dto.api.coinMarketCap.CmcMarketDTO;
import com.brasilpanel.backend.exception.customized.CoinMarketCapException;
import com.brasilpanel.backend.exception.customized.CoinMarketCapNotFoundException;
import com.brasilpanel.backend.model.CmcCryptoSnapshot;
import com.brasilpanel.backend.service.financial.SnapshotService;
import com.brasilpanel.backend.validators.api.CryptoCoinMarketCap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * O plano Basic da CoinMarketCap tem teto mensal de créditos, então a leitura serve
 * do banco sempre que possível — a API só entra quando o batch não existe ou quando
 * a moeda buscada está fora do ranking acompanhado.
 */
class CoinMarketCapServiceTest {

    private static final String JSON_LISTINGS = """
            {
              "status": {"error_code": 0, "error_message": null, "credit_count": 1, "total_count": 8100},
              "data": [
                {
                  "id": 1, "name": "Bitcoin", "symbol": "BTC", "slug": "bitcoin", "cmc_rank": 1,
                  "circulating_supply": 19800000.0, "total_supply": 19800000.0, "max_supply": 21000000.0,
                  "quote": {"BRL": {
                    "price": 326036.27, "volume_24h": 145234985121.83,
                    "percent_change_1h": 0.1458, "percent_change_24h": -0.594,
                    "percent_change_7d": -3.795, "market_cap": 6541245267892.74,
                    "market_cap_dominance": 58.6704
                  }}
                }
              ]
            }
            """;

    private static final String JSON_ERROR = """
            {
              "status": {"error_code": 1006, "error_message": "plan not authorized", "credit_count": 0},
              "data": null
            }
            """;

    private MockRestServiceServer server;
    private SnapshotService snapshotService;
    private CryptoCoinMarketCap validator;
    private CmcCreditGuard creditGuard;
    private CoinMarketCapService service;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();

        snapshotService = mock(SnapshotService.class);
        validator = mock(CryptoCoinMarketCap.class);
        creditGuard = mock(CmcCreditGuard.class);
        when(creditGuard.hasBudget()).thenReturn(true);

        service = new CoinMarketCapService(builder.build(), snapshotService, validator, creditGuard);
        ReflectionTestUtils.setField(service, "apiKey", "chave-de-teste");
        ReflectionTestUtils.setField(service, "listingLimit", 100);
    }

    private CmcCryptoSnapshot btcSnapshot() {
        return CmcCryptoSnapshot.builder()
                .cmcId(1).symbol("BTC").name("Bitcoin").slug("bitcoin").cmcRank(1)
                .currentPrice(new BigDecimal("326036.27"))
                .marketCap(new BigDecimal("6541245267892.74"))
                .volume24h(new BigDecimal("145234985121.83"))
                .percentChange1h(new BigDecimal("0.1458"))
                .percentChange24h(new BigDecimal("-0.5940"))
                .percentChange7d(new BigDecimal("-3.7953"))
                .marketCapDominance(new BigDecimal("58.6704"))
                .currency("BRL")
                // "Banco em dia" precisa ser relativo ao agora. Com data literal este
                // fixture passava a vencer sozinho no dia em que a checagem de idade
                // entrou, e os testes de leitura DB-first passavam a bater na API.
                .fetchedAt(LocalDateTime.now())
                .build();
    }

    // ── Leitura DB-first ────────────────────────────────────────────────────

    @Test
    @DisplayName("returnAllCryptos serve do banco sem tocar na API")
    void returnAllCryptos_comBatchNoBanco_naoChamaApi() {
        when(snapshotService.getLatestCmcBatch()).thenReturn(List.of(btcSnapshot()));

        List<CmcMarketDTO> result = service.returnAllCryptos();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).symbol()).isEqualTo("BTC");
        assertThat(result.get(0).percentChange7d()).isEqualTo(-3.7953);
        server.verify();   // nenhuma requisição esperada = nenhuma feita
        verify(creditGuard, never()).record(anyInt());
    }

    @Test
    @DisplayName("returnAllCryptos deriva a URL do logo a partir do id")
    void returnAllCryptos_derivaLogoDoId() {
        when(snapshotService.getLatestCmcBatch()).thenReturn(List.of(btcSnapshot()));

        assertThat(service.returnAllCryptos().get(0).imageUrl())
                .isEqualTo("https://s2.coinmarketcap.com/static/img/coins/64x64/1.png");
    }

    @Test
    @DisplayName("returnAllCryptos busca na API quando o banco está vazio e persiste o batch")
    void returnAllCryptos_bancoVazio_buscaNaApiEPersiste() {
        when(snapshotService.getLatestCmcBatch())
                .thenReturn(List.of())                      // 1ª leitura: vazio
                .thenReturn(List.of(btcSnapshot()));        // 2ª leitura: após o refresh

        server.expect(requestTo(org.hamcrest.Matchers.containsString("listings/latest")))
                .andExpect(header("X-CMC_PRO_API_KEY", "chave-de-teste"))
                .andRespond(withSuccess(JSON_LISTINGS, MediaType.APPLICATION_JSON));

        List<CmcMarketDTO> result = service.returnAllCryptos();

        assertThat(result).hasSize(1);
        verify(snapshotService).saveCmcListings(anyList(), eq("BRL"));
        server.verify();
    }

    @Test
    @DisplayName("returnCryptoByTerm resolve do banco quando a moeda está no batch")
    void returnCryptoByTerm_noBanco_naoChamaApi() {
        when(snapshotService.getLatestCmcCrypto("btc")).thenReturn(Optional.of(btcSnapshot()));

        CmcMarketDTO result = service.returnCryptoByTerm("btc");

        assertThat(result.name()).isEqualTo("Bitcoin");
        verify(validator).validTerm("btc");
        server.verify();
    }

    /**
     * O endpoint de busca é público. Se moeda fora do batch caísse na API, cada termo
     * inexistente custaria 1 crédito e daria para esvaziar a cota do mês iterando
     * símbolos — levando junto o refresh do scheduler. Por isso: 404, sem chamada.
     */
    @Test
    @DisplayName("returnCryptoByTerm devolve 404 para moeda fora do batch, sem gastar crédito")
    void returnCryptoByTerm_foraDoBatch_naoChamaApi() {
        when(snapshotService.getLatestCmcCrypto(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.returnCryptoByTerm("doge"))
                .isInstanceOf(CoinMarketCapNotFoundException.class)
                .hasMessageContaining("doge");

        server.verify();   // nenhuma requisição esperada = nenhuma feita
        verify(creditGuard, never()).record(anyInt());
    }

    // ── Panorama derivado (sem custo em créditos) ───────────────────────────

    @Test
    @DisplayName("returnGlobalStats deriva o market cap total da dominância")
    void returnGlobalStats_derivaTotalDaDominancia() {
        when(snapshotService.getLatestCmcBatch()).thenReturn(List.of(btcSnapshot()));

        CmcGlobalDTO global = service.returnGlobalStats();

        // 6.541.245.267.892,74 ÷ 58,6704 × 100
        assertThat(global.totalMarketCap())
                .isCloseTo(11149540000000.0, org.assertj.core.data.Offset.offset(1e10));
        assertThat(global.btcDominance()).isEqualTo(58.6704);
        assertThat(global.coinsTracked()).isEqualTo(1);
        server.verify();
    }

    @Test
    @DisplayName("returnGlobalStats falha quando não há nenhum snapshot")
    void returnGlobalStats_semDados_lancaExcecao() {
        when(snapshotService.getLatestCmcBatch()).thenReturn(List.of());

        assertThatThrownBy(() -> service.returnGlobalStats())
                .isInstanceOf(CoinMarketCapException.class);
    }

    // ── Proteção de cota ────────────────────────────────────────────────────

    @Test
    @DisplayName("refreshListings registra o credit_count devolvido pela API")
    void refreshListings_registraCreditoReal() {
        server.expect(requestTo(org.hamcrest.Matchers.containsString("listings/latest")))
                .andRespond(withSuccess(JSON_LISTINGS, MediaType.APPLICATION_JSON));

        service.refreshListings();

        verify(creditGuard).record(1);
    }

    @Test
    @DisplayName("refreshListings não chama a API quando o orçamento mensal acabou")
    void refreshListings_semOrcamento_naoChamaApi() {
        when(creditGuard.hasBudget()).thenReturn(false);

        assertThat(service.refreshListings()).isEmpty();
        server.verify();
        verify(snapshotService, never()).saveCmcListings(anyList(), anyString());
    }

    @Test
    @DisplayName("refreshListings não chama a API quando a chave não está configurada")
    void refreshListings_semChave_naoChamaApi() {
        ReflectionTestUtils.setField(service, "apiKey", "");

        assertThat(service.isEnabled()).isFalse();
        assertThat(service.refreshListings()).isEmpty();
        server.verify();
    }

    @Test
    @DisplayName("refreshListings falha quando a API responde 200 com error_code != 0")
    void refreshListings_erroNoEnvelope_lancaExcecao() {
        server.expect(requestTo(org.hamcrest.Matchers.containsString("listings/latest")))
                .andRespond(withSuccess(JSON_ERROR, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.refreshListings())
                .isInstanceOf(CoinMarketCapException.class);

        verify(snapshotService, never()).saveCmcListings(anyList(), anyString());
    }

    // ── Frescor do batch e degradação ────────────────────────────────────────
    // A janela mora aqui, e não no SnapshotFreshnessTest, porque é decisão de cota
    // desta fonte: o CmcScheduler roda de 10 em 10 min e cada busca custa crédito.

    @org.junit.jupiter.api.Nested
    @DisplayName("frescor do batch")
    class FrescorDoBatch {

        /** Instantes sempre relativos ao agora — data fixa envelheceria e venceria sozinha. */
        private com.brasilpanel.backend.model.CmcCryptoSnapshot batchDe(java.time.LocalDateTime quando) {
            var s = mock(com.brasilpanel.backend.model.CmcCryptoSnapshot.class);
            when(s.getFetchedAt()).thenReturn(quando);
            return s;
        }

        @Test
        @DisplayName("alguns ciclos perdidos do scheduler nao gastam credito na leitura")
        void poucosCiclosPerdidosNaoGastamCredito() {
            // 50 min sem refresh = 5 ciclos perdidos. Ainda dentro da janela de 1h:
            // soluço transitório da CMC não pode virar consumo de cota.
            var batch = List.of(batchDe(java.time.LocalDateTime.now().minusMinutes(50)));
            when(snapshotService.getLatestCmcBatch()).thenReturn(batch);

            service.returnAllCryptos();

            server.verify();   // nenhuma requisição registrada
        }

        @Test
        @DisplayName("batch vencido e API fora do ar serve o batch antigo, nao derruba")
        void batchVencidoComApiForaServeOAntigo() {
            // Este é o ganho do passo: antes a CMC não degradava nada.
            var batch = List.of(batchDe(java.time.LocalDateTime.now().minusHours(3)));
            when(snapshotService.getLatestCmcBatch()).thenReturn(batch);
            server.expect(requestTo(org.hamcrest.Matchers.containsString("listings/latest")))
                    .andRespond(withSuccess(JSON_ERROR, MediaType.APPLICATION_JSON));

            assertThat(service.returnAllCryptos()).hasSize(1);

            server.verify();   // tentou buscar, falhou, e ainda assim respondeu
        }
    }
}