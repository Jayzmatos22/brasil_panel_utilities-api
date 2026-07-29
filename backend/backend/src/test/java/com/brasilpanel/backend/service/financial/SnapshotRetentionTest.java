package com.brasilpanel.backend.service.financial;

import com.brasilpanel.backend.model.CmcCryptoSnapshot;
import com.brasilpanel.backend.model.CryptoSnapshot;
import com.brasilpanel.backend.repository.snapshot.CmcCryptoSnapshotRepository;
import com.brasilpanel.backend.repository.snapshot.CryptoSnapshotRepository;
import com.brasilpanel.backend.repository.snapshot.LbmaFixingRepository;
import com.brasilpanel.backend.repository.snapshot.MetalHistoryRepository;
import com.brasilpanel.backend.repository.snapshot.MetalSnapshotRepository;
import com.brasilpanel.backend.repository.snapshot.PibEstadualSnapshotRepository;
import com.brasilpanel.backend.repository.snapshot.PibSnapshotRepository;
import com.brasilpanel.backend.repository.snapshot.StockSnapshotRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * O expurgo é a única rotina que apaga dado do painel, então o que importa testar
 * não é o caminho feliz, e sim que ele nunca esvazie a tabela — a leitura é
 * DB-first, e tabela vazia significa painel sem cotação nenhuma.
 */
class SnapshotRetentionTest {

    private static final int RETENCAO_DIAS = 7;

    private CryptoSnapshotRepository cryptoRepository;
    private CmcCryptoSnapshotRepository cmcRepository;
    private SnapshotService service;

    @BeforeEach
    void setUp() {
        cryptoRepository = mock(CryptoSnapshotRepository.class);
        cmcRepository = mock(CmcCryptoSnapshotRepository.class);

        service = new SnapshotService(
                mock(StockSnapshotRepository.class),
                mock(MetalSnapshotRepository.class),
                mock(MetalHistoryRepository.class),
                mock(LbmaFixingRepository.class),
                cryptoRepository,
                cmcRepository,
                mock(PibSnapshotRepository.class),
                mock(PibEstadualSnapshotRepository.class));
    }

    private CryptoSnapshot geckoBatchEm(LocalDateTime quando) {
        return CryptoSnapshot.builder()
                .coinId("bitcoin").symbol("btc").name("Bitcoin")
                .currentPrice(new BigDecimal("350000"))
                .currency("brl").fetchedAt(quando)
                .build();
    }

    private CmcCryptoSnapshot cmcBatchEm(LocalDateTime quando) {
        return CmcCryptoSnapshot.builder()
                .cmcId(1).symbol("BTC").name("Bitcoin")
                .currentPrice(new BigDecimal("350000"))
                .currency("BRL").fetchedAt(quando)
                .build();
    }

    private LocalDateTime corteCapturadoGecko() {
        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(cryptoRepository).deleteOlderThan(captor.capture());
        return captor.getValue();
    }

    // ── Caminho normal ──────────────────────────────────────────────────────

    @Test
    @DisplayName("apaga pela janela de retenção quando o batch mais recente é atual")
    void pruneCrypto_batchAtual_cortaPelaJanela() {
        LocalDateTime agora = LocalDateTime.now();
        when(cryptoRepository.findTopByOrderByFetchedAtDesc())
                .thenReturn(Optional.of(geckoBatchEm(agora)));
        when(cryptoRepository.deleteOlderThan(any())).thenReturn(500);

        int removidos = service.pruneCryptoSnapshots(RETENCAO_DIAS);

        assertThat(removidos).isEqualTo(500);
        // corte = agora - 7 dias, e não o instante do batch mais recente
        assertThat(corteCapturadoGecko())
                .isCloseTo(agora.minusDays(RETENCAO_DIAS), within(5, ChronoUnit.SECONDS));
    }

    // ── A invariante que protege o painel ───────────────────────────────────

