package com.brasilpanel.backend.service.financial;

import java.time.DayOfWeek;
import java.time.LocalDate;

/**
 * Decide se a última data de uma série ainda vale ou se já se espera dado novo na fonte.
 *
 * <p>Existe para que a decisão não fique duplicada em cada serviço de API. A pergunta
 * "o banco está velho?" só pode ser respondida junto com a periodicidade da série:
 * cobrar dado diário de uma série mensal faz a leitura bater na fonte todo dia à toa,
 * e cobrar dado de sábado de uma série de pregão faz o mesmo no fim de semana.
 */
public final class SeriesFreshness {

    /**
     * Pregões de folga aceitos nas séries diárias. As fontes publicam com atraso — o
     * IPEA, medido em 08/08/2026, ainda parava em quinta 06/08, sem a sexta 07/08.
     * Sem essa folga a série vence antes de a fonte ter como atualizar, e cada
     * expiração de cache vira download que não grava nada.
     *
     * <p>A folga também absorve feriado isolado da B3 e dos bancos, que não temos
     * calendário para reconhecer; feriado emendado ainda gera uma busca a toa.
     */
    public static final int DEFASAGEM_PREGOES = 1;

    private SeriesFreshness() {
    }

    public static boolean isStale(LocalDate lastDate, SeriesPeriodicity periodicity) {
        return isStale(lastDate, periodicity, LocalDate.now());
    }

    /** Sobrecarga com "hoje" explícito para permitir teste sem depender do relógio. */
    public static boolean isStale(LocalDate lastDate, SeriesPeriodicity periodicity, LocalDate today) {
        if (lastDate == null) {
            return true;
        }
        return switch (periodicity) {
            case DIARIA_UTIL -> lastDate.isBefore(ultimoPregaoPublicado(today));
            case MENSAL -> lastDate.isBefore(today.withDayOfMonth(1).minusMonths(1));
            // Mesma forma da mensal, um período acima: tolera um ano de defasagem
            // de publicação. Estatística anual sai muito depois do ano de
            // referência — a PNAD do ano Y só chega em Y+1 —, então exigir o ano
            // corrente marcaria como vencida uma série que está em dia.
            case ANUAL -> lastDate.isBefore(today.withDayOfYear(1).minusYears(1));
        };
    }

    /** Pregão mais recente cujo valor já se espera encontrar publicado na fonte. */
    public static LocalDate ultimoPregaoPublicado(LocalDate hoje) {
        LocalDate pregao = diaUtilAnterior(hoje);
        for (int i = 0; i < DEFASAGEM_PREGOES; i++) {
            pregao = diaUtilAnterior(pregao);
        }
        return pregao;
    }

    /** Dia útil imediatamente anterior à data, pulando sábado e domingo. */
    public static LocalDate diaUtilAnterior(LocalDate data) {
        LocalDate anterior = data.minusDays(1);
        while (anterior.getDayOfWeek() == DayOfWeek.SATURDAY
                || anterior.getDayOfWeek() == DayOfWeek.SUNDAY) {
            anterior = anterior.minusDays(1);
        }
        return anterior;
    }
}