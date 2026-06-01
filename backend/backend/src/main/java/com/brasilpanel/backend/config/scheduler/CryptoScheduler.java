package com.brasilpanel.backend.config.scheduler;

import com.brasilpanel.backend.service.api.coinGecko.CoinGeckoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Atualiza os dados de criptomoedas no banco de dados.
 *
 * Frequência: a cada 15 minutos (preços cripto são voláteis).
 * O cache "crypto-by-name" é evictado por completo — como as buscas
 * individuais são feitas por nome, limpar tudo garante que a próxima
 * consulta busque dados frescos da API.
 *
 * Limite CoinGecko (plano gratuito): ~30 req/min → sem problema com 1 req/15 min.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CryptoScheduler {

    private final CoinGeckoService coinGeckoService;
    private final CacheManager cacheManager;

    // ── Top 100 criptomoedas (BRL) ───────────────────────────────────────────
    // A cada 15 minutos, 24 horas por dia
    @Scheduled(cron = "0 */15 * * * *")
    public void refreshCryptoList() {
        log.info("[CryptoScheduler] Iniciando refresh da lista de criptomoedas...");
        try {
            evict("crypto-list");
            evict("crypto-by-name");
            coinGeckoService.returnAllCryptos();
            log.info("[CryptoScheduler] Criptomoedas atualizadas com sucesso.");
        } catch (Exception e) {
            log.warn("[CryptoScheduler] Falha ao atualizar criptomoedas: {}", e.getMessage());
        }
    }

    // ── utilitário ───────────────────────────────────────────────────────────

    private void evict(String cacheName) {
        var cache = cacheManager.getCache(cacheName);
        if (cache != null) cache.clear();
    }
}