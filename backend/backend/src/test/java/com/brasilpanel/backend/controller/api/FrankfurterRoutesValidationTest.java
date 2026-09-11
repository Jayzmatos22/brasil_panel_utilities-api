package com.brasilpanel.backend.controller.api;

import com.brasilpanel.backend.service.auth.TokenDenylistService;
import com.brasilpanel.backend.config.jwt.JwtService;
import com.brasilpanel.backend.service.api.frankFurter.FrankFurterService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * As moedas do câmbio eram concatenadas na URL da fonte, e o histórico não as validava
 * de forma nenhuma — só as datas. Um {@code to} de tamanho livre entrava cru na query
 * do provedor e abria parâmetro novo ali.
 *
 * <p>O host é fixo, então nunca foi SSRF de host. O que se verifica aqui é que o valor
 * hostil <b>não chega ao serviço</b>: barrar na borda evita tanto a query forjada quanto
 * a entrada de cache gravada com a resposta dela.
 */
@WebMvcTest(FrankfurterController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class FrankfurterRoutesValidationTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private FrankFurterService frankFurterService;
    @MockitoBean private JwtService jwtService;
    @MockitoBean private UserDetailsService userDetailsService;
    @MockitoBean private TokenDenylistService tokenDenylist;

    @Nested
    @DisplayName("Cotação")
    class Cotacao {

        @ParameterizedTest(name = "from={0}")
        @ValueSource(strings = {
                "US",            // curta
                "USDX",          // longa
                "US1",           // dígito
                "a&b",           // três caracteres, mas abre parâmetro na query da fonte
                "../../v1",      // tentativa de escapar do caminho
        })
        @DisplayName("moeda fora do formato ISO não chega ao serviço")
        void malformedCurrencyNeverReachesTheService(String from) throws Exception {
            mockMvc.perform(get("/api/frankfurter")
                            .param("from", from).param("to", "BRL").param("amount", "1"))
                    .andExpect(status().isBadRequest());

            verify(frankFurterService, never()).returnFrankFurterRate(anyString(), anyString(), anyDouble());
        }

        @Test
        @DisplayName("valor não positivo é recusado na borda")
        void nonPositiveAmountIsRejected() throws Exception {
            mockMvc.perform(get("/api/frankfurter")
                            .param("from", "USD").param("to", "BRL").param("amount", "0"))
                    .andExpect(status().isBadRequest());

            verify(frankFurterService, never()).returnFrankFurterRate(anyString(), anyString(), anyDouble());
        }

        @Test
        @DisplayName("requisição bem formada passa")
        void wellFormedRequestIsAccepted() throws Exception {
            mockMvc.perform(get("/api/frankfurter")
                            .param("from", "USD").param("to", "BRL").param("amount", "1"))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("Histórico")
    class Historico {

        /**
         * Esta rota não tinha validação nenhuma de moeda — nem a de tamanho que a cotação
         * tinha. O valor ia direto para a query da fonte, com o comprimento que fosse.
         */
        @ParameterizedTest(name = "to={0}")
        @ValueSource(strings = {
                "BRL&base=USD",
                "BRL&amount=999999999",
                "qualquer-coisa-de-tamanho-livre",
        })
        @DisplayName("moeda com parâmetro embutido não chega ao serviço")
        void injectedQueryParamNeverReachesTheService(String to) throws Exception {
            mockMvc.perform(get("/api/frankfurter/history")
                            .param("from", "USD").param("to", to)
                            .param("startDate", "2026-01-01").param("endDate", "2026-01-31"))
                    .andExpect(status().isBadRequest());

            verify(frankFurterService, never())
                    .returnRateHistory(anyString(), anyString(), anyString(), anyString());
        }

        @ParameterizedTest(name = "startDate={0}")
        @ValueSource(strings = {"2026-1-1", "01/01/2026", "2026-01-01..2026-12-31"})
        @DisplayName("data fora do formato não chega ao serviço — ela entra no CAMINHO da URL da fonte")
        void malformedDateNeverReachesTheService(String startDate) throws Exception {
            mockMvc.perform(get("/api/frankfurter/history")
                            .param("from", "USD").param("to", "BRL")
                            .param("startDate", startDate).param("endDate", "2026-01-31"))
                    .andExpect(status().isBadRequest());

            verify(frankFurterService, never())
                    .returnRateHistory(anyString(), anyString(), anyString(), anyString());
        }
    }

    @Nested
    @DisplayName("Últimos 30 dias")
    class Ultimos30Dias {

        @Test
        @DisplayName("delega ao histórico, então herda a mesma exigência de moeda")
        void inheritsTheSameCurrencyRule() throws Exception {
            mockMvc.perform(get("/api/frankfurter/last-30-days")
                            .param("from", "USD").param("to", "BRL&base=EUR"))
                    .andExpect(status().isBadRequest());

            verify(frankFurterService, never()).returnLast30Days(anyString(), anyString());
        }
    }
}
