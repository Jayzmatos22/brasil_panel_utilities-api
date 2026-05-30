package com.brasilpanel.backend.dto.user;
import jakarta.validation.constraints.*;


public record LoginRequestDTO(
        @Email(message = "Formato de e-mail inválido")
        @NotBlank(message = "E-mail obrigatório")
        String email,

        @NotBlank(message = "Senha obrigatória!")
        String password
) {}
