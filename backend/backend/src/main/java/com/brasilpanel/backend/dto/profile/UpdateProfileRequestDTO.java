package com.brasilpanel.backend.dto.profile;

import jakarta.validation.constraints.Size;

/**
 * Payload de gravação do perfil (onboarding e configurações). Todos os campos
 * são opcionais — o usuário pode preencher só parte agora e completar depois.
 *
 * <p>Coerência (subárea pertencer à área, ids existirem) é validada no
 * {@code ProfileService}, não por anotação, porque depende do banco.
 */
public record UpdateProfileRequestDTO(

        Long professionAreaId,
        Long professionSubareaId,
        Long professionLevelId,

        @Size(max = 120, message = "Cargo deve ter no máximo 120 caracteres.")
        String professionTitle,

        Long educationAreaId,
        Long educationSubareaId,
        Long educationLevelId,

        @Size(max = 120, message = "Instituição deve ter no máximo 120 caracteres.")
        String institution
) {}
