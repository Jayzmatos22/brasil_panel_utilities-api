package com.brasilpanel.backend.dto.api.bcb;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DollarPtaxDTO(
        @JsonProperty("data") String date,
        @JsonProperty("valor") Double value
) {}
