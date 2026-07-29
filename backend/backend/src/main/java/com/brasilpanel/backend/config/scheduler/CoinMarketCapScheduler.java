package com.brasilpanel.backend.config.scheduler;

import com.brasilpanel.backend.service.api.coinMarketCap.CmcCreditGuard;
import com.brasilpanel.backend.service.api.coinMarketCap.CoinMarketCapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Atualiza os dados da CoinMarketCap no banco.
 *
 * <p>Frequência: a cada 10 minutos. A conta fecha assim: 6 chamadas/h × 24h × 30 dias
 * = 4.320 créditos/mês, 29% dos 15.000 do plano Basic. Encurtar para 5 min dobraria
 * o consumo sem ganho real — a própria CMC atualiza os preços a cada 60s, e o painel
 * não é ferramenta de trading.
 *
 * <p>Este é o <b>único</b> caminho que gasta crédito de forma programada; consultas
 * de usuário são servidas do banco.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CoinMarketCapScheduler {

    private final CoinMarketCapService coinMarketCapService;
    private final CmcCreditGuard creditGuard;
    private final CacheManager cacheManager;

    @Scheduled(cron = "0 */10 * * * *")
    public void refreshListings() {
        if (!coinMarketCapService.isEnabled()) {
            return;   // fonte desligada — sem chave configurada
        }

        log.info("[CmcScheduler] Iniciando refresh da CoinMarketCap...");
        try {
            coinMarketCapService.refreshListings();
            evict("cmc-listings");
            evict("cmc-quote-by-symbol");
            evict("cmc-global");
            log.info("[CmcScheduler] Atualizado. Créditos usados no mês: {}", creditGuard.currentUsage());
        } catch (Exception e) {
            // Falhar aqui não pode derrubar o painel: o banco segue servindo o último batch.
            log.warn("[CmcScheduler] Falha ao atualizar CoinMarketCap: {}", e.getMessage());
        }
    }

    private void evict(String cacheName) {
        var cache = cacheManager.getCache(cacheName);
        if (cache != null) cache.clear();
    }
}