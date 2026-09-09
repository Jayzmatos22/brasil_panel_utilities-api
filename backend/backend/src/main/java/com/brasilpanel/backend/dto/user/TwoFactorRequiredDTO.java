package com.brasilpanel.backend.dto.user;

/**
 * Resposta de uma ação de admin que ficou pendente de confirmação por e-mail.
 *
 * <p>O flag existe para o cliente não precisar interpretar o código HTTP: um 202 sem
 * corpo tipado obrigaria o frontend a inferir o significado da ausência de sessão.
 */
public record TwoFactorRequiredDTO(
        boolean twoFactorRequired,
        String message) {

    public static TwoFactorRequiredDTO of(String message) {
        return new TwoFactorRequiredDTO(true, message);
    }
}
