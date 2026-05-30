package com.brasilpanel.backend.dto.api.ipea;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.OffsetDateTime;


public record IpeaItemDTO(
        @JsonProperty("VALDATA") OffsetDateTime data,
        @JsonProperty("VALVALOR") Double valor
) {}