package com.brasilpanel.backend.dto.api.ipea;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.time.OffsetDateTime;


public record IpeaItemDTO(
        @JsonAlias("VALDATA") OffsetDateTime data,
        @JsonAlias("VALVALOR") Double valor
) {}