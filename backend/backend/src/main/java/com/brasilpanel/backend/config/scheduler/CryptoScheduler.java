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
    /**
     * De hora em hora. Era a cada 15 minutos. Mesma razão do CoinMarketCapScheduler:
     * a rodada grava no banco, e no Neon isso é tempo de compute acordado.
     *
     * <p>Alinhada ao minuto zero para compartilhar a mesma janela de atividade das
     * outras tarefas. Configurável por {@code CRYPTO_REFRESH_CRON}.
     */
    @Scheduled(cron = "${app.scheduler.crypto-cron:0 0 * * * *}", zone = "America/Sao_Paulo")
    public void refreshCryptoList() {
        log.info("[CryptoScheduler] Iniciando refresh da lista de criptomoedas...");
        try {
            coinGeckoService.refreshAllCryptos();
            evict("crypto-list");
            evict("crypto-by-name");
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