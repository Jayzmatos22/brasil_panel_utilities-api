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

    /**
     * De hora em hora. Era a cada 10 minutos.
     *
     * <p>Cotação de cripto num painel econômico não muda de decisão em 10 minutos, e
     * cada rodada grava no banco — o que, no Neon, significa manter o compute acordado
     * e pagar por isso. Alinhada ao minuto zero junto das outras tarefas para o banco
     * acordar uma vez por hora, e não três.
     *
     * <p>Configurável: {@code CMC_REFRESH_CRON} volta ao intervalo anterior sem
     * precisar de deploy de código.
     */
    @Scheduled(cron = "${app.scheduler.cmc-cron:0 0 * * * *}", zone = "America/Sao_Paulo")
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