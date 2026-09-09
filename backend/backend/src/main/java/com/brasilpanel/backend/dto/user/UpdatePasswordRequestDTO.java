package com.brasilpanel.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdatePasswordRequestDTO(
        @NotBlank(message = "Senha atual é obrigatória")
        String currentPassword,

        @NotBlank(message = "Nova senha é obrigatória")
        @Pattern(regexp = ValidacaoUsuario.SENHA_FORTE, message = ValidacaoUsuario.SENHA_FRACA)
        String newPassword
) {}
