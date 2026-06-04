package com.brasilpanel.backend.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ResendCodeRequestDTO(

        @Email
        @NotBlank(message = "E-mail obrigatório")
        String email

) {}