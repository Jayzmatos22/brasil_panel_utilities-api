package com.brasilpanel.backend.dto.user;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequestDTO(
        @NotBlank(message = "Senha é obrigatória para confirmar exclusão")
        String password
) {}
