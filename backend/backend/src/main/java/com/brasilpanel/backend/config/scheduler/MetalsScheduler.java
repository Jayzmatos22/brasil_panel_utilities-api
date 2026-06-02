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
            metalsDevService.refreshMetals();
            evict("metals");
            log.info("[MetalsScheduler] Metais atualizados com sucesso.");
        } catch (Exception e) {
            log.warn("[MetalsScheduler] Falha ao atualizar metais: {}", e.getMessage());
        }
    }

    // ── Fixing LBMA ────────────────────────────────────────────────────────────
    // 2x por dia útil (08h e 13h BRT) — cobre a publicação dos fixings AM e PM
    // de Londres. ~44 req/mês, dentro da margem da cota gratuita.
    @Scheduled(cron = "0 0 8 * * MON-FRI", zone = "America/Sao_Paulo")
    public void refreshLbmaFixingMorning() {
        refreshLbmaFixing("AM");
    }

    @Scheduled(cron = "0 0 13 * * MON-FRI", zone = "America/Sao_Paulo")
    public void refreshLbmaFixingAfternoon() {
        refreshLbmaFixing("PM");
    }

    private void refreshLbmaFixing(String slot) {
        log.info("[MetalsScheduler] Iniciando refresh do fixing LBMA ({})...", slot);
        try {
            metalsDevService.refreshLbmaFixing();
            evict("lbma-fixing");
            log.info("[MetalsScheduler] Fixing LBMA atualizado com sucesso ({}).", slot);
        } catch (Exception e) {
            log.warn("[MetalsScheduler] Falha ao atualizar fixing LBMA ({}): {}", slot, e.getMessage());
        }
    }

    // ── utilitário ───────────────────────────────────────────────────────────

    private void evict(String cacheName) {
        var cache = cacheManager.getCache(cacheName);
        if (cache != null) cache.clear();
    }
}