    @Test
    @DisplayName("preserva o último batch mesmo quando a tabela inteira está fora da janela")
    void pruneCrypto_tudoVencido_preservaUltimoBatch() {
        // Cenário real: scheduler parado por 30 dias (API fora do ar, chave expirada).
        LocalDateTime batchAntigo = LocalDateTime.now().minusDays(30);
        when(cryptoRepository.findTopByOrderByFetchedAtDesc())
                .thenReturn(Optional.of(geckoBatchEm(batchAntigo)));
        when(cryptoRepository.deleteOlderThan(any())).thenReturn(9000);

        service.pruneCryptoSnapshots(RETENCAO_DIAS);

        // O corte para no batch mais recente: tudo antes some, ele sobrevive.
        // Sem isso a tabela zeraria e o DB-first não teria o que servir.
        assertThat(corteCapturadoGecko()).isEqualTo(batchAntigo);
    }

    @Test
    @DisplayName("retenção zero ainda preserva o último batch")
    void pruneCrypto_retencaoZero_preservaUltimoBatch() {
        LocalDateTime batch = LocalDateTime.now().minusHours(2);
        when(cryptoRepository.findTopByOrderByFetchedAtDesc())
                .thenReturn(Optional.of(geckoBatchEm(batch)));

        service.pruneCryptoSnapshots(0);

        assertThat(corteCapturadoGecko()).isEqualTo(batch);
    }

    @Test
    @DisplayName("retenção negativa não apaga a tabela inteira")
    void pruneCrypto_retencaoNegativa_preservaUltimoBatch() {
        LocalDateTime batch = LocalDateTime.now().minusHours(2);
        when(cryptoRepository.findTopByOrderByFetchedAtDesc())
                .thenReturn(Optional.of(geckoBatchEm(batch)));

        service.pruneCryptoSnapshots(-10);

        assertThat(corteCapturadoGecko()).isEqualTo(batch);
    }

    // ── Bordas ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("não tenta apagar nada quando a tabela está vazia")
    void pruneCrypto_tabelaVazia_naoChamaDelete() {
        when(cryptoRepository.findTopByOrderByFetchedAtDesc()).thenReturn(Optional.empty());

        assertThat(service.pruneCryptoSnapshots(RETENCAO_DIAS)).isZero();
        verify(cryptoRepository, never()).deleteOlderThan(any());
    }

    @Test
    @DisplayName("falha no expurgo não propaga — o scheduler não pode quebrar por isso")
    void pruneCrypto_erroNoBanco_naoPropaga() {
        when(cryptoRepository.findTopByOrderByFetchedAtDesc())
                .thenReturn(Optional.of(geckoBatchEm(LocalDateTime.now())));
        when(cryptoRepository.deleteOlderThan(any()))
                .thenThrow(new RuntimeException("deadlock"));

        assertThat(service.pruneCryptoSnapshots(RETENCAO_DIAS)).isZero();
    }

    // ── Mesma garantia para a CoinMarketCap ─────────────────────────────────

    @Test
    @DisplayName("expurgo da CoinMarketCap preserva o último batch")
    void pruneCmc_tudoVencido_preservaUltimoBatch() {
        LocalDateTime batchAntigo = LocalDateTime.now().minusDays(45);
        when(cmcRepository.findTopByOrderByFetchedAtDesc())
                .thenReturn(Optional.of(cmcBatchEm(batchAntigo)));
        when(cmcRepository.deleteOlderThan(any())).thenReturn(14400);

        int removidos = service.pruneCmcSnapshots(RETENCAO_DIAS);

        assertThat(removidos).isEqualTo(14400);

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(cmcRepository).deleteOlderThan(captor.capture());
        assertThat(captor.getValue()).isEqualTo(batchAntigo);
    }

    @Test
    @DisplayName("expurgo de uma fonte não mexe na outra")
    void prune_fontesIsoladas() {
        when(cryptoRepository.findTopByOrderByFetchedAtDesc())
                .thenReturn(Optional.of(geckoBatchEm(LocalDateTime.now())));

        service.pruneCryptoSnapshots(RETENCAO_DIAS);

        verify(cmcRepository, never()).deleteOlderThan(any());
    }
}