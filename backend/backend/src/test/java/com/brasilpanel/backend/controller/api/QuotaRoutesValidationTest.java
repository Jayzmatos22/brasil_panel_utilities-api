package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.config.jwt.JwtService;
import com.brasilpanel.backend.service.api.alphaVantage.AlphaVantageService;
import com.brasilpanel.backend.service.api.coinGecko.CoinGeckoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * As duas rotas públicas cujo parâmetro vira chamada a uma API com cota apertada.
 *
 * <p>Sem validação de formato, qualquer string virava requisição externa: o free tier
 * da AlphaVantage é de ~25 chamadas por DIA, então 25 símbolos inventados num laço
 * esgotavam a cota inteira — dentro do teto de 120/min do rate limiter. O que se
 * verifica aqui não é a mensagem de erro, e sim que o serviço <b>não é chamado</b>.
 */
@WebMvcTest({AlphaVantageController.class, CryptoCoinGeckoController.class})
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class QuotaRoutesValidationTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private AlphaVantageService alphaVantageService;
    @MockitoBean private CoinGeckoService coinGeckoService;

    // O JwtFilter entra no slice por ser um Filter; suas dependências precisam existir.
    @MockitoBean private JwtService jwtService;
    @MockitoBean private UserDetailsService userDetailsService;

    @Nested
    @DisplayName("Símbolo de ação (AlphaVantage)")
    class Simbolo {

        @ParameterizedTest(name = "\"{0}\" é rejeitado sem tocar na API")
        @ValueSource(strings = {
                "simbolo-longo-demais-para-um-ticker",
                "PETR4 SA",
                "AAPL&function=TIME_SERIES_DAILY",
                "\"OR1=1"
        })
        void simboloInvalido_naoChegaNaApi(String symbol) throws Exception {
            mockMvc.perform(get("/api/quote/{symbol}", symbol))
                    .andExpect(status().isBadRequest());

            verify(alphaVantageService, never()).getStockQuote(anyString());
        }

        @ParameterizedTest(name = "\"{0}\" é aceito")
        @ValueSource(strings = {"PETR4.SA", "AAPL", "BRK-B", "VALE3.SA"})
        void simboloValido_passa(String symbol) throws Exception {
            mockMvc.perform(get("/api/quote/{symbol}", symbol))
                    .andExpect(status().isOk());

            verify(alphaVantageService).getStockQuote(symbol);
        }

        /**
         * Travessia de caminho é normalizada pelo Spring antes do roteamento, então
         * nem chega ao @Pattern — vira 404. O que importa aqui é o mesmo de sempre:
         * não virou chamada externa.
         */
        @Test
        @DisplayName("travessia de caminho não vira chamada à API")
        void travessiaDeCaminho_naoChegaNaApi() throws Exception {
            mockMvc.perform(get("/api/quote/{symbol}", "../etc/passwd"))
                    .andExpect(status().is4xxClientError());

            verify(alphaVantageService, never()).getStockQuote(anyString());
        }

        @Test
        @DisplayName("o histórico usa o mesmo padrão da cotação")
        void historico_validaIgual() throws Exception {
            mockMvc.perform(get("/api/quote/{symbol}/history", "simbolo-invalido-e-longo"))
                    .andExpect(status().isBadRequest());

            verify(alphaVantageService, never()).getStockHistory(anyString());
        }
    }

    @Nested
    @DisplayName("Nome de criptomoeda (CoinGecko)")
    class Cripto {

        @ParameterizedTest(name = "\"{0}\" é rejeitado sem tocar na API")
        @ValueSource(strings = {
                "b",
                "bitcoin&vs_currencies=usd",
                "moeda inexistente",
                "nome-absurdamente-longo-que-nenhuma-moeda-real-teria-jamais"
        })
        void nomeInvalido_naoChegaNaApi(String name) throws Exception {
            mockMvc.perform(get("/api/coingecko/{name}", name))
                    .andExpect(status().isBadRequest());

            verify(coinGeckoService, never()).returnCryptoByName(anyString());
        }

        @ParameterizedTest(name = "\"{0}\" é aceito")
        @ValueSource(strings = {"bitcoin", "usd-coin", "btc", "ETH"})
        void nomeValido_passa(String name) throws Exception {
            mockMvc.perform(get("/api/coingecko/{name}", name))
                    .andExpect(status().isOk());

            verify(coinGeckoService).returnCryptoByName(name);
        }
    }
}
