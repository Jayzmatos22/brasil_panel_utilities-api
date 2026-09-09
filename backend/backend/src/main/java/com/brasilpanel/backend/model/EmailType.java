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
    ADMIN_CHALLENGE_CODE,

    /**
     * Código de 6 dígitos da recuperação de senha.
     *
     * <p>Tipo separado do de admin, e não uma finalidade a mais dentro dele, porque o
     * valor do enum é persistido como texto em {@code email_outbox}: renomear o antigo
     * quebraria a leitura de qualquer entrada ainda na fila no momento do deploy.
     */
    PASSWORD_RESET_CODE
}
