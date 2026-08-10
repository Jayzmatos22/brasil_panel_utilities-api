package com.brasilpanel.backend.service.financial;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Frescor de snapshot por janela de duração: "faz quanto tempo desde a última busca?".
 *
 * <p>É o contraponto de {@link SeriesFreshness}, e os dois não se substituem. Ali a
 * pergunta é de calendário — "tenho o último ponto publicado?" — e a base é a data a
 * que o dado se refere. Aqui a base é o instante em que <b>nós</b> buscamos, e a
 * pergunta serve para poupar a fonte, não para detectar ponto faltando.
 *
 * <p>Use esta classe quando a fonte não tem "último valor publicado" detectável pelo
 * calendário: cotação contínua (cripto, metais, ações) ou série cuja defasagem
 * editorial é desconhecida — o PIB anual do World Bank e do SIDRA sai quando sai, e
 * chutar a data de publicação produziria um vencimento fictício.
 *
 * <h2>Como escolher a janela</h2>
 * O piso é o TTL do cache; o teto é a cota da fonte. Onde existe scheduler, a janela
 * deve ser <b>bem maior</b> que o cron dele: quem reabastece o banco é o scheduler, e
 * a janela só precisa agir quando ele está quebrado. Uma janela perto do cron faria
 * qualquer falha transitória virar busca na leitura — e, em fonte com cota, gasto.
 */
public final class SnapshotFreshness {

    private SnapshotFreshness() {
    }

    /**
     * @param fetchedAt quando o dado foi buscado; nulo conta como vencido, porque
     *                  snapshot sem data não dá para afirmar que ainda vale
     * @param janela    por quanto tempo o dado local é considerado bom
     */
    public static boolean isStale(LocalDateTime fetchedAt, Duration janela) {
        return isStale(fetchedAt, janela, LocalDateTime.now());
    }

    /** Mesma regra com o instante injetado, para o teste não depender do relógio real. */
    public static boolean isStale(LocalDateTime fetchedAt, Duration janela, LocalDateTime agora) {
        if (fetchedAt == null) {
            return true;
        }
        // Exatamente no limite ainda vale: a janela é "por quanto tempo serve", e
        // arredondar contra o dado faria a leitura buscar cedo demais.
        return fetchedAt.plus(janela).isBefore(agora);
    }
}
