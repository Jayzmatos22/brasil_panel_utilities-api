package com.brasilpanel.backend.config.scheduler;

import com.brasilpanel.backend.service.api.metalsDev.MetalsDevService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Atualiza os preços de metais preciosos e industriais no banco de dados.
 *
 * Frequência: toda segunda-feira às 08h (Metals Dev atualiza diariamente,
 * mas o plano gratuito tem cota limitada — semanal é suficiente para o painel).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MetalsScheduler {


    private final MetalsDevService metalsDevService;
    private final CacheManager cacheManager;

    // ── Metais ───────────────────────────────────────────────────────────────
    // Atualização semanal — segunda-feira às 08h BRT
    @Scheduled(cron = "0 0 8 * * MON", zone = "America/Sao_Paulo")
    public void refreshMetals() {
        log.info("[MetalsScheduler] Iniciando refresh de metais...");
        try {
            evict("metals");
            metalsDevService.getMetals();
            log.info("[MetalsScheduler] Metais atualizados com sucesso.");
        } catch (Exception e) {
            log.warn("[MetalsScheduler] Falha ao atualizar metais: {}", e.getMessage());
        }
    }

    // ── utilitário ───────────────────────────────────────────────────────────

    private void evict(String cacheName) {
        var cache = cacheManager.getCache(cacheName);
        if (cache != null) cache.clear();
    }
}
