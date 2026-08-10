package com.brasilpanel.backend.service.financial;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Nenhuma data fixa aqui: todos os instantes são derivados de um "agora" injetado,
 * então os casos continuam significando a mesma coisa daqui a um ano. Foi assim que
 * o BcbServiceTest quebrou — fixture com data literal que envelheceu.
 */
class SnapshotFreshnessTest {

    private static final LocalDateTime AGORA = LocalDateTime.now();

    @Nested
    @DisplayName("janela de duração")
    class Janela {

        @Test
        @DisplayName("dado buscado agora está fresco")
        void justFetchedIsFresh() {
            assertThat(SnapshotFreshness.isStale(AGORA, Duration.ofHours(1), AGORA)).isFalse();
        }

        @Test
        @DisplayName("dentro da janela está fresco")
        void insideWindowIsFresh() {
            assertThat(SnapshotFreshness.isStale(AGORA.minusMinutes(30), Duration.ofHours(1), AGORA)).isFalse();
        }

        @Test
        @DisplayName("exatamente no limite ainda vale")
        void exactlyAtTheBoundaryIsStillFresh() {
            // A janela é "por quanto tempo serve". Arredondar contra o dado faria a
            // leitura buscar um instante cedo demais — em fonte com cota, isso é gasto.
            assertThat(SnapshotFreshness.isStale(AGORA.minusHours(1), Duration.ofHours(1), AGORA)).isFalse();
        }

        @Test
        @DisplayName("passado o limite está vencido")
        void pastTheBoundaryIsStale() {
            assertThat(SnapshotFreshness.isStale(
                    AGORA.minusHours(1).minusSeconds(1), Duration.ofHours(1), AGORA)).isTrue();
        }

        @Test
        @DisplayName("snapshot sem data conta como vencido")
        void nullFetchedAtIsStale() {
            // Sem data não dá para afirmar que o dado ainda vale; tratar como fresco
            // serviria dado de idade desconhecida como se fosse atual.
            assertThat(SnapshotFreshness.isStale(null, Duration.ofHours(1), AGORA)).isTrue();
        }

        @Test
        @DisplayName("dado do futuro está fresco, não vencido")
        void futureFetchedAtIsFresh() {
            // Relógio adiantado ou snapshot gravado por outra instância não deve
            // disparar busca — o dado é no mínimo tão novo quanto o nosso.
            assertThat(SnapshotFreshness.isStale(AGORA.plusMinutes(5), Duration.ofHours(1), AGORA)).isFalse();
        }
    }

    // A folga da janela sobre o cron de cada scheduler é testada junto do serviço
    // dono da constante — ver CoinMarketCapServiceTest. A janela é detalhe do
    // serviço, não deste utilitário, e abri-la só para o teste inverteria isso.
}
