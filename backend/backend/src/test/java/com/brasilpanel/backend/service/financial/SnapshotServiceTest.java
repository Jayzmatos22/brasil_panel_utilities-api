package com.brasilpanel.backend.service.financial;

import com.brasilpanel.backend.dto.api.coinGecko.CryptoCoinGeckoMarketDTO;
import com.brasilpanel.backend.model.CryptoSnapshot;
import com.brasilpanel.backend.model.PibSnapshot;
import com.brasilpanel.backend.repository.snapshot.CryptoSnapshotRepository;
import com.brasilpanel.backend.repository.snapshot.PibSnapshotRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

/**
 * Cobre as duas partes do SnapshotService com lógica própria: o upsert do PIB
 * por ano e a resolução de cripto por id, símbolo ou nome.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(SnapshotService.class)
@ActiveProfiles("test")
class SnapshotServiceTest {

    private static final String MOEDA = "BRL";

    @Autowired private SnapshotService service;
    @Autowired private PibSnapshotRepository pibRepository;
    @Autowired private CryptoSnapshotRepository cryptoRepository;
    @Autowired private TestEntityManager entityManager;

    @BeforeEach
    void setUp() {
        pibRepository.deleteAll();
        cryptoRepository.deleteAll();
    }

    // ── PIB ──────────────────────────────────────────────────────────────────

    @Nested
    class Pib {

        @Test
        @DisplayName("grava e recupera o PIB de um ano")
        void savesAndReadsByYear() {
            service.savePib(2025, 11_000_000_000_000.0, MOEDA);

            assertThat(service.getPibByYear(2025)).isPresent();
            assertThat(service.getPibByYear(2025).orElseThrow().getCurrency()).isEqualTo(MOEDA);
        }

        @Test
        @DisplayName("regravar o mesmo ano atualiza, em vez de duplicar")
        void savingSameYearUpdates() {
            service.savePib(2025, 11_000_000_000_000.0, MOEDA);
            service.savePib(2025, 11_500_000_000_000.0, MOEDA);

            // O ano corrente é revisado pelo World Bank; duplicar quebraria o gráfico.
            assertThat(pibRepository.count()).isEqualTo(1);
            assertThat(service.getPibByYear(2025).orElseThrow()
                    .getValue().doubleValue()).isEqualTo(11_500_000_000_000.0);
        }

        @Test
        @DisplayName("getLatestPib devolve o ano mais recente")
        void latestPibIsTheMostRecentYear() {
            service.savePib(2023, 9_000_000_000_000.0, MOEDA);
            service.savePib(2025, 11_000_000_000_000.0, MOEDA);
            service.savePib(2024, 10_000_000_000_000.0, MOEDA);

            assertThat(service.getLatestPib().orElseThrow().getYear()).isEqualTo(2025);
        }

        @Test
        @DisplayName("a série é filtrada por moeda")
        void seriesIsFilteredByCurrency() {
            service.savePib(2024, 10_000_000_000_000.0, MOEDA);
            service.savePib(2023, 2_000_000_000_000.0, "USD");

            List<PibSnapshot> serie = service.getPibSeries(MOEDA);

            // Misturar moedas na mesma série produziria um gráfico sem sentido.
            assertThat(serie).hasSize(1);
            assertThat(serie.getFirst().getYear()).isEqualTo(2024);
        }

        @Test
        @DisplayName("banco vazio devolve vazio, não erro")
        void emptyDatabaseReturnsEmpty() {
            assertThat(service.getLatestPib()).isEmpty();
            assertThat(service.getPibSeries(MOEDA)).isEmpty();
        }
    }

    // ── Cripto ───────────────────────────────────────────────────────────────

    @Nested
    class Cripto {

        /** fetchedAt nulo de propósito: é assim que o DTO chega da API, que não manda a data. */
        private CryptoCoinGeckoMarketDTO moeda(String id, String simbolo, String nome, double preco) {
            return new CryptoCoinGeckoMarketDTO(id, simbolo, nome, preco, 1_000L, 1.5, "https://img", null);
        }

        private LocalDateTime buscadoEm;

        @BeforeEach
        void seed() {
            // Nunca uma data fixa: o instante do fetch é "agora" por definição, e uma
            // constante envelheceria junto com o arquivo.
            buscadoEm = LocalDateTime.now();

            service.saveCryptoList(List.of(
                    moeda("bitcoin", "btc", "Bitcoin", 350_000.0),
                    moeda("usd-coin", "usdc", "USDC", 5.4)
            ), MOEDA, buscadoEm);

            // getLatestCryptoBatch reconsulta por igualdade exata de fetchedAt.
            // Sem esvaziar o contexto, a leitura devolveria a instância em memória,
            // com precisão de nanossegundos — que não casa com o valor truncado
            // pela coluna timestamp. Em produção isso não ocorre porque gravação e
            // leitura acontecem em requisições (e transações) distintas.
            entityManager.flush();
            entityManager.clear();
        }

        @Test
        @DisplayName("guarda o batch inteiro")
        void storesTheWholeBatch() {
            assertThat(service.getLatestCryptoBatch()).hasSize(2);
        }

        @Test
        @DisplayName("resolve a moeda pelo id")
        void resolvesById() {
            assertThat(service.getLatestCrypto("bitcoin")).isPresent();
        }

        @Test
        @DisplayName("resolve a moeda pelo símbolo")
        void resolvesBySymbol() {
            // "usdc" é o símbolo; o id é "usd-coin".
            assertThat(service.getLatestCrypto("usdc")).isPresent();
            assertThat(service.getLatestCrypto("usdc").orElseThrow().getCoinId()).isEqualTo("usd-coin");
        }

        @Test
        @DisplayName("moeda fora do batch não é encontrada")
        void coinOutsideBatchIsNotFound() {
            assertThat(service.getLatestCrypto("dogecoin")).isEmpty();
        }

        @Test
        @DisplayName("grava o instante recebido, e o mesmo em todo o batch")
        void storesTheGivenFetchInstantAcrossTheBatch() {
            // É esse valor que o painel exibe como "atualizado há X min". Se o batch
            // gravasse instantes diferentes por moeda, a data mostrada dependeria de
            // qual linha o front olhasse primeiro.
            var batch = service.getLatestCryptoBatch();

            assertThat(batch).isNotEmpty();
            assertThat(batch).extracting(CryptoSnapshot::getFetchedAt)
                    .containsOnly(batch.getFirst().getFetchedAt());
            // A coluna timestamp trunca a precisão do LocalDateTime, então comparar
            // por igualdade exata seria frágil — o que importa é ser o mesmo segundo.
            assertThat(batch.getFirst().getFetchedAt())
                    .isCloseTo(buscadoEm, within(1, ChronoUnit.SECONDS));
        }
    }
}