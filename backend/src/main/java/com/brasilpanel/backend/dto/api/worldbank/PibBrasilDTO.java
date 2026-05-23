package com.brasilpanel.backend.dto.api.worldbank;

// worldbank api
public record PibBrasilDTO(
        String year,
        Double value,
        String currency
) {}
