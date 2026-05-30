package com.brasilpanel.backend.dto.api.bcb;

// dailyRate  → taxa diária (%) retornada pela BCB — série 12
// annualRate → taxa anual (%) calculada: (1 + diária/100)^252 − 1
public record CdiDataDTO(
        String date,
        Double dailyRate,
        Double annualRate
) {}
