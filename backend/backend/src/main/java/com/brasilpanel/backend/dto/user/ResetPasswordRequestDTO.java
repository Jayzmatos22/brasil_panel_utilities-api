package com.brasilpanel.backend.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Redefinição de senha com o código recebido por e-mail.
 *
 * <p>Não pede a senha atual — é justamente quem não a sabe que chega aqui. O que prova o
 * direito de trocar é o código, e o código só existe na caixa de entrada da conta.
 */
public record ResetPasswordRequestDTO(
        @Email(message = "E-mail inválido")
        @NotBlank(message = "E-mail obrigatório")
        String email,

        @NotBlank(message = "Código obrigatório")
        @Pattern(regexp = "\\d{6}", message = "Código deve ter 6 dígitos")
        String code,

        @NotBlank(message = "Nova senha é obrigatória")
        @Size(min = 8, message = "Nova senha deve ter ao menos 8 caracteres")
        String newPassword
) {}
