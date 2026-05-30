package com.brasilpanel.backend.dto.api.ibge;

public record EstadoDTO(
        Integer id,
        String sigla,
        String nome,
        RegiaoDTO regiao
) {}
