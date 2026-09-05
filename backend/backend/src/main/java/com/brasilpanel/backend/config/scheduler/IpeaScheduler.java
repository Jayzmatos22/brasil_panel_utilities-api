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
 * <p>Frequência: dias úteis, às 07h30 BRT. O horário não é estético — é medido. O IPEA
 * republica num lote da manhã, por volta das 06h36, e o que esse lote traz é o dado do
 * dia útil anterior. Rodar antes dele significa ler o estado que o lote da manhã
 * <em>anterior</em> deixou, ou seja, um dia útil a menos de atualidade em todas as séries.
 *
 * <p>Medido em 05/09/2026 na série do Ibovespa: {@code SERATUALIZACAO} de 04/09 às 06h36,
 * e o ponto mais recente era o de 03/09 — o lote de sexta de manhã carregava o fechamento
 * de quinta. O job rodava às 05h, 1h36 antes desse lote, e por isso pegava sempre a leva
 * da véspera. Ao mexer neste cron, mantenha-o depois das 06h36 com folga; encostar no
 * horário do lote traz o problema de volta se o IPEA atrasar.
 *
 * <p>Sábado e domingo ficam de fora porque o lote do IPEA é de dia útil: em 05/09/2026,
 * um sábado, às 15h44 o carimbo da série ainda era o de sexta 06h36 — nenhum lote de fim
 * de semana havia rodado, e um job às 07h30 do sábado teria encontrado exatamente o que a
 * execução de sexta já tinha trazido. Duas varreduras de 55 séries por semana, sem dado
 * novo, contra uma fonte que estrangula sob rajada. O custo do recorte é teórico: se o
 * IPEA publicasse uma série mensal num sábado, ela chegaria na segunda.
 *
 * <p>Quase todas as séries são mensais ou anuais (o sufixo do código do IPEA dá a
 * frequência: 48 delas terminam em {@code 12}, de mensal), então a maioria das execuções
 * não encontra dado novo. A exceção é o Ibovespa ({@code GM366_IBVSP366} — o {@code 366}
 * marca série diária), e é ela que torna o horário relevante.
 *
 * <p>Não adianta rodar depois do fechamento da B3 para ter a cotação do dia: o IPEA é
 * intermediário, não a fonte, e só republica na manhã seguinte. O painel serve o
 * fechamento do pregão anterior porque é isso que existe no IPEA — não por causa do
 * agendamento. Quem precisa de dado no mesmo dia vem do {@code BcbScheduler}, que fala
 * com o BCB direto e roda às 18h.
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

    @Scheduled(cron = "0 30 7 * * MON-FRI", zone = "America/Sao_Paulo")
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
