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

    // ── Frescor e degradação ─────────────────────────────────────────────────
    // Todos os instantes são relativos ao agora: data literal envelheceria e faria
    // o caso "banco em dia" virar "banco vencido" sozinho, batendo na API.

    @org.junit.jupiter.api.Nested
    @DisplayName("frescor do snapshot")
    class Frescor {

        private com.brasilpanel.backend.model.MetalSnapshot metaisDe(java.time.LocalDateTime quando) {
            var s = mock(com.brasilpanel.backend.model.MetalSnapshot.class);
            when(s.getFetchedAt()).thenReturn(quando);
            when(s.getGold()).thenReturn(new java.math.BigDecimal("12000.50"));
            return s;
        }

        private com.brasilpanel.backend.model.LbmaFixingSnapshot fixingDe(java.time.LocalDateTime quando) {
            var s = mock(com.brasilpanel.backend.model.LbmaFixingSnapshot.class);
            when(s.getFetchedAt()).thenReturn(quando);
            when(s.getGoldAm()).thenReturn(new java.math.BigDecimal("12000.50"));
            return s;
        }

        @Test
        @DisplayName("uma segunda-feira perdida pelo scheduler nao gasta cota na leitura")
        void umaSegundaPerdidaNaoGastaCota() {
            // Refresh semanal + cota de ~100 req/mes: 8 dias sem refresh ainda serve
            // do banco. So uma semana inteira parada faz a leitura reabastecer.
            // Montado fora do when(): stubar o fixture dentro do stub externo é
            // stubbing aninhado, que o Mockito rejeita.
            var recente = metaisDe(java.time.LocalDateTime.now().minusDays(8));
            when(snapshotService.getLatestMetals()).thenReturn(Optional.of(recente));

            assertThat(service.getMetals().gold()).isEqualTo(12000.50);
            server.verify();   // nenhuma requisição registrada
        }

        @Test
        @DisplayName("metais vencidos com API fora do ar servem o snapshot antigo")
        void metaisVencidosComApiForaServemOAntigo() {
            // O ganho do passo: antes o snapshot era servido para sempre e a API
            // nunca era reconsultada; agora reconsulta e, falhando, degrada.
            var vencido = metaisDe(java.time.LocalDateTime.now().minusDays(20));
            when(snapshotService.getLatestMetals()).thenReturn(Optional.of(vencido));
            server.expect(requestTo(Matchers.containsString("api.metals.dev")))
                    .andRespond(withSuccess("{\"status\":\"error\"}", MediaType.APPLICATION_JSON));

            assertThat(service.getMetals().gold()).isEqualTo(12000.50);
            server.verify();   // tentou buscar, falhou, e ainda assim respondeu
        }

        @Test
        @DisplayName("fixing do fim de semana ainda vale na segunda de manha")
        void fixingDoFimDeSemanaAindaValeNaSegunda() {
            // De sexta 13h a segunda 8h sao ~67h sem fixing publicado. Vencer antes
            // disso faria a leitura buscar algo que a LBMA nao publicou.
            var deSexta = fixingDe(java.time.LocalDateTime.now().minusHours(67));
            when(snapshotService.getLatestLbmaFixing()).thenReturn(Optional.of(deSexta));

            assertThat(service.getLbmaFixing().goldAm()).isEqualTo(12000.50);
            server.verify();   // nenhuma requisição registrada
        }

        @Test
        @DisplayName("refreshLbmaFixing propaga a falha em vez de mascarar com o banco")
        void refreshLbmaFixingPropagaAFalha() {
            // Escrita falha alto: antes ela relia o banco e devolvia o snapshot antigo,
            // e o MetalsScheduler registrava "atualizado com sucesso" sem ter atualizado.
            server.expect(requestTo(Matchers.containsString("authority")))
                    .andRespond(withSuccess("{\"status\":\"error\"}", MediaType.APPLICATION_JSON));

            assertThatThrownBy(() -> service.refreshLbmaFixing())
                    .isInstanceOf(MetalsException.class);
        }
    }
}