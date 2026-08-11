package com.brasilpanel.backend.service.financial;

/** Com que frequência a fonte publica um valor novo para a série. */
public enum SeriesPeriodicity {

    /** Um valor por dia útil — pregão, PTAX, CDI. Nada novo em sábado e domingo. */
    DIARIA_UTIL,

    /** Um valor por mês — IPCA, salário mínimo, acumulados mensais. */
    MENSAL,

    /**
     * Um valor por ano — Gini, taxa de pobreza, renda média, projeções populacionais.
     *
     * <p>Sem esta constante essas séries eram tratadas como mensais e ficavam
     * <em>permanentemente</em> vencidas: em 11/08/2026 o Gini parava em 2025-01-01,
     * que é o dado corrente, mas a régua mensal exigia ponto de julho/2026. O
     * resultado era ir à fonte a cada expiração de cache buscar um valor que não
     * existe, pagar a latência e não gravar nada.
     */
    ANUAL
}