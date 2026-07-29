package com.brasilpanel.backend.config.scheduler;

import com.brasilpanel.backend.service.financial.SnapshotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Expurgo diário dos snapshots de criptomoeda.
 *
 * <p>As duas fontes de cripto gravam um batch inteiro a cada refresh, e só elas
 * crescem rápido o bastante para justificar retenção: o CoinGecko insere ~9.600
 * linhas/dia (100 moedas a cada 15 min) e a CoinMarketCap ~14.400 (100 a cada
 * 10 min) — juntas passam de 8 milhões de linhas por ano. Metais, ações e PIB
 * gravam poucas linhas por dia e ficam de fora de propósito.
 *
 * <p>Roda de madrugada, quando o painel tem menos uso: um DELETE grande segura
 * locks na tabela e competiria com as leituras do horário comercial.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SnapshotRetentionScheduler {

    private final SnapshotService snapshotService;

    @Value("${app.snapshot.retention.crypto-days:7}")
    private int cryptoRetentionDays;

    @Scheduled(cron = "0 30 3 * * *", zone = "America/Sao_Paulo")
    public void pruneCryptoSnapshots() {
        log.info("[RetentionScheduler] Iniciando expurgo (retenção: {} dias)...", cryptoRetentionDays);

        int gecko = snapshotService.pruneCryptoSnapshots(cryptoRetentionDays);
        int cmc = snapshotService.pruneCmcSnapshots(cryptoRetentionDays);

        log.info("[RetentionScheduler] Expurgo concluído: {} snapshots removidos ({} CoinGecko, {} CoinMarketCap).",
                gecko + cmc, gecko, cmc);
    }
}