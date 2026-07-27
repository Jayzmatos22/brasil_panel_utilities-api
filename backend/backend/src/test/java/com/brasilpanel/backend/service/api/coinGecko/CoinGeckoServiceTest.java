package com.brasilpanel.backend.service.api.coinGecko;

import com.brasilpanel.backend.dto.api.coinGecko.CryptoCoinGeckoByNameDTO;
import com.brasilpanel.backend.dto.api.coinGecko.CryptoCoinGeckoMarketDTO;
import com.brasilpanel.backend.exception.customized.CryptoCoinGeckoException;
import com.brasilpanel.backend.model.CryptoSnapshot;
import com.brasilpanel.backend.service.financial.SnapshotService;
import com.brasilpanel.backend.validators.api.CryptoCoinGecko;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * O free tier do CoinGecko é restrito, então a leitura serve do banco sempre que
 * possível — a API só entra quando o batch ainda não existe.
 */
class CoinGeckoServiceTest {

    private static final String JSON_TOP = """
            [
              {
                "id": "bitcoin",
                "symbol": "btc",
                "name": "Bitcoin",
                "current_price": 350000.00,
                "market_cap": 6900000000000,
                "price_change_percentage_24h": 2.35,
                "image": "https://exemplo/btc.png"
              },
              {
                "id": "ethereum",
                "symbol": "eth",
                "name": "Ethereum",
                "current_price": 18000.00,
                "market_cap": 2100000000000,
                "price_change_percentage_24h": -1.10,
                "image": "https://exemplo/eth.png"
              }
            ]
            """;

    private MockRestServiceServer server;
    private SnapshotService snapshotService;
    private CryptoCoinGecko validator;
    private CoinGeckoService service;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        snapshotService = mock(SnapshotService.class);
        validator = mock(CryptoCoinGecko.class);

        service = new CoinGeckoService(builder.build(), validator, snapshotService);
    }

    @Test
    @DisplayName("banco vazio busca o top 100 na API e persiste o batch")
    void emptyDatabaseFetchesAndPersists() {
        when(snapshotService.getLatestCryptoBatch()).thenReturn(List.of());
        server.expect(requestTo(Matchers.containsString("coins/markets")))
                .andRespond(withSuccess(JSON_TOP, MediaType.APPLICATION_JSON));

        List<CryptoCoinGeckoMarketDTO> lista = service.returnAllCryptos();

        assertThat(lista).hasSize(2);
        assertThat(lista.getFirst().id()).isEqualTo("bitcoin");
        assertThat(lista.getFirst().currentPrice()).isEqualTo(350000.00);
        // O batch precisa ser salvo, senão a próxima leitura bate na API de novo.
        verify(snapshotService).saveCryptoList(anyList(), any());
        server.verify();
    }

    @Test
    @DisplayName("preços são cotados em reais")
    void pricesAreQuotedInBrl() {
        when(snapshotService.getLatestCryptoBatch()).thenReturn(List.of());
        server.expect(requestTo(Matchers.containsString("vs_currency=brl")))
                .andRespond(withSuccess(JSON_TOP, MediaType.APPLICATION_JSON));

        service.returnAllCryptos();

        server.verify();
    }

    @Test
    @DisplayName("moeda no último batch é servida do banco, sem tocar na API")
    void coinInLatestBatchIsServedFromDatabase() {
        CryptoSnapshot snapshot = mock(CryptoSnapshot.class);
        when(snapshot.getCoinId()).thenReturn("bitcoin");
        when(snapshot.getCurrentPrice()).thenReturn(new BigDecimal("350000.00"));
        when(snapshotService.getLatestCrypto("bitcoin")).thenReturn(Optional.of(snapshot));

        CryptoCoinGeckoByNameDTO cripto = service.returnCryptoByName("bitcoin");

        assertThat(cripto.id()).isEqualTo("bitcoin");
        server.verify();   // nenhuma requisição registrada
    }

    @Test
    @DisplayName("nome da moeda passa pelo validador antes de qualquer consulta")
    void coinNameIsValidatedFirst() {
        doThrow(new CryptoCoinGeckoException("Nome inválido"))
                .when(validator).validNameCoin("!!!");

        assertThatThrownBy(() -> service.returnCryptoByName("!!!"))
                .isInstanceOf(CryptoCoinGeckoException.class);

        verify(snapshotService, never()).getLatestCrypto(anyString());
    }
}