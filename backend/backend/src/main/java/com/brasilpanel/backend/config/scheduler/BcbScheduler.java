package com.brasilpanel.backend.config.scheduler;

import com.brasilpanel.backend.service.api.bcb.BcbService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Atualiza os dados do Banco Central no banco de dados.
 *
 * Frequência: dias úteis às 18h (BCB publica os valores por volta das 17h30).
 * Cada método evita o cache Caffeine antes de chamar o service,
 * garantindo que a chamada chegue de fato à API e persista no banco.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BcbScheduler {

    private final BcbService bcbService;
    private final CacheManager cacheManager;

    // ── CDI ──────────────────────────────────────────────────────────────────
    // BCB publica o CDI diário por volta das 17h30 em dias úteis
    @Scheduled(cron = "0 0 18 * * MON-FRI", zone = "America/Sao_Paulo")
    public void refreshCdi() {
        log.info("[BcbScheduler] Iniciando refresh CDI...");
        try {
            evict("bcb-cdi");
            bcbService.getCdiRate();
            log.info("[BcbScheduler] CDI atualizado com sucesso.");
        } catch (Exception e) {
            log.warn("[BcbScheduler] Falha ao atualizar CDI: {}", e.getMessage());
        }
    }

    // ── PTAX ─────────────────────────────────────────────────────────────────
    // PTAX é publicada pelo BCB no mesmo horário que o CDI
    @Scheduled(cron = "0 5 18 * * MON-FRI", zone = "America/Sao_Paulo")
    public void refreshPtax() {
        log.info("[BcbScheduler] Iniciando refresh PTAX...");
        try {
            evict("bcb-ptax");
            bcbService.getDollarPtax();
            log.info("[BcbScheduler] PTAX atualizada com sucesso.");
        } catch (Exception e) {
            log.warn("[BcbScheduler] Falha ao atualizar PTAX: {}", e.getMessage());
        }
    }

    // ── SELIC ────────────────────────────────────────────────────────────────
    // Taxa diária efetiva publicada pelo BCB em dias úteis
    @Scheduled(cron = "0 10 18 * * MON-FRI", zone = "America/Sao_Paulo")
    public void refreshSelic() {
        log.info("[BcbScheduler] Iniciando refresh SELIC...");
        try {
            evict("selic");
            evict("selic-history");
            bcbService.getSelic();
            bcbService.getSelicHistory();
            log.info("[BcbScheduler] SELIC atualizada com sucesso.");
        } catch (Exception e) {
            log.warn("[BcbScheduler] Falha ao atualizar SELIC: {}", e.getMessage());
        }
    }

    // ── IPCA ─────────────────────────────────────────────────────────────────
    // IPCA mensal: publicado pelo IBGE em torno do dia 9-12 de cada mês.
    // Verificação diária é segura (dado não muda entre publicações).
    @Scheduled(cron = "0 15 18 * * MON-FRI", zone = "America/Sao_Paulo")
    public void refreshIpca() {
        log.info("[BcbScheduler] Iniciando refresh IPCA...");
        try {
            evict("bcb-ipca");
            bcbService.getIpca();
            log.info("[BcbScheduler] IPCA atualizado com sucesso.");
        } catch (Exception e) {
            log.warn("[BcbScheduler] Falha ao atualizar IPCA: {}", e.getMessage());
        }
    }

    // ── Salário Mínimo ───────────────────────────────────────────────────────
    // Reajustado uma vez por ano (janeiro). Verificação semanal é suficiente.
    @Scheduled(cron = "0 0 9 * * MON", zone = "America/Sao_Paulo")
    public void refreshSalarioMinimo() {
        log.info("[BcbScheduler] Iniciando refresh Salário Mínimo...");
        try {
            evict("salario-minimo");
            bcbService.getMinimumWageAll();
            log.info("[BcbScheduler] Salário Mínimo atualizado com sucesso.");
        } catch (Exception e) {
            log.warn("[BcbScheduler] Falha ao atualizar Salário Mínimo: {}", e.getMessage());
        }
    }

    // ── utilitário ───────────────────────────────────────────────────────────

    private void evict(String cacheName) {
        var cache = cacheManager.getCache(cacheName);
        if (cache != null) cache.clear();
    }
}
