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
            // Geral
            "ipea-emprego",
            "ipea-renda",
            "ipea-desigualdade",
            "ipea-macro",
            "ipea-precos",
            "ipea-populacao",

            // Câmbio Contratado e Taxas de Câmbio
            "ipea-reservas-ativos",
            "ipea-transacoes-correntes",
            "ipea-balanca-comercial",
            "ipea-servicos",
            "ipea-renda-primaria",
            "ipea-investimento-direto",
            "ipea-conta-capital",
            "ipea-conta-financeira",
            "ipea-investimento-carteira",
            "ipea-servicos-despesa",
            "ipea-investimento-direto-ingressos",

            // Exportações (Valores FOB, Índices de Preço e Quantum)
            "ipea-exportacoes-total",
            "ipea-exportacoes-quantum",
            "ipea-exportacoes-produtos-basicos",
            "ipea-exportacoes-agricultura-pecuaria-quantum",
            "ipea-exportacoes-bens-consumo",
            "ipea-exportacoes-precos-bens-capital",
            "ipea-exportacoes-precos-bens-duraveis",
            "ipea-exportacoes-precos-bens-nao-duraveis",
            "ipea-exportacoes-valor-bens-intermediarios",
            "ipea-exportacoes-quantum-bens-intermediarios",
            "ipea-exportacoes-valor-combustiveis",

            // Mercado
            "ipea-ibovespa-fechamento",


            // IMPOSTOS
            "ipea-imposto-ii",
            "ipea-imposto-irpf",
            "ipea-imposto-irpj",
            "ipea-imposto-ir-total",
            "ipea-imposto-iof",
            "ipea-imposto-ipi"
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
