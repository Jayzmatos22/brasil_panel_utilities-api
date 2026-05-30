package com.brasilpanel.backend.dto.api.ipea;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

// Camada geral - corpo inteirio da API.
public record IpeaResponseDTO(
        @JsonProperty("value") List<IpeaItemDTO> value
) {}
