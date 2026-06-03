package com.brasilpanel.backend.dto.api.ibge;

public record EstadoRankingDTO(
        String sigla,
        String nome,
        long totalMunicipios
) {}