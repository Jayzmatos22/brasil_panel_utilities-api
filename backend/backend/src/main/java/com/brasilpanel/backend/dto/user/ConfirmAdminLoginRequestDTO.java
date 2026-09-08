package com.brasilpanel.backend.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Confirmação do segundo fator do login de admin.
 *
 * <p>A senha vem de novo de propósito. Sem ela, bastaria o e-mail do admin para disparar
 * tentativas de código contra um desafio legítimo — e como cada desafio queima após 5
 * erros, qualquer um trancaria o login do dono sem nunca ter tido a senha. Exigindo a
 * senha, quem não a tem não chega nem a testar o código. O frontend já a mantém do
 * formulário de login, então não custa nada ao usuário.
 */
public record ConfirmAdminLoginRequestDTO(
        @Email(message = "E-mail inválido")
        @NotBlank(message = "E-mail obrigatório")
        String email,

        @NotBlank(message = "Senha obrigatória")
        String password,

        @NotBlank(message = "Código obrigatório")
        @Pattern(regexp = "\\d{6}", message = "Código deve ter 6 dígitos")
        String code
) {}
