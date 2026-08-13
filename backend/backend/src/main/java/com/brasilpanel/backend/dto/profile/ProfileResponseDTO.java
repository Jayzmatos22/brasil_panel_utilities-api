package com.brasilpanel.backend.dto.profile;

import java.time.LocalDateTime;

/**
 * Perfil já resolvido para exibição: cada referência traz id + nome, para o
 * front mostrar o rótulo sem reconsultar o catálogo. Campos não preenchidos
 * vêm {@code null}.
 */
public record ProfileResponseDTO(
        Ref professionArea,
        Ref professionSubarea,
        Ref professionLevel,
        String professionTitle,
        Ref educationArea,
        Ref educationSubarea,
        Ref educationLevel,
        String institution,
        LocalDateTime updatedAt
) {
    public record Ref(Long id, String slug, String name) {}
}
