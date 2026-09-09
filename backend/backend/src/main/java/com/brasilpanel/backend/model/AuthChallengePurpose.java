package com.brasilpanel.backend.model;

/**
 * Ação que exige confirmação por e-mail antes de valer.
 *
 * <p>A finalidade isola os fluxos: a conferência procura o desafio vigente <em>daquela</em>
 * finalidade, então um código emitido para um fim nunca autoriza outro.
 */
public enum AuthChallengePurpose {

    /** Login: as credenciais já foram aceitas, mas a sessão só nasce após o código. */
    LOGIN,

    /** Troca de senha por quem já está dentro: a senha nova fica retida até a confirmação. */
    PASSWORD_CHANGE,

    /**
     * Recuperação de senha por quem está de fora — não sabe a senha atual e prova o acesso
     * pela caixa de entrada. Vale para qualquer usuário, não só admin.
     */
    PASSWORD_RESET
}
