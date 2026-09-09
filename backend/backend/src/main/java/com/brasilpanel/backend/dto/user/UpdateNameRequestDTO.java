package com.brasilpanel.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateNameRequestDTO(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        @Pattern(regexp = ValidacaoUsuario.NOME, message = ValidacaoUsuario.NOME_INVALIDO)
        String name
) {}
