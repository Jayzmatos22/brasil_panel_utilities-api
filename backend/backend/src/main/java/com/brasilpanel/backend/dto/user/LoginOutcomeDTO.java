package com.brasilpanel.backend.dto.user;

/**
 * Resultado de um login que passou pelas credenciais.
 *
 * <p>Duas saídas possíveis: sessão emitida ({@code auth} preenchido) ou desafio de
 * segundo fator pendente. O tipo carrega as duas porque só o serviço sabe qual ocorreu —
 * deixar o controller descobrir por {@code null} espalharia a regra.
 */
public record LoginOutcomeDTO(
        boolean twoFactorRequired,
        String message,
        AuthResponseDTO auth) {

    public static LoginOutcomeDTO autenticado(AuthResponseDTO auth) {
        return new LoginOutcomeDTO(false, null, auth);
    }

    public static LoginOutcomeDTO desafioPendente(String message) {
        return new LoginOutcomeDTO(true, message, null);
    }
}
