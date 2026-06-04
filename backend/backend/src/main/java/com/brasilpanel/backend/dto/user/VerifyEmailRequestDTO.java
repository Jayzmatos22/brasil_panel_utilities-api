package com.brasilpanel.backend.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyEmailRequestDTO(

        @Email
        @NotBlank(message = "E-mail obrigatório")
        String email,

        @NotBlank(message = "Código obrigatório")
        @Pattern(regexp = "\\d{6}", message = "Código deve ter 6 dígitos")
        String code

) {}