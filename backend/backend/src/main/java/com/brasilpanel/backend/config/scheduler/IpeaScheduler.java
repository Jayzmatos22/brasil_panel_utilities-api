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
 * <p>Frequência: diária, às 05h BRT — fora do horário de uso do painel, porque
 * o {@code refreshAll()} percorre as 55 séries em sequência e segura uma thread
 * enquanto isso.
 *
 * <p>Quase todas essas séries são mensais ou anuais (o sufixo do código do IPEA dá a
 * frequência: 48 delas terminam em {@code 12}, de mensal), então a maioria das execuções
 * não encontra dado novo — a diária é folga deliberada, para que a fonte fora do ar num
 * dia não empurre a atualização para a semana seguinte.
 *
 * <p>A exceção é o Ibovespa ({@code GM366_IBVSP366} — o {@code 366} marca série diária),
 * a única de frequência diária do grupo. Ela é atualizada junto com as demais, às 05h, e o
 * fechamento da B3 sai por volta das 18h: na prática o painel serve o fechamento do pregão
 * anterior. É correto, só não é do mesmo dia. O {@code BcbScheduler} roda às 18h justamente
 * para não ter esse atraso — se um dia o Ibovespa precisar do mesmo tratamento, ele tem que
 * sair deste ciclo para um job próprio depois do fechamento.
 *
 * <p>O refresh força a busca na API (ignora o atalho DB-first) e, em seguida, os
 * caches são limpos para a próxima leitura servir os dados novos.
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

            // Balanço de pagamentos
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
            "ipea-balanca-transacoes-correntes-pib",

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
            "ipea-quantum-exportacoes",


            // Mercado
            "ipea-ibovespa-fechamento",


            // IMPOSTOS
            "ipea-imposto-ii",
            "ipea-imposto-irpf",
            "ipea-imposto-irpj",
            "ipea-imposto-ir-total",
            "ipea-imposto-iof",
            "ipea-imposto-ipi",
            "ipea-imposto-itr",


            // Câmbio Contratado
            "ipea-cambio-comercial",
            "ipea-cambio-comercial-exportacao",
            "ipea-cambio-comercial-importacao",
            "ipea-cambio-comercial-financeiro",
            "ipea-cambio-financeiro",
            "ipea-cambio-financeiro-compra",
            "ipea-cambio-financeiro-venda",

            // Pib
            "ipea-pib-mensal"
    );

    private final IpeaService ipeaService;
    private final CacheManager cacheManager;

    @Scheduled(cron = "0 0 5 * * *", zone = "America/Sao_Paulo")
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
