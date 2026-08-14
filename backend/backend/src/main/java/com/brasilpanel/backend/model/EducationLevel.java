package com.brasilpanel.backend.model;

/**
 * Escolaridade declarada no onboarding.
 *
 * <p>A ordem de declaração é crescente de propósito: o {@code ordinal()} não é
 * persistido (a coluna guarda o nome), mas a ordem torna previsível tanto uma
 * comparação futura quanto a montagem do select no frontend.
 *
 * <p>Ampliar esta lista exige migration: a coluna tem CHECK correspondente.
 */
public enum EducationLevel {
    ENSINO_FUNDAMENTAL,
    ENSINO_MEDIO,
    ENSINO_TECNICO,
    SUPERIOR_CURSANDO,
    SUPERIOR_COMPLETO,
    POS_GRADUACAO,
    MESTRADO_DOUTORADO
}
