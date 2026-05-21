package com.brasilpanel.backend.dto.api.bcb;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CdiDataDTO(
        @JsonProperty("data") String date,
        @JsonProperty("valor") Double value
) {}
