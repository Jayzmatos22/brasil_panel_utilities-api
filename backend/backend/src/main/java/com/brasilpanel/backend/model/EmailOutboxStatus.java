package com.brasilpanel.backend.model;

/** Estado de uma entrada da fila de e-mail. */
public enum EmailOutboxStatus {

    /** Aguardando envio, ou aguardando a próxima tentativa após falha. */
    PENDING,

    /** Entregue ao servidor SMTP sem erro. */
    SENT,

    /** Esgotou as tentativas. Fica no banco para diagnóstico. */
    FAILED,

    /**
     * Deixou de fazer sentido antes de ser enviada — o usuário já se verificou por
     * outro código, ou a conta foi removida. Não é erro: é a fila se autocorrigindo.
     */
    OBSOLETE
}
