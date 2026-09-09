package com.brasilpanel.backend.dto.user;
import jakarta.validation.constraints.*;

public record UserRequestDTO(

        @NotBlank(message = "Nome obrigatório!")
        @Pattern(regexp = ValidacaoUsuario.NOME, message = ValidacaoUsuario.NOME_INVALIDO)
        String name,

        @Email(message = "Formato de e-mail inválido")
        @Pattern(
                regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                message = "E-mail inválido"
        )
        @NotBlank(message = "E-mail obrigatório")
        String email,

        @NotBlank(message = "Senha obrigatória!")
        @Pattern(regexp = ValidacaoUsuario.SENHA_FORTE, message = ValidacaoUsuario.SENHA_FRACA)
        String password

) {}
