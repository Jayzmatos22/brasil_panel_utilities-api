package com.brasilpanel.backend.dto.user;

import com.brasilpanel.backend.model.EducationLevel;
import com.brasilpanel.backend.model.ProfessionalArea;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Perfil profissional enviado pelo onboarding.
 *
 * <p>{@code profession} e {@code educationLevel} são obrigatórios; {@code area} e
 * {@code institution} são opcionais. A regra espelha a validação da tela — quem
 * não quer responder usa "pular por agora", que é outro endpoint, e não um envio
 * parcial deste.
 *
 * <p>Os limites de tamanho batem com as colunas (varchar 120 e 160): sem eles um
 * envio maior só falharia no INSERT, virando 500 em vez de 400.
 */
public record ProfileRequestDTO(

        @NotBlank(message = "Profissão obrigatória")
        @Size(max = 120, message = "Profissão deve ter no máximo 120 caracteres")
        String profession,

        ProfessionalArea area,

        @NotNull(message = "Escolaridade obrigatória")
        EducationLevel educationLevel,

        @Size(max = 160, message = "Instituição deve ter no máximo 160 caracteres")
        String institution

) {}
