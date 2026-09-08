package com.brasilpanel.backend.model;

/** Tipo de e-mail enfileirado. Determina como o corpo é montado na hora do envio. */
public enum EmailType {

    /** Código de 6 dígitos para confirmar o cadastro. */
    VERIFICATION_CODE,

    /**
     * Código de 6 dígitos do segundo fator de uma ação sensível do admin.
     *
     * <p>Um tipo só para as duas finalidades — o texto muda pela finalidade lida do
     * próprio desafio, em {@code reference_id}. Dois tipos aqui obrigariam a fila a
     * saber algo que a tabela do desafio já diz.
     */
    ADMIN_CHALLENGE_CODE
}
