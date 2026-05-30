package com.brasilpanel.backend.dto.api.ipea;

import java.util.List;

// Cada séria possui um objeto "IpeaItemDTO"
public record IpeaSerieDTO(
        String codigo,
        String nome,
        List<IpeaItemDTO> dados
) {}
