package com.brasilpanel.backend.model;

/**
 * Área de atuação declarada no onboarding.
 *
 * <p>Os rótulos exibidos ("Comércio e serviços") vivem no frontend; aqui ficam só
 * as constantes, que são o que trafega na API e o que o banco armazena. Assim o
 * texto pode mudar sem migration, e o dado gravado continua agregável.
 *
 * <p>Ampliar esta lista exige migration: a coluna tem CHECK correspondente.
 */
public enum ProfessionalArea {
    TECNOLOGIA,
    FINANCAS,
    EDUCACAO,
    SAUDE,
    INDUSTRIA,
    COMERCIO_SERVICOS,
    SETOR_PUBLICO,
    OUTRA
}
