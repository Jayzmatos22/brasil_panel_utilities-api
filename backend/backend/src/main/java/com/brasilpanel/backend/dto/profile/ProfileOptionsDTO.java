package com.brasilpanel.backend.dto.profile;

import java.util.List;

/**
 * Catálogo de opções para montar os selects em cascata do onboarding e das
 * configurações. A árvore área → subárea é compartilhada entre profissão e
 * educação; só os níveis são separados.
 */
public record ProfileOptionsDTO(
        List<AreaOption> areas,
        List<LevelOption> educationLevels,
        List<LevelOption> professionLevels
) {
    public record AreaOption(Long id, String slug, String name, List<SubareaOption> subareas) {}

    public record SubareaOption(Long id, String slug, String name) {}

    public record LevelOption(Long id, String slug, String name) {}
}
