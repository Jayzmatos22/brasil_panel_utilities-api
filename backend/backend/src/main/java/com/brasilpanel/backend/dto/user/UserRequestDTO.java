package com.brasilpanel.backend.dto.user;
import jakarta.validation.constraints.*;

public record UserRequestDTO(

        @NotBlank(message = "Nome obrigatório!")
        String name,

        @Email(message = "Formato de e-mail inválido")
        @Pattern(
                regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                message = "E-mail inválido"
        )
        @NotBlank(message = "E-mail obrigatório")
        String email,

        @NotBlank(message = "Senha obrigatória!")
        @Size(min = 8, message = "Senha deve ter no mínimo 8 caracteres.")
        String password

) {}
