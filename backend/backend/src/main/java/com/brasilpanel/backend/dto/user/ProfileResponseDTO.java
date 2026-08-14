package com.brasilpanel.backend.dto.user;

import com.brasilpanel.backend.model.EducationLevel;
import com.brasilpanel.backend.model.ProfessionalArea;

import java.time.LocalDateTime;

/**
 * Estado do perfil profissional.
 *
 * @param onboardingCompletedAt quando o usuário passou pelo onboarding, tendo
 *        preenchido o perfil ou pulado. {@code null} significa que a etapa ainda
 *        não foi vista — é o que permite ao frontend decidir se deve exibi-la sem
 *        confundir "pulou" com "nunca chegou lá". Não é remarcado quando o perfil
 *        é editado depois.
 */
public record ProfileResponseDTO(
        String profession,
        ProfessionalArea area,
        EducationLevel educationLevel,
        String institution,
        LocalDateTime onboardingCompletedAt
) {}
