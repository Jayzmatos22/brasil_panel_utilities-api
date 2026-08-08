package com.brasilpanel.backend.service.financial;

/** Com que frequência a fonte publica um valor novo para a série. */
public enum SeriesPeriodicity {

    /** Um valor por dia útil — pregão, PTAX, CDI. Nada novo em sábado e domingo. */
    DIARIA_UTIL,

    /** Um valor por mês — IPCA, salário mínimo, acumulados mensais. */
    MENSAL
}