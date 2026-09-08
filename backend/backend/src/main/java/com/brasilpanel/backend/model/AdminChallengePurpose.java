package com.brasilpanel.backend.model;

/** Ação de admin que exige confirmação por e-mail antes de valer. */
public enum AdminChallengePurpose {

    /** Login: as credenciais já foram aceitas, mas a sessão só nasce após o código. */
    LOGIN,

    /** Troca de senha: a senha nova fica retida no desafio até a confirmação. */
    PASSWORD_CHANGE
}
