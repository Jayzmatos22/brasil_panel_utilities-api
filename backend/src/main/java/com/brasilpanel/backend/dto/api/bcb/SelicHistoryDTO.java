package com.brasilpanel.backend.dto.api.bcb;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public record SelicHistoryDTO(
        @JsonAlias("data") String date,
        @JsonAlias("valor") Double value
) {}
