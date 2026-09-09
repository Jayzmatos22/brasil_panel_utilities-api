package com.brasilpanel.backend.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Pedido de recuperação de senha. */
public record ForgotPasswordRequestDTO(
        @Email(message = "E-mail inválido")
        @NotBlank(message = "E-mail obrigatório")
        String email
) {}
