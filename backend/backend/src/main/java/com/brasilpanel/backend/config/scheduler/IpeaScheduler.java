package com.brasilpanel.backend.config.scheduler;

import com.brasilpanel.backend.service.api.ipea.IpeaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Re-alimenta as séries do IPEA no banco de dados.
 *
 * Frequência: semanal (segunda-feira às 07h BRT). As séries do IPEA são
 * mensais/trimestrais/anuais — verificação semanal é mais que suficiente.
 * O refresh força a busca na API (ignora o atalho DB-first) e, em seguida,
 * os caches são limpos para a próxima leitura servir os dados novos.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class IpeaScheduler {

    private static final List<String> CACHES = List.of(
            "ipea-emprego", "ipea-renda", "ipea-desigualdade",
            "ipea-macro", "ipea-precos", "ipea-populacao"
    );

    private final IpeaService ipeaService;
    private final CacheManager cacheManager;

    @Scheduled(cron = "0 0 7 * * MON", zone = "America/Sao_Paulo")
    public void refreshIpea() {
        log.info("[IpeaScheduler] Iniciando refresh das séries IPEA...");
        try {
            ipeaService.refreshAll();
            CACHES.forEach(this::evict);
            log.info("[IpeaScheduler] Séries IPEA atualizadas com sucesso.");
        } catch (Exception e) {
            log.warn("[IpeaScheduler] Falha ao atualizar séries IPEA: {}", e.getMessage());
        }
    }

    private void evict(String cacheName) {
        var cache = cacheManager.getCache(cacheName);
        if (cache != null) cache.clear();
    }
}
