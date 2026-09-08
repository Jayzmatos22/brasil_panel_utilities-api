package com.brasilpanel.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Confirmação do segundo fator da troca de senha do admin.
 *
 * <p>Só o código: a senha nova já ficou retida no desafio quando a troca foi pedida, e
 * a sessão em curso identifica quem está confirmando.
 */
public record ConfirmAdminPasswordRequestDTO(
        @NotBlank(message = "Código obrigatório")
        @Pattern(regexp = "\\d{6}", message = "Código deve ter 6 dígitos")
        String code
) {}
