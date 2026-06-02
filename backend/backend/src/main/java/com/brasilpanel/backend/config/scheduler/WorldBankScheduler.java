package com.brasilpanel.backend.config.scheduler;

import com.brasilpanel.backend.service.api.worlBank.WorldBankService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Re-alimenta o PIB do Brasil (World Bank) no banco de dados.
 *
 * Frequência: mensal (dia 1 às 06h BRT). O World Bank publica o PIB uma vez
 * por ano e pode revisar o ano corrente — a verificação mensal (upsert por
 * ano) capta revisões sem custo relevante. Anos anteriores nunca mudam, então
 * o cache histórico (worldbank-pib-year) não precisa ser limpo.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WorldBankScheduler {

    private final WorldBankService worldBankService;
    private final CacheManager cacheManager;

    @Scheduled(cron = "0 0 6 1 * *", zone = "America/Sao_Paulo")
    public void refreshPib() {
        log.info("[WorldBankScheduler] Iniciando refresh do PIB...");
        try {
            worldBankService.refreshCurrentPib();
            evict("worldbank-pib-current");
            log.info("[WorldBankScheduler] PIB atualizado com sucesso.");
        } catch (Exception e) {
            log.warn("[WorldBankScheduler] Falha ao atualizar PIB: {}", e.getMessage());
        }
    }

    private void evict(String cacheName) {
        var cache = cacheManager.getCache(cacheName);
        if (cache != null) cache.clear();
    }
}